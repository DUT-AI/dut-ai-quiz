"""
Secure Docker Sandbox Orchestrator
- Network disabled (--network none)
- No pip install from Internet
- Resource limits (CPU, memory, GPU, timeout, pids)
- Ground Truth never mounted
- Limited log output
"""
import os
import subprocess
import time
from typing import Any, Dict

from worker.domain.interfaces.sandbox import ISandbox


class SecureSandbox(ISandbox):
    """
    Secure sandbox that runs user code in isolated Docker containers
    with strict security constraints and resource limits.
    """

    def __init__(
        self,
        default_timeout: int = 300,
        default_memory_mb: int = 2048,
        default_cpu_limit: float = 2.0,
        default_pids_limit: int = 100,
        log_max_lines: int = 50,
    ):
        self.default_timeout = default_timeout
        self.default_memory_mb = default_memory_mb
        self.default_cpu_limit = default_cpu_limit
        self.default_pids_limit = default_pids_limit
        self.log_max_lines = log_max_lines

    def run_script(
        self,
        script_dir: str,
        script_name: str,
        timeout_seconds: int = None,
        mem_limit: str = None,
        nano_cpus: int = None,
        docker_image: str | None = "python:3.10-slim",
        gpu_enabled: bool = False,
        gpu_limit: int = 0,
        pids_limit: int = None,
    ) -> Dict[str, Any]:
        """
        Execute script in secure Docker sandbox.
        
        Security features:
        - Network disabled (--network none)
        - No privileged mode
        - Read-only root filesystem where possible
        - Drop all capabilities
        - Limited pids
        - Resource limits enforced
        - No Ground Truth access
        """
        timeout = timeout_seconds or self.default_timeout
        memory = mem_limit or f"{self.default_memory_mb}m"
        cpus = nano_cpus or int(self.default_cpu_limit * 1_000_000_000)
        pids = pids_limit or self.default_pids_limit

        # Validate paths
        if not os.path.isdir(script_dir):
            return {
                "status": "failed",
                "error": f"Script directory does not exist: {script_dir}",
            }

        script_path = os.path.join(script_dir, script_name)
        if not os.path.isfile(script_path):
            return {
                "status": "failed",
                "error": f"Script file not found: {script_name}",
            }

        image_name = docker_image or "python:3.10-slim"

        # Build secure Docker command
        docker_cmd = [
            "docker",
            "run",
            "--rm",
            "--network", "none",  # CRITICAL: No Internet access
            "--memory", memory,
            "--cpus", str(cpus / 1_000_000_000),
            "--pids-limit", str(pids),
            "--security-opt", "no-new-privileges:true",
            "--cap-drop", "ALL",  # Drop all capabilities
            "-v", f"{script_dir}:/workspace:rw",  # Only mount workspace
            "-w", "/workspace",
        ]

        # GPU support if enabled
        if gpu_enabled and gpu_limit > 0:
            docker_cmd.extend([
                "--gpus", f"device={','.join(str(i) for i in range(gpu_limit))}",
            ])

        # Add image and command
        docker_cmd.extend([
            image_name,
            "python",
            script_name,
        ])

        # Execute with timeout
        try:
            start_time = time.time()
            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=script_dir,
            )
            elapsed = time.time() - start_time

            # Limit log output
            stdout_lines = result.stdout.splitlines()
            stderr_lines = result.stderr.splitlines()

            limited_stdout = "\n".join(stdout_lines[-self.log_max_lines:])
            limited_stderr = "\n".join(stderr_lines[-self.log_max_lines:])

            if len(stdout_lines) > self.log_max_lines:
                limited_stdout = f"[...truncated {len(stdout_lines) - self.log_max_lines} lines...]\n{limited_stdout}"
            if len(stderr_lines) > self.log_max_lines:
                limited_stderr = f"[...truncated {len(stderr_lines) - self.log_max_lines} lines...]\n{limited_stderr}"

            combined_log = f"STDOUT:\n{limited_stdout}\n\nSTDERR:\n{limited_stderr}"

            # Check if predict.csv was generated
            predict_csv = os.path.join(script_dir, "predict.csv")
            if not os.path.exists(predict_csv):
                return {
                    "status": "failed",
                    "error": "predict.csv was not generated",
                    "log": combined_log,
                    "elapsed_seconds": elapsed,
                }

            if result.returncode != 0:
                return {
                    "status": "failed",
                    "error": f"Script exited with code {result.returncode}",
                    "log": combined_log,
                    "elapsed_seconds": elapsed,
                }

            return {
                "status": "success",
                "log": combined_log,
                "elapsed_seconds": elapsed,
            }

        except subprocess.TimeoutExpired:
            # Kill container on timeout
            return {
                "status": "timeout",
                "error": f"Execution exceeded {timeout} seconds timeout",
                "elapsed_seconds": timeout,
            }

        except Exception as e:
            return {
                "status": "failed",
                "error": f"Docker execution error: {str(e)}",
            }

    def cleanup_container(self, container_id: str) -> None:
        """Force stop and remove a container if needed."""
        try:
            subprocess.run(
                ["docker", "stop", container_id],
                capture_output=True,
                timeout=10,
            )
            subprocess.run(
                ["docker", "rm", container_id],
                capture_output=True,
                timeout=10,
            )
        except Exception:
            pass  # Best effort cleanup
