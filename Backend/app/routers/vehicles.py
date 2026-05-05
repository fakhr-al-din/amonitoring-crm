from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
from app.schemas import VehicleCreate
from app.security import get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.post("")
def create_vehicle(data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO vehicles (client_id, brand, model, plate_number, vin, year, type)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                data.client_id, 
                data.brand, 
                data.model, 
                data.plate_number, 
                data.vin, 
                data.year, 
                data.type
            ))
            connection.commit()
            return {"message": "created", "vehicle_id": cursor.lastrowid}
    finally:
        connection.close()

@router.get("")
def get_vehicles(client_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM vehicles WHERE client_id = %s", (client_id,))
            return cursor.fetchall()
    finally:
        connection.close()