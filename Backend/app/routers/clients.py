from fastapi import APIRouter, HTTPException, Depends
from app.database import get_connection
from app.schemas import ClientCreate
from app.security import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("")
def create_client(data: ClientCreate, current_user: dict = Depends(get_current_user)):
    # Только Админ и Менеджер могут создавать базу клиентов
    if current_user["role"] not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Только Менеджер или Админ могут создавать клиентов")

    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            sql = """INSERT INTO clients (type, name, company_name, phone, email) 
                     VALUES (%s, %s, %s, %s, %s)"""
            cursor.execute(sql, (data.type, data.name, data.company_name, data.phone, data.email))
            connection.commit()
            new_id = cursor.lastrowid 
            return {"id": new_id, "message": "client created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

@router.get("")
def get_clients(current_user: dict = Depends(get_current_user)):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Получаем клиентов + количество их заявок
            sql = """
            SELECT c.*, COUNT(r.id) as request_count 
            FROM clients c 
            LEFT JOIN requests r ON c.id = r.client_id 
            GROUP BY c.id 
            ORDER BY c.created_at DESC
            """
            cursor.execute(sql)
            return cursor.fetchall()
    finally:
        connection.close()

@router.get("/{client_id}/requests")
def get_client_requests(client_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Получаем только заявки конкретного клиента
            sql = """
            SELECT r.id, r.created_at, r.status, v.brand, v.model, r.city
            FROM requests r
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            WHERE r.client_id = %s
            ORDER BY r.created_at DESC
            """
            cursor.execute(sql, (client_id,))
            return cursor.fetchall()
    finally:
        connection.close()