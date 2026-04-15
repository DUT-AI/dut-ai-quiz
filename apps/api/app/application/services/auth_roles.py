def quiz_role_from_manage(role_name: str) -> str:
    if role_name == "admin":
        return "teacher"
    if role_name in ("teammate", "leader"):
        return "student"
    msg = f"Unsupported role_name: {role_name}"
    raise ValueError(msg)
