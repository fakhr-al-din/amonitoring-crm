from pydantic import BaseModel
from typing import Optional

class InstallationDetails(BaseModel):
    has_beacon: bool = False
    has_blocking: bool = False

class RequestCreate(BaseModel):
    client_id: int
    vehicle_id: int
    work_type: str
    visit_type: str
    city: str | None = None  # <-- ДОБАВЛЕНО
    installation: InstallationDetails | None = None

class RequestUpdate(BaseModel):
    status: str | None = None
    is_paid: Optional[bool] = None   # для обновления статуса оплаты
    installation: InstallationDetails | None = None  # для обновления деталей установки
    city: str | None = None  # <-- ДОБАВЛЕНО
    work_type: str | None = None
    visit_type: str | None = None

class CommentCreate(BaseModel):
    request_id: int
    message: str

class AssignRequest(BaseModel):
    technician_id: int

class ClientCreate(BaseModel):
    type: str
    name: str
    company_name: str | None = None
    phone: str
    email: str | None = None

class VehicleCreate(BaseModel):
    client_id: int
    brand: str       # <-- УБЕДИСЬ ЧТО ТУТ ЕСТЬ BRAND
    model: str
    plate_number: str
    vin: str | None = None
    year: int | None = None
    type: str | None = None

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None