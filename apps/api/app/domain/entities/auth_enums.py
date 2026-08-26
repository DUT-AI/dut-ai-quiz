from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    EDUCATOR = "EDUCATOR"
    PROJECT_DEVELOPER = "PROJECT_DEVELOPER"
    SUB_ADMIN = "SUB_ADMIN"
    TEAMMATE = "TEAMMATE"


class SystemPermission(str, Enum):
    # LMS
    CREATE_LESSON = "CREATE_LESSON"
    UPDATE_LESSON = "UPDATE_LESSON"
    DELETE_LESSON = "DELETE_LESSON"
    READ_LESSON = "READ_LESSON"
    MANAGE_LESSON = "MANAGE_LESSON"
    MANAGE_HOMEWORK = "MANAGE_HOMEWORK"
    SUBMIT_HOMEWORK = "SUBMIT_HOMEWORK"
    MANAGE_QUESTION = "MANAGE_QUESTION"

    # Luyện tập & Thi đấu
    PLAY_ARENA_GAME = "PLAY_ARENA_GAME"
    PRACTICE_QUESTION = "PRACTICE_QUESTION"

    # Hệ thống Tương tác
    INTERACT_GENERAL = "INTERACT_GENERAL"
    INTERACT_LESSON = "INTERACT_LESSON"

    # Hệ thống Thi định kỳ
    ATTEMPT_EXAM = "ATTEMPT_EXAM"
    MANAGE_EXAM = "MANAGE_EXAM"

    # Hệ thống Hackathon & Dự án
    MANAGE_TEAM_REGISTRATION = "MANAGE_TEAM_REGISTRATION"
    SUBMIT_HACKATHON_TASK = "SUBMIT_HACKATHON_TASK"
    APPROVE_TEAM_REGISTRATION = "APPROVE_TEAM_REGISTRATION"
    MANAGE_HACKATHON = "MANAGE_HACKATHON"
    MANAGE_HACKATHON_TASK = "MANAGE_HACKATHON_TASK"


# Base permissions for TEAMMATE
_TEAMMATE_PERMISSIONS: set[SystemPermission] = {
    SystemPermission.READ_LESSON,
    SystemPermission.SUBMIT_HOMEWORK,
    SystemPermission.PLAY_ARENA_GAME,
    SystemPermission.PRACTICE_QUESTION,
    SystemPermission.INTERACT_GENERAL,
    SystemPermission.INTERACT_LESSON,
    SystemPermission.ATTEMPT_EXAM,
    SystemPermission.MANAGE_TEAM_REGISTRATION,
    SystemPermission.SUBMIT_HACKATHON_TASK,
}

# Educator inherits Teammate + LMS management
_EDUCATOR_PERMISSIONS: set[SystemPermission] = _TEAMMATE_PERMISSIONS | {
    SystemPermission.MANAGE_LESSON,
    SystemPermission.CREATE_LESSON,
    SystemPermission.UPDATE_LESSON,
    SystemPermission.DELETE_LESSON,
    SystemPermission.MANAGE_HOMEWORK,
    SystemPermission.MANAGE_QUESTION,
}

# Project Developer inherits Teammate + Hackathon/Project management
_PROJECT_DEVELOPER_PERMISSIONS: set[SystemPermission] = _TEAMMATE_PERMISSIONS | {
    SystemPermission.APPROVE_TEAM_REGISTRATION,
    SystemPermission.MANAGE_HACKATHON,
    SystemPermission.MANAGE_HACKATHON_TASK,
}

# Sub-Admin inherits Teammate + Project Developer + Exam management
_SUB_ADMIN_PERMISSIONS: set[SystemPermission] = _PROJECT_DEVELOPER_PERMISSIONS | {
    SystemPermission.MANAGE_EXAM,
}

# Admin has all permissions (and bypasses checks)
_ADMIN_PERMISSIONS: set[SystemPermission] = set(SystemPermission)

ROLE_DEFAULT_PERMISSIONS: dict[UserRole, set[SystemPermission]] = {
    UserRole.TEAMMATE: _TEAMMATE_PERMISSIONS,
    UserRole.EDUCATOR: _EDUCATOR_PERMISSIONS,
    UserRole.PROJECT_DEVELOPER: _PROJECT_DEVELOPER_PERMISSIONS,
    UserRole.SUB_ADMIN: _SUB_ADMIN_PERMISSIONS,
    UserRole.ADMIN: _ADMIN_PERMISSIONS,
}

# Legacy / alias mapping to canonical UserRole
ROLE_ALIASES: dict[str, UserRole] = {
    "admin": UserRole.ADMIN,
    "administrator": UserRole.ADMIN,
    "educator": UserRole.EDUCATOR,
    "teacher": UserRole.EDUCATOR,
    "mentor": UserRole.TEAMMATE,
    "project_developer": UserRole.PROJECT_DEVELOPER,
    "developer": UserRole.PROJECT_DEVELOPER,
    "sub_admin": UserRole.SUB_ADMIN,
    "subadmin": UserRole.SUB_ADMIN,
    "teammate": UserRole.TEAMMATE,
    "leader": UserRole.TEAMMATE,
    "student": UserRole.TEAMMATE,
    "user": UserRole.TEAMMATE,
}


def normalize_role(role: str | UserRole) -> UserRole | None:
    if isinstance(role, UserRole):
        return role
    key = str(role).strip().lower()
    return ROLE_ALIASES.get(key)


def resolve_permissions_for_roles(roles: list[str | UserRole] | None) -> set[str]:
    """
    Aggregates additive permissions across multiple roles.
    If ADMIN is present in the role list, returns all SystemPermission values.
    """
    if not roles:
        return set()

    permissions: set[str] = set()
    for r in roles:
        normalized = normalize_role(r)
        if normalized == UserRole.ADMIN:
            return {p.value for p in SystemPermission}
        if normalized and normalized in ROLE_DEFAULT_PERMISSIONS:
            permissions.update(p.value for p in ROLE_DEFAULT_PERMISSIONS[normalized])

    return permissions
