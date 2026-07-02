from abc import ABC, abstractmethod
from typing import Any, Dict


class ISandbox(ABC):
    @abstractmethod
    def run_script(
        self,
        script_dir: str,
        script_name: str,
        timeout_seconds: int = 30,
        mem_limit: str = "256m",
        nano_cpus: int = 1000000000,
    ) -> Dict[str, Any]:
        """
        Executes a script inside an isolated environment.
        """
        pass
