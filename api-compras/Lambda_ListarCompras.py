import boto3
import json
from boto3.dynamodb.conditions import Key
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('t_compras')

# Headers CORS
cors_headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
}

def lambda_handler(event, context):
    try:
        # 1. Validar token
        auth_header = event['headers'].get('Authorization') or event['headers'].get('authorization')
        if not auth_header:
            return {
                'statusCode': 401,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Missing Authorization header'})
            }

        token = auth_header.replace('Bearer ', '')
        resp = lambda_client.invoke(
            FunctionName='ValidateToken',
            Payload=json.dumps({'token': token})
        )
        payload = json.loads(resp['Payload'].read())

        if payload.get('statusCode') == 403:
            return {
                'statusCode': 403,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Forbidden - Token inválido o expirado'})
            }

        # 2. Parsear body
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)

        region = body.get('region') or event.get('queryStringParameters', {}).get('region')
        email = body.get('email') or event.get('queryStringParameters', {}).get('email')

        if not region or not email:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Faltan region o email'})
            }

        # 3. Query DynamoDB
        resp = table.query(
            KeyConditionExpression=Key('tenant_id').eq(region) & Key('sort_id').begins_with(f"{email}#")
        )
        items = resp.get('Items', [])

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'compras': items}, cls=DecimalEncoder)
        }

    except Exception as e:
        print('Error listando compras:', e)
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'message': f'Error interno: {str(e)}'})
        }
