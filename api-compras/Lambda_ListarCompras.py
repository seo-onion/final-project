import boto3
import json
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

        # 2. Parsear body o query
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)
        tenant_id = body.get('tenant_id') or event.get('queryStringParameters', {}).get('tenant_id')
        user_id = body.get('user_id') or event.get('queryStringParameters', {}).get('user_id')
        if not tenant_id or not user_id:
            return {'statusCode': 400, 'body': 'Faltan tenant_id o user_id'}

        # 3. Query DynamoDB
        resp = table.query(
            KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('sort_id').begins_with(f"{user_id}#")
        )
        items = resp.get('Items', [])
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