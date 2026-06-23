from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
import logging
import traceback

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI):
    from app.core.exceptions import AppException

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning(
            f"AppException: {exc.status_code} {exc.message} | "
            f"Path: {request.url.path} | Method: {request.method}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "is_success": False,
                "status_code": exc.status_code,
                "detail": exc.message,
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.warning(
            f"HTTPException: {exc.status_code} {exc.detail} | "
            f"Path: {request.url.path} | Method: {request.method}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "is_success": False,
                "status_code": exc.status_code,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        logger.error(
            f"Validation Error: {exc.errors()} | "
            f"Body: {getattr(request, '_json', 'N/A')} | "
            f"Path: {request.url.path}"
        )
        return JSONResponse(
            status_code=400,  # Often better to return 400 for clients instead of 422
            content={
                "is_success": False,
                "status_code": 400,
                "detail": "Data validation failed",
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"Unhandled exception: {str(exc)}\n{traceback.format_exc()} | "
            f"Path: {request.url.path}"
        )
        return JSONResponse(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "is_success": False,
                "status_code": HTTP_500_INTERNAL_SERVER_ERROR,
                "detail": "An unexpected error occurred internal to the server.",
            },
        )
