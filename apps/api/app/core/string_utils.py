from slugify import slugify


def slugify_vietnamese(text: str) -> str:
    """Convert Vietnamese and special characters to clean URL slug."""
    return slugify(text, regex_pattern=r'[^-a-z0-9_]')
