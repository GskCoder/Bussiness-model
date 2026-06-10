from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_admin
from app.auth import schemas, service
from app.auth.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Login with username and password. Returns JWT token."""
    user, token = service.authenticate_user(db, data.username, data.password)
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return schemas.UserResponse.model_validate(current_user)


@router.post("/change-password", response_model=schemas.UserResponse)
def change_password(
    data: schemas.ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change current user's password."""
    user = service.change_password(db, current_user, data.old_password, data.new_password)
    return schemas.UserResponse.model_validate(user)


@router.post("/staff", response_model=schemas.UserResponse)
def create_staff(
    data: schemas.CreateStaffRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new staff or admin account (admin only)."""
    user = service.create_staff(db, data.username, data.email, data.password, data.role)
    return schemas.UserResponse.model_validate(user)


@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    users = service.get_all_users(db)
    return [schemas.UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/toggle", response_model=schemas.UserResponse)
def toggle_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate/deactivate a user (admin only)."""
    user = service.toggle_user_active(db, user_id, admin)
    return schemas.UserResponse.model_validate(user)
