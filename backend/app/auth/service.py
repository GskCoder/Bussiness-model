from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.auth.models import User
from app.core.security import hash_password, verify_password, create_access_token


def authenticate_user(db: Session, username: str, password: str) -> tuple:
    """Authenticate user and return (user, token) or raise 401."""
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact admin.",
        )
    token = create_access_token(user.id, user.role)
    return user, token


def create_staff(db: Session, username: str, email: str, password: str, role: str) -> User:
    """Create a new staff/admin user. Only callable by admin."""
    # Check duplicate username
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' already exists",
        )
    # Check duplicate email
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{email}' already registered",
        )

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, old_password: str, new_password: str) -> User:
    """Change user's password. Verifies old password first."""
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.hashed_password = hash_password(new_password)
    user.must_change_password = False
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> list:
    """Get all users (admin only)."""
    return db.query(User).order_by(User.created_at.desc()).all()


def toggle_user_active(db: Session, user_id: int, current_user: User) -> User:
    """Toggle a user's active status. Cannot deactivate yourself."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


def seed_default_admin(db: Session):
    """Create default admin account if no users exist."""
    if db.query(User).first() is None:
        admin = User(
            username="admin",
            email="admin@retailerp.local",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True,
            must_change_password=True,
        )
        db.add(admin)
        db.commit()
        print("[OK] Default admin created: admin / admin123")
