from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    password: str
    role: str = "enginee"
