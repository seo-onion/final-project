import os
import boto3
import json
from boto3.dynamodb.conditions import Key

# Obtener el nombre de la tabla desde variable de entorno
COMPRAS_TABLE = os.environ.get('COMPRAS_TABLE')
if not COMPRAS_TABLE:
    raise RuntimeError("Environment variable COMPRAS_TABLE no definida")

lambda_client = boto3.client('lambda')
dynamodb     = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        # 1. Validar token
        headers = event.get('headers') or {}
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if not auth_header:
            return {'statusCode': 401, 'body': json.dumps({'message': 'Missing Authorization header'})}
        token = auth_header.replace('Bearer ', '')

        resp = lambda_client.invoke(
            FunctionName='ValidateToken',
            Payload=json.dumps({'token': token})
        )
        payload = json.loads(resp['Payload'].read())
        if payload.get('statusCode') == 403:
            return {
                'statusCode': 403,
                'body': json.dumps({'message': 'Forbidden – Token inválido o expirado'})
            }

        # 2. Parsear body o queryStringParameters
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)
        qs = event.get('queryStringParameters') or {}

        region        = body.get('region') or qs.get('region')
        user_sort_id  = body.get('user_sort_id') or qs.get('user_sort_id')
        if not region or not user_sort_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Faltan region o user_sort_id'})
            }

        # 3. Realizar Query en DynamoDB usando sort_id prefix
        table = dynamodb.Table(COMPRAS_TABLE)
        resp = table.query(
            KeyConditionExpression=Key('tenant_id').eq(region) &
                                   Key('sort_id').begins_with(f"{user_sort_id}#")
        )
        items = resp.get('Items', [])

        # 4. Devolver lista de compras
        return {
            'statusCode': 200,
            'body': json.dumps({'compras': items})
        }

    except Exception as e:
        print('Error listando compras:', e)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Error interno: {str(e)}'})
        }
