#!/bin/sh

# python db_init_if_needed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000