from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException

from app.application.use_cases.modules import (
    CreateModuleUseCase,
    DeleteModuleUseCase,
    ListModulesUseCase,
    UpdateModuleUseCase,
    ReorderModulesUseCase,
    SuggestModulesUseCase,
)
from app.presentation.api.deps import AdminOrMentorUser, CurrentUser
from app.presentation.schemas.modules import (
    ModuleCreate,
    ModuleDetailOut,
    ModuleOut,
    ModuleUpdate,
    ModuleReorder,
)

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("", response_model=list[ModuleDetailOut])
@inject
async def list_modules(
    user: CurrentUser,
    use_case: FromDishka[ListModulesUseCase],
):
    """List all modules with their corresponding lessons."""
    return await use_case.execute()


@router.get("/suggest", response_model=list[ModuleOut])
@inject
async def suggest_modules(
    user: CurrentUser,
    q: str,
    use_case: FromDishka[SuggestModulesUseCase],
):
    """Suggest existing modules starting with q (case-insensitive)."""
    return await use_case.execute(q)


@router.post("", response_model=ModuleOut)
@inject
async def create_module(
    user: AdminOrMentorUser,
    body: ModuleCreate,
    use_case: FromDishka[CreateModuleUseCase],
):
    """Create a new module. Admin or Mentor only."""
    return await use_case.execute(body)


@router.post("/reorder")
@inject
async def reorder_modules(
    user: AdminOrMentorUser,
    body: ModuleReorder,
    use_case: FromDishka[ReorderModulesUseCase],
):
    """Reorder modules in the system. Admin or Mentor only."""
    await use_case.execute(body)
    return {"ok": True}


@router.patch("/{module_id}", response_model=ModuleOut)
@inject
async def update_module(
    user: AdminOrMentorUser,
    module_id: str,
    body: ModuleUpdate,
    use_case: FromDishka[UpdateModuleUseCase],
):
    """Update an existing module. Admin or Mentor only."""
    res = await use_case.execute(module_id, body)
    if not res:
        raise HTTPException(status_code=404, detail="Module not found")
    return res


@router.delete("/{module_id}")
@inject
async def delete_module(
    user: AdminOrMentorUser,
    module_id: str,
    use_case: FromDishka[DeleteModuleUseCase],
):
    """Delete a module. Admin or Mentor only."""
    ok = await use_case.execute(module_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Module not found")
    return {"ok": True}
