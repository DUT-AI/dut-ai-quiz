from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, Query

from app.application.use_cases.modules import (
    CreateModuleUseCase,
    DeleteModuleUseCase,
    ListModulesUseCase,
    ReorderModulesUseCase,
    UpdateModuleUseCase,
)
from app.presentation.api.deps import CurrentUser, EducatorUser
from app.presentation.schemas.modules import (
    ModuleCreate,
    ModuleDetailOut,
    ModuleOut,
    ModuleReorder,
    ModuleUpdate,
)

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("", response_model=list[ModuleDetailOut])
@inject
async def list_modules(
    user: CurrentUser,
    use_case: FromDishka[ListModulesUseCase],
    q: str | None = Query(None, description="Prefix search for module name (case-insensitive)"),
    name: str | None = Query(None, description="Exact match for module name (case-insensitive)"),
    description: str | None = Query(
        None, description="Partial search for module description (case-insensitive)"
    ),
    order: int | None = Query(None, description="Exact match for module order"),
    include_lessons: bool = Query(True, description="Whether to include lesson list in response"),
):
    """List all modules with their corresponding lessons and optional filters."""
    return await use_case.execute(
        q=q,
        name=name,
        description=description,
        order=order,
        include_lessons=include_lessons,
    )


@router.post("", response_model=ModuleOut)
@inject
async def create_module(
    user: EducatorUser,
    body: ModuleCreate,
    use_case: FromDishka[CreateModuleUseCase],
):
    """Create a new module. Educator or Admin only."""
    return await use_case.execute(body)


@router.post("/reorder")
@inject
async def reorder_modules(
    user: EducatorUser,
    body: ModuleReorder,
    use_case: FromDishka[ReorderModulesUseCase],
):
    """Reorder modules in the system. Educator or Admin only."""
    await use_case.execute(body)
    return {"ok": True}


@router.patch("/{module_id}", response_model=ModuleOut)
@inject
async def update_module(
    user: EducatorUser,
    module_id: str,
    body: ModuleUpdate,
    use_case: FromDishka[UpdateModuleUseCase],
):
    """Update an existing module. Educator or Admin only."""
    res = await use_case.execute(module_id, body)
    if not res:
        raise HTTPException(status_code=404, detail="Module not found")
    return res


@router.delete("/{module_id}")
@inject
async def delete_module(
    user: EducatorUser,
    module_id: str,
    use_case: FromDishka[DeleteModuleUseCase],
):
    """Delete a module. Educator or Admin only."""
    ok = await use_case.execute(module_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Module not found")
    return {"ok": True}
