from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class CreateStaffRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "staff"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ("admin", "staff"):
            raise ValueError("Role must be 'admin' or 'staff'")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    must_change_password: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
