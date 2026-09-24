from abc import ABC, abstractmethod


class IArtifactStore(ABC):
    @abstractmethod
    def download_file(self, key_or_url: str, destination_path: str) -> None:
        """Download an artifact reference to a local path."""
        pass

    @abstractmethod
    def upload_file(self, source_path: str, key: str, content_type: str | None = None) -> str:
        """Upload a local artifact and return its object URL."""
        pass

    @abstractmethod
    def object_key_from_reference(self, key_or_url: str) -> str:
        """Normalize an S3 key or object URL into a bucket key."""
        pass
