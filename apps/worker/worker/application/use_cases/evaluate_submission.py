import os
import tempfile

from app.infrastructure.database import AsyncSessionLocal
from loguru import logger
from sqlalchemy import text
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
    ) -> float:
        logger.info(f"Executing EvaluateSubmissionUseCase for {submission_id}...")

        # Verify DB connection from shared api repository
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("SELECT 1"))
            logger.debug(f"UseCase DB connection active: {res.scalar() == 1}")

        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = os.path.join(tmpdir, "predict.py")
            gt_path = os.path.join(tmpdir, "ground_truth.csv")
            pred_path = os.path.join(tmpdir, "predict.csv")

            # Mocking scripts and files download (In production, retrieve via MinIO S3 client)
            with open(script_path, "w") as f:
                f.write("import csv\n")
                f.write("with open('predict.csv', 'w', newline='') as f:\n")
                f.write("    writer = csv.writer(f)\n")
                f.write("    writer.writerow(['target'])\n")
                f.write("    writer.writerow(['1'])\n")
                f.write("    writer.writerow(['0'])\n")

            with open(gt_path, "w") as f:
                f.write("target\n1\n0\n")

            # Execute code inside Sandbox
            sandbox_res = self.sandbox.run_script(
                script_dir=tmpdir, script_name="predict.py", timeout_seconds=30
            )

            if sandbox_res["status"] != "success" or not os.path.exists(pred_path):
                raise RuntimeError(
                    f"Sandbox execution failed: {sandbox_res.get('error')}"
                )

            # Compute Metric Score
            score = self.evaluator.evaluate(gt_path, pred_path, metric_type)
            logger.info(f"Successfully calculated score for {submission_id}: {score}")
            return score
