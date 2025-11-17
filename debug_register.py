import os
import sys
import json
from pathlib import Path
from django.test import Client

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django

django.setup()

client = Client()
payload = {
    'username': 'apitest1',
    'student_id': 'S999',
    'password': 'Password123!',
    'role': 'student'
}
response = client.post('/api/v1/auth/register/', data=json.dumps(payload), content_type='application/json', HTTP_HOST='127.0.0.1:8000')
print(response.status_code)
print(response.json())
