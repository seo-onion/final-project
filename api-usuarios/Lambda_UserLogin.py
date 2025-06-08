import boto3
import hashlib
import uuid  # Genera valores únicos
import json  # ↩ añadido
from datetime import datetime, timedelta

# Hashear contraseña
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    body = event.get('body') or {}
    if isinstance(body, str):
        body = json.loads(body)

    email    = body.get('email')
    password = body.get('password')
    if not email or not password:
        return {'statusCode': 400, 'body': 'email y password son obligatorios'}

    # Hasheamos la password recibida
    hashed_password = hash_password(password)

    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_usuarios')
    response = table.get_item(
        Key={'email': email}  
    )
    if 'Item' not in response:
        return {'statusCode': 403, 'body': 'Usuario no existe'}

    # Obtenemos el hash almacenado
    hashed_password_bd = response['Item']['password']
    if hashed_password != hashed_password_bd:
        return {'statusCode': 403, 'body': 'Password incorrecto'}

    # Genera token
    token = str(uuid.uuid4())
    fecha_hora_exp = datetime.timezone.utc() + timedelta(minutes=60)
    registro = {
        'token': token,
        'email': email,
        'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S')
    }


    tokens_tbl = dynamodb.Table('t_tokens_access')
    tokens_tbl.put_item(Item=registro)

    # Salida
    return {'statusCode': 200, 'body': token}
