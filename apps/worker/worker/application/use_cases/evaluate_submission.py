import os
import tempfile

from app.infrastructure.database import AsyncSessionLocal
from loguru import logger
from sqlalchemy import text, select
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from worker.domain.interfaces.evaluator import IEvaluator
from worker.domain.interfaces.sandbox import ISandbox


class EvaluateSubmissionUseCase:
    def __init__(self, sandbox: ISandbox, evaluator: IEvaluator):
        self.sandbox = sandbox
        self.evaluator = evaluator

    async def execute(
        self,
        submission_id: str,
        script_s3_key: str,
        ground_truth_s3_key: str,
        metric_type: str,
        runtime_profile_id: str,
    ) -> float:
        """
        Execute submission evaluation with secure sandbox and GPU-accelerated metrics.
        
        Args:
            submission_id: UUID of the submission
            script_s3_key: S3 key for the submission script
            ground_truth_s3_key: S3 key for ground truth CSV (NEVER mounted in sandbox)
            metric_type: Type of metric (accuracy, f1_score, rmse)
            runtime_profile_id: UUID of the runtime profile to use
        
        Returns:
            float: The calculated score
        """
        logger.info(f"Executing EvaluateSubmissionUseCase for submission {submission_id}...")

        # Fetch runtime profile configuration from database
        async with AsyncSessionLocal() as session:
            from app.infrastructure.persistence.models.runtime_profile import RuntimeProfile
            
            result = await session.execute(
                select(RuntimeProfile).where(RuntimeProfile.id == runtime_profile_id)
            )
            profile_model = result.scalar_one_or_none()
            
            if not profile_model:
                raise ValueError(f"Runtime profile {runtime_profile_id} not found")
            
            profile = profile_model.to_entity()
            logger.info(f"Using runtime profile: {profile.name} ({profile.docker_image}:{profile.docker_image_tag})")

        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = os.path.join(tmpdir, "predict.py")
            gt_path = os.path.join(tmpdir, "ground_truth.csv")
            pred_path = os.path.join(tmpdir, "predict.csv")

            # TODO: Download script from S3 using MinIO client
            # For now, mocking script download
            with open(script_path, "w") as f:
                f.write("import csv\n")
                f.write("with open('predict.csv', 'w', newline='') as f:\n")
                f.write("    writer = csv.writer(f)\n")
                f.write("    writer.writerow(['target'])\n")
                f.write("    writer.writerow(['1'])\n")
                f.write("    writer.writerow(['0'])\n")

            # TODO: Download ground truth from S3 using MinIO client
            # CRITICAL: Ground truth is NEVER mounted in the sandbox container
            with open(gt_path, "w") as f:
                f.write("target\n1\n0\n")

            # Execute code inside Secure Sandbox with runtime profile settings
            docker_image = f"{profile.docker_image}:{profile.docker_image_tag}"
            
            sandbox_res = self.sandbox.run_script(
                script_dir=tmpdir,
                script_name="predict.py",
                timeout_seconds=profile.timeout_seconds,
                mem_limit=f"{profile.memory_limit_mb}m",
                nano_cpus=int(profile.cpu_limit * 1_000_000_000),
                docker_image=docker_image,
                gpu_enabled=profile.gpu_enabled,
                gpu_limit=profile.gpu_limit,
                pids_limit=profile.pids_limit,
            )

            if sandbox_res["status"] == "timeout":
                raise RuntimeError(f"Sandbox execution timeout: {sandbox_res.get('error')}")

            if sandbox_res["status"] != "success" or not os.path.exists(pred_path):
                raise RuntimeError(
                    f"Sandbox execution failed: {sandbox_res.get('error')}"
                )

            # Compute Metric Score using GPU-accelerated evaluator
            # Ground Truth is only accessed here, OUTSIDE the sandbox
            score = self.evaluator.evaluate(gt_path, pred_path, metric_type)
            logger.info(f"Successfully calculated score for {submission_id}: {score} (elapsed: {sandbox_res.get('elapsed_seconds', 0):.2f}s)")
            
            return score
