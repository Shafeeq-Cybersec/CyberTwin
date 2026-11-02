"""Pydantic schemas for auth/user payloads."""

import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class Token(BaseModel):
    """JWT response returned by the login endpoint."""

    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    """Registration payload."""

    email: EmailStr
    full_name: str
    password: str


class UserRead(BaseModel):
    """Public user representation — never exposes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str
