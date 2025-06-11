import boto3
import json
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('t_compras')

def lambda_handler(event, context):
    try:
        # 1. Validar token
        auth_header = event['headers'].get('Authorization') or event['headers'].get('authorization')
        if not auth_header:
            return {'statusCode': 401, 'body': 'Missing Authorization header'}
        token = auth_header.replace('Bearer ', '')
        resp = lambda_client.invoke(
            FunctionName='ValidateToken',
            Payload=json.dumps({'token': token})
        )
        payload = json.loads(resp['Payload'].read())
        if payload.get('statusCode') == 403:
            return {'statusCode': 403, 'body': json.dumps({'message': 'Forbidden - Token inválido o expirado'})}

        # 2. Parsear body
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)
        tenant_id = body.get('tenant_id')
        user_id = body.get('user_id')
        productos = body.get('productos', [])
        total = body.get('total', 0)
        if not tenant_id or not user_id:
            return {'statusCode': 400, 'body': 'Faltan tenant_id o user_id'}

        compra_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        sort_id = f"{user_id}#{timestamp}"
        item = {
            'tenant_id': tenant_id,
            'sort_id': sort_id,
            'compra_id': compra_id,
            'user_id': user_id,
            'productos': productos,
            'total': total,
            'fecha': timestamp
        }
        table.put_item(Item=item)
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Compra registrada', 'compra': item})
        }
    except Exception as e:
        print('Error creando compra:', e)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Error interno: {str(e)}'})
        } 