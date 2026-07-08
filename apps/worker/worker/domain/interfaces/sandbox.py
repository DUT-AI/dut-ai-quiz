from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from typing import Any, Dict

CancelCheck = Callable[[], Awaitable[bool]]


class ISandbox(ABC):
    @abstractmethod
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
        """
        Executes a script inside an isolated environment.
        """
        pass
