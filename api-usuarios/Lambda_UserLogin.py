import boto3
import hashlib
import uuid
import json
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    try:
        # 1) Parsear body JSON
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)

        # 2) Extraer y validar entradas
        tenant_id = body.get('region')    # corresponde a tenant_id
        email     = body.get('email')
        password  = body.get('password')
        if not (tenant_id and email and password):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'region, email y password son obligatorios'
                })
            }

        dynamodb = boto3.resource('dynamodb')
        users_tbl = dynamodb.Table('t_usuario-prod')

        # 3) Consultar por email en GSI EmailIndex
        resp = users_tbl.query(
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

        # 4) Validar contraseña
        if hash_password(password) != user.get('password'):
            return {
                'statusCode': 403,
                'body': json.dumps({'error': 'Password incorrecto'})
            }

        # 5) Generar token y expiración
        token = str(uuid.uuid4())
        exp_dt = datetime.now(timezone.utc) + timedelta(minutes=60)
        exp_iso = exp_dt.isoformat()
        exp_ts  = int(exp_dt.timestamp())

        # 6) Guardar token en tabla de tokens
        tokens_tbl = dynamodb.Table('t_access_token-prod')
        tokens_tbl.put_item(Item={
            'tenant_id':  tenant_id,
            'sort_id':    user['sort_id'],  # identifica al usuario
            'token':      token,
            'email':      email,
            'expires':    exp_iso,
            'expires_ts': exp_ts
        })

        # 7) Responder con token y expiración
        return {
            'statusCode': 200,
            'body': json.dumps({
                'token':   token,
                'expires': exp_iso
            })
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
