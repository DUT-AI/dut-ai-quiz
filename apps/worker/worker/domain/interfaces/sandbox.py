from abc import ABC, abstractmethod
from typing import Any, Dict


class ISandbox(ABC):
    @abstractmethod
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
        """
        Executes a script inside an isolated environment.
        """
        pass
