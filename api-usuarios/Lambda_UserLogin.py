import boto3
import hashlib
import uuid  # Genera valores únicos
import json  # ↩ añadido
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Key

# Hashear contraseña
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    # 1) Parsear body
    body = event.get('body') or {}
    if isinstance(body, str):
        body = json.loads(body)

    # 2) Extraer datos de entrada
    tenant_id = body.get('tenant_id')
    email     = body.get('email')
    password  = body.get('password')
    if not tenant_id or not email or not password:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'region, email y password son obligatorios'})
        }

    # 3) Hashear password recibida
    hashed_password = hash_password(password)

    # 4) Buscar usuario usando GSI EmailIndex
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_usuarios')
    resp = table.query(
        IndexName='EmailIndex',
        KeyConditionExpression=(
            Key('tenant_id').eq(tenant_id) &
            Key('email').eq(email)
        )
    )
    items = resp.get('Items', [])
    if not items:
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'Usuario no existe'})
        }

    user = items[0]

    # 5) Validar hash almacenado
    hashed_password_bd = user.get('password')
    if hashed_password != hashed_password_bd:
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'Password incorrecto'})
        }

    # 6) Generar token y expiración
    token = str(uuid.uuid4())
    exp_dt = datetime.now(timezone.utc) + timedelta(minutes=60)
    exp_iso = exp_dt.isoformat()
    exp_ts  = int(exp_dt.timestamp())

    registro = {
        'token': token,
        'user_id': user.get('user_id'),
        'email': email,
        'expires': exp_iso,
        'expires_ts': exp_ts
    }

    # 7) Guardar token en DynamoDB
    tokens_tbl = dynamodb.Table('t_tokens_access')
    tokens_tbl.put_item(Item=registro)

    # 8) Responder
    return {
        'statusCode': 200,
        'body': json.dumps({'token': token, 'expires': exp_iso})
    }
