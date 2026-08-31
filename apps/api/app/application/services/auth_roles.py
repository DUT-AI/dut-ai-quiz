from app.domain.entities.auth_enums import UserRole, normalize_role


def quiz_role_from_manage(role_names: list[str] | str | None) -> str:
    if not role_names:
        return "guest"
    if isinstance(role_names, str):
        roles = [role_names]
    else:
        roles = role_names

    normalized_roles = {normalize_role(r) for r in roles}

    if UserRole.ADMIN in normalized_roles:
        return "admin"
    if UserRole.SUB_ADMIN in normalized_roles:
        return "SUB_ADMIN"
    if UserRole.PROJECT_DEVELOPER in normalized_roles:
        return "PROJECT_DEVELOPER"
    if UserRole.EDUCATOR in normalized_roles:
        return "EDUCATOR"
    if UserRole.TEAMMATE in normalized_roles:
        return "teammate"
    return "guest"
