from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.users import User
from app.schemas.user import UserCreate
from app.core.hash_security import hash_password

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


@router.post("/user-registration")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User).filter(User.email == user_data.email).first()
    )

    if existing_user :
        raise HTTPException(
            status_code = 400,
            detail = "Email Already Register"
        )
    
    user = User(
        name = user_data.name,
        email = user_data.email,
        phone = user_data.phone,
        password = hash_password(user_data.password),
        role = user_data.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User Regiser successfully",
        "user_id": user.id
    }

@router.get("/delete-user/{id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(user_id == User.id).first()

    if not user:
        return HTTPException(
            status_code = 404,
            detail = "User deleted successfully"
        )

    db.delete(user)
    db.commit()