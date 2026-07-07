"""
Script to seed the database with sample runtime profiles.
Run: python -m scripts.seed_runtime_profiles
"""
import asyncio
import json
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.runtime_profile import RuntimeProfile


SAMPLE_PROFILES = [
    {
        "name": "classic-ml-cpu",
        "display_name": "Classic ML (CPU Only)",
        "description": "NumPy, Pandas, Scikit-learn, SciPy, Matplotlib. Suitable for traditional ML tasks without GPU requirements.",
        "docker_image": "python",
        "docker_image_tag": "3.10-slim",
        "python_version": "3.10",
        "cuda_version": None,
        "allowed_packages_json": json.dumps({
            "numpy": "1.24.3",
            "pandas": "2.0.3",
            "scikit-learn": "1.3.0",
            "scipy": "1.11.1",
            "matplotlib": "3.7.2",
            "seaborn": "0.12.2"
        }),
        "cpu_limit": 2.0,
        "memory_limit_mb": 2048,
        "gpu_enabled": False,
        "gpu_limit": 0,
        "timeout_seconds": 300,
        "pids_limit": 100,
        "is_active": True,
    },
    {
        "name": "cv-gpu",
        "display_name": "Computer Vision (GPU)",
        "description": "PyTorch, Torchvision, OpenCV, Albumentations. GPU-accelerated for image processing and deep learning.",
        "docker_image": "pytorch/pytorch",
        "docker_image_tag": "2.0.1-cuda11.8-cudnn8-runtime",
        "python_version": "3.10",
        "cuda_version": "11.8",
        "allowed_packages_json": json.dumps({
            "torch": "2.0.1",
            "torchvision": "0.15.2",
            "opencv-python": "4.8.0.74",
            "pillow": "10.0.0",
            "albumentations": "1.3.1",
            "timm": "0.9.5"
        }),
        "cpu_limit": 4.0,
        "memory_limit_mb": 8192,
        "gpu_enabled": True,
        "gpu_limit": 1,
        "timeout_seconds": 600,
        "pids_limit": 200,
        "is_active": True,
    },
    {
        "name": "nlp-gpu",
        "display_name": "NLP (GPU)",
        "description": "PyTorch, Transformers, Tokenizers. GPU-accelerated for natural language processing.",
        "docker_image": "pytorch/pytorch",
        "docker_image_tag": "2.0.1-cuda11.8-cudnn8-runtime",
        "python_version": "3.10",
        "cuda_version": "11.8",
        "allowed_packages_json": json.dumps({
            "torch": "2.0.1",
            "transformers": "4.31.0",
            "tokenizers": "0.13.3",
            "sentencepiece": "0.1.99",
            "nltk": "3.8.1",
            "spacy": "3.6.0"
        }),
        "cpu_limit": 4.0,
        "memory_limit_mb": 8192,
        "gpu_enabled": True,
        "gpu_limit": 1,
        "timeout_seconds": 600,
        "pids_limit": 200,
        "is_active": True,
    },
    {
        "name": "tensorflow-gpu",
        "display_name": "TensorFlow (GPU)",
        "description": "TensorFlow, Keras. GPU-accelerated for deep learning with TensorFlow.",
        "docker_image": "tensorflow/tensorflow",
        "docker_image_tag": "2.13.0-gpu",
        "python_version": "3.10",
        "cuda_version": "11.8",
        "allowed_packages_json": json.dumps({
            "tensorflow": "2.13.0",
            "keras": "2.13.1",
            "numpy": "1.24.3",
            "pandas": "2.0.3",
            "scikit-learn": "1.3.0"
        }),
        "cpu_limit": 4.0,
        "memory_limit_mb": 8192,
        "gpu_enabled": True,
        "gpu_limit": 1,
        "timeout_seconds": 600,
        "pids_limit": 200,
        "is_active": True,
    },
    {
        "name": "audio-gpu",
        "display_name": "Audio Processing (GPU)",
        "description": "PyTorch, Librosa, Torchaudio. GPU-accelerated for audio processing and speech recognition.",
        "docker_image": "pytorch/pytorch",
        "docker_image_tag": "2.0.1-cuda11.8-cudnn8-runtime",
        "python_version": "3.10",
        "cuda_version": "11.8",
        "allowed_packages_json": json.dumps({
            "torch": "2.0.1",
            "torchaudio": "2.0.2",
            "librosa": "0.10.0",
            "soundfile": "0.12.1",
            "pydub": "0.25.1",
            "audiomentations": "0.31.0"
        }),
        "cpu_limit": 4.0,
        "memory_limit_mb": 8192,
        "gpu_enabled": True,
        "gpu_limit": 1,
        "timeout_seconds": 600,
        "pids_limit": 200,
        "is_active": True,
    },
]


async def seed_runtime_profiles():
    """Seed database with sample runtime profiles."""
    async with AsyncSessionLocal() as session:
        print("Seeding runtime profiles...")
        
        for profile_data in SAMPLE_PROFILES:
            # Check if profile already exists
            result = await session.execute(
                select(RuntimeProfile).where(RuntimeProfile.name == profile_data["name"])
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"  ⏭️  Profile '{profile_data['name']}' already exists, skipping")
                continue
            
            # Create new profile
            profile = RuntimeProfile(
                id=uuid4(),
                name=profile_data["name"],
                display_name=profile_data["display_name"],
                description=profile_data["description"],
                docker_image=profile_data["docker_image"],
                docker_image_tag=profile_data["docker_image_tag"],
                python_version=profile_data["python_version"],
                cuda_version=profile_data["cuda_version"],
                allowed_packages_json=profile_data["allowed_packages_json"],
                cpu_limit=profile_data["cpu_limit"],
                memory_limit_mb=profile_data["memory_limit_mb"],
                gpu_enabled=profile_data["gpu_enabled"],
                gpu_limit=profile_data["gpu_limit"],
                timeout_seconds=profile_data["timeout_seconds"],
                pids_limit=profile_data["pids_limit"],
                is_active=profile_data["is_active"],
                created_at=datetime.utcnow(),
            )
            
            session.add(profile)
            print(f"  ✅ Created profile: {profile_data['name']}")
        
        await session.commit()
        print("\n✨ Runtime profiles seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_runtime_profiles())
