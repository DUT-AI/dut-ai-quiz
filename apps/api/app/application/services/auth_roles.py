def quiz_role_from_manage(role_names: list[str] | str | None) -> str:
    if not role_names:
        return "guest"
    if isinstance(role_names, str):
        roles = [role_names]
    else:
        roles = role_names
        
    roles_upper = [r.upper() for r in roles]

    if "ADMIN" in roles_upper:
        return "admin"
    if "SUB_ADMIN" in roles_upper:
        return "SUB_ADMIN"
    if "PROJECT_DEVELOPER" in roles_upper:
        return "PROJECT_DEVELOPER"
    if "EDUCATOR" in roles_upper:
        return "EDUCATOR"
    if "TEAMMATE" in roles_upper or "STUDENT" in roles_upper or "MENTOR" in roles_upper:
        return "teammate"
    return "guest"
