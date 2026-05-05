from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
from app.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"]) # Если добавляешь в users.py

@router.get("/pending")
def get_pending_users(current_user: dict = Depends(get_current_user)):
    # Только админ может видеть этот список
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Только администратор имеет доступ")
        
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Забираем всех, у кого is_approved = False (или 0)
            cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE is_approved = False")
            return cursor.fetchall()
    finally:
        connection.close()

@router.patch("/{user_id}/approve")
def approve_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Только администратор имеет доступ")
        
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET is_approved = True WHERE id = %s", (user_id,))
            connection.commit()
            return {"message": "User approved successfully"}
    finally:
        connection.close()

@router.delete("/{user_id}/reject")
def reject_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Только администратор имеет доступ")
        
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            connection.commit()
            return {"message": "User rejected and deleted"}
    finally:
        connection.close()