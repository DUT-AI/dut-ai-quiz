import os
from typing import Any, Dict

import docker
from docker.errors import APIError, ContainerError, ImageNotFound
from loguru import logger
from worker.domain.interfaces.sandbox import ISandbox


class DockerSandbox(ISandbox):
    def __init__(self, image_name: str = "python:3.12-slim"):
        self.client = docker.from_env()
        self.image_name = image_name

    def run_script(
        self,
        script_dir: str,
        script_name: str,
        timeout_seconds: int = 30,
        mem_limit: str = "256m",
        nano_cpus: int = 1000000000,
    ) -> Dict[str, Any]:
        try:
            self.client.images.get(self.image_name)
        except ImageNotFound:
            logger.info(f"Image {self.image_name} not found. Pulling...")
            self.client.images.pull(self.image_name)

        container = None
        result = {"status": "failed", "exit_code": -1, "logs": "", "error": None}

        abs_script_dir = os.path.abspath(script_dir)

        try:
            container = self.client.containers.create(
                image=self.image_name,
                command=f"python {script_name}",
                volumes={abs_script_dir: {"bind": "/sandbox", "mode": "rw"}},
                working_dir="/sandbox",
                network_mode="none",
                mem_limit=mem_limit,
                nano_cpus=nano_cpus,
                detach=True,
            )

            container.start()
            wait_res = container.wait(timeout=timeout_seconds)
            exit_code = wait_res.get("StatusCode", 0)
            logs = container.logs().decode("utf-8", errors="replace")

            result["status"] = "success" if exit_code == 0 else "failed"
            result["exit_code"] = exit_code
            result["logs"] = logs

        except ContainerError as e:
            result["error"] = f"Container error: {str(e)}"
            result["logs"] = (
                e.stderr.decode("utf-8", errors="replace") if e.stderr else ""
            )
        except APIError as e:
            result["error"] = f"Docker API error: {str(e)}"
        except Exception as e:
            if "timeout" in str(e).lower() or isinstance(
                e, docker.errors.ContainerError
            ):
                result["status"] = "timeout"
                result["error"] = (
                    f"Execution timed out after {timeout_seconds} seconds."
                )
                if container:
                    try:
                        container.kill()
                    except Exception:
                        pass
            else:
                result["error"] = f"Unexpected error: {str(e)}"
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception as e:
                    logger.error(f"Error removing container: {e}")

        return result
