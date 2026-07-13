import asyncio
import os
import time
from typing import Any, Dict

import docker
from docker.errors import APIError, ContainerError, ImageNotFound
from loguru import logger
from worker.domain.interfaces.sandbox import CancelCheck, ISandbox


class DockerSandbox(ISandbox):
    def __init__(
        self, image_name: str = "python:3.12-slim", log_tail_lines: int = 200
    ):
        self.client = docker.from_env()
        self.image_name = image_name
        self.log_tail_lines = log_tail_lines

    async def run_script(
        self,
        script_dir: str,
        script_name: str,
        timeout_seconds: int = 30,
        mem_limit: str = "256m",
        nano_cpus: int = 1000000000,
        submission_id: str | None = None,
        cancel_check: CancelCheck | None = None,
    ) -> Dict[str, Any]:
        await asyncio.to_thread(self._ensure_image)

        container = None
        result = {"status": "failed", "exit_code": -1, "logs": "", "error": None}

        abs_script_dir = os.path.abspath(script_dir)

        try:
            if submission_id:
                await asyncio.to_thread(self._remove_existing_container, submission_id)

            create_kwargs = self._build_create_kwargs(
                abs_script_dir=abs_script_dir,
                script_name=script_name,
                mem_limit=mem_limit,
                nano_cpus=nano_cpus,
                submission_id=submission_id,
            )

            container = await asyncio.to_thread(
                self.client.containers.create, **create_kwargs
            )
            await asyncio.to_thread(container.start)

            deadline = time.monotonic() + timeout_seconds
            while True:
                if cancel_check and await cancel_check():
                    await self._kill_container(container)
                    result["status"] = "cancelled"
                    result["error"] = "Execution cancelled by user."
                    result["logs"] = await self._read_logs(container)
                    return result

                await asyncio.to_thread(container.reload)
                if container.status in {"exited", "dead"}:
                    wait_res = await asyncio.to_thread(container.wait)
                    exit_code = wait_res.get("StatusCode", 0)
                    logs = await self._read_logs(container)

                    result["status"] = "success" if exit_code == 0 else "failed"
                    result["exit_code"] = exit_code
                    result["logs"] = logs
                    if exit_code != 0:
                        result["error"] = f"Container exited with code {exit_code}."
                    return result

                if time.monotonic() >= deadline:
                    await self._kill_container(container)
                    result["status"] = "timeout"
                    result["error"] = (
                        f"Execution timed out after {timeout_seconds} seconds."
                    )
                    result["logs"] = await self._read_logs(container)
                    return result

                await asyncio.sleep(1)
        except ContainerError as e:
            result["error"] = f"Container error: {str(e)}"
            result["logs"] = (
                e.stderr.decode("utf-8", errors="replace") if e.stderr else ""
            )
        except APIError as e:
            result["error"] = f"Docker API error: {str(e)}"
        except Exception as e:
            result["error"] = f"Unexpected error: {str(e)}"
        finally:
            if container:
                try:
                    await asyncio.to_thread(container.remove, force=True)
                except Exception as e:
                    logger.error(f"Error removing container: {e}")

        return result

    def _ensure_image(self) -> None:
        try:
            self.client.images.get(self.image_name)
        except ImageNotFound:
            logger.info(f"Image {self.image_name} not found. Pulling...")
            self.client.images.pull(self.image_name)

    def _build_create_kwargs(
        self,
        abs_script_dir: str,
        script_name: str,
        mem_limit: str,
        nano_cpus: int,
        submission_id: str | None,
    ) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "image": self.image_name,
            "command": ["python", script_name],
            "volumes": {abs_script_dir: {"bind": "/sandbox", "mode": "rw"}},
            "working_dir": "/sandbox",
            "network_mode": "none",
            "mem_limit": mem_limit,
            "nano_cpus": nano_cpus,
            "detach": True,
            "labels": {"dut-ai-quiz.component": "submission-sandbox"},
        }
        if submission_id:
            kwargs["name"] = f"dut-ai-submission-{submission_id}"
            kwargs["labels"]["dut-ai-quiz.submission_id"] = submission_id
        return kwargs

    def _remove_existing_container(self, submission_id: str) -> None:
        filters = {"label": f"dut-ai-quiz.submission_id={submission_id}"}
        for container in self.client.containers.list(all=True, filters=filters):
            try:
                container.remove(force=True)
            except Exception as exc:
                logger.warning(
                    f"Could not remove stale container for {submission_id}: {exc}"
                )

    async def _read_logs(self, container) -> str:
        try:
            raw_logs = await asyncio.to_thread(
                container.logs, stdout=True, stderr=True, tail=self.log_tail_lines
            )
            return raw_logs.decode("utf-8", errors="replace")
        except Exception as exc:
            logger.warning(f"Could not read sandbox logs: {exc}")
            return ""

    async def _kill_container(self, container) -> None:
        try:
            await asyncio.to_thread(container.kill)
        except Exception as exc:
            logger.warning(f"Could not kill sandbox container: {exc}")
