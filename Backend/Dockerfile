FROM python:3.12-alpine
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh
COPY ./app /code/app
COPY ./init_admin.py /code/init_admin.py
COPY ./db_sync.py /code/db_sync.py
ENTRYPOINT ["/code/entrypoint.sh"]