def quiz_role_from_manage(role_names: list[str] | str | None) -> str:
    if not role_names:
        return "guest"
    if isinstance(role_names, str):
        roles = [role_names]
    else:
        roles = role_names

    if "admin" in roles:
        return "admin"
    if "MENTOR" in roles:
        return "MENTOR"
    if "teammate" in roles or "student" in roles:
        return "teammate"
    return "guest"
