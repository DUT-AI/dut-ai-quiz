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
        timeout_seconds: int | None = 30,
        mem_limit: str | None = "256m",
        nano_cpus: int | None = 1000000000,
        docker_image: str | None = None,
        gpu_enabled: bool = False,
        gpu_limit: int = 0,
        pids_limit: int | None = None,
    ) -> Dict[str, Any]:
        image_name = docker_image or self.image_name
        timeout = timeout_seconds or 30

        try:
            self.client.images.get(image_name)
        except ImageNotFound:
            logger.info(f"Image {image_name} not found. Pulling...")
            self.client.images.pull(image_name)

        container = None
        result = {"status": "failed", "exit_code": -1, "logs": "", "error": None}

        abs_script_dir = os.path.abspath(script_dir)

        try:
            container = self.client.containers.create(
                image=image_name,
                command=f"python {script_name}",
                volumes={abs_script_dir: {"bind": "/sandbox", "mode": "rw"}},
                working_dir="/sandbox",
                network_mode="none",
                mem_limit=mem_limit or "256m",
                nano_cpus=nano_cpus or 1000000000,
                pids_limit=pids_limit,
                detach=True,
            )

            container.start()
            wait_res = container.wait(timeout=timeout)
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
                    f"Execution timed out after {timeout} seconds."
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
