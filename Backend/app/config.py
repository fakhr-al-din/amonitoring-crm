import os
from dotenv import load_dotenv

# загружает переменные из .env при локальном запуске
# ищет не только в данной папке, но и сверху
load_dotenv()

# достает прочитанные переменные из .env либо из докера
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
secret_key = os.getenv("SECRET_KEY")
access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
