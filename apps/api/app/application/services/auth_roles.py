def quiz_role_from_manage(role_name: str) -> str:
    match role_name:
        case "admin":
            return "teacher"
        case "teammate" | "leader":
            return "student"
        case _:
            return "guest"
