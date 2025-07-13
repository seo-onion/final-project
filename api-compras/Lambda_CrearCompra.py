import os
import boto3
import json
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Encoder personalizado para manejar tipos Decimal
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Obtener el nombre de la tabla desde variable de entorno
COMPRAS_TABLE = os.environ.get('COMPRAS_TABLE', 't_compras')

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        # 1. Validar token
        headers = event.get('headers') or {}
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if not auth_header:
            return {'statusCode': 401, 'body': json.dumps({'message': 'Missing Authorization header'}, cls=DecimalEncoder)}
        
        token = auth_header.replace('Bearer ', '')

        # Validar token con la función ValidateToken
        resp = lambda_client.invoke(
            FunctionName='ValidateToken',
            Payload=json.dumps({'token': token})
        )
        payload = json.loads(resp['Payload'].read())
        if payload.get('statusCode') == 403:
            return {
                'statusCode': 403,
                'body': json.dumps({'message': 'Forbidden – Token inválido o expirado'}, cls=DecimalEncoder)
            }

        # 2. Parsear body
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)

        # Validar campos requeridos
        region = body.get('region')
        user_sort_id = body.get('user_sort_id')
        productos = body.get('productos', [])
        total = body.get('total', 0)
        
        # Convertir total a Decimal si es necesario
        if isinstance(total, (int, float)):
            total = Decimal(str(total))
            
        # Convertir precios en productos a Decimal
        for producto in productos:
            if 'precio' in producto and isinstance(producto['precio'], (int, float)):
                producto['precio'] = Decimal(str(producto['precio']))

        if not region:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Falta el campo "region"'}, cls=DecimalEncoder)
            }
        
        if not user_sort_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Falta el campo "user_sort_id"'}, cls=DecimalEncoder)
            }

        if not productos:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Falta el campo "productos" o está vacío'}, cls=DecimalEncoder)
            }

        # 3. Generar ID único para la compra
        compra_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # El sort_id será: user_sort_id#timestamp#compra_id
        sort_id = f"{user_sort_id}#{timestamp}#{compra_id}"

        # 4. Crear el item de compra
        compra_item = {
            'tenant_id': region,
            'sort_id': sort_id,
            'compra_id': compra_id,
            'user_sort_id': user_sort_id,
            'productos': productos,
            'total': total,
            'fecha_compra': timestamp,
            'estado': 'completada'
        }

        # 5. Guardar en DynamoDB
        table = dynamodb.Table(COMPRAS_TABLE)
        table.put_item(Item=compra_item)

        # 6. Respuesta exitosa
        return {
            'statusCode': 201,
            'body': json.dumps({
                'message': 'Compra creada exitosamente',
                'compra': {
                    'compra_id': compra_id,
                    'tenant_id': region,
                    'user_sort_id': user_sort_id,
                    'total': total,
                    'fecha_compra': timestamp,
                    'productos_count': len(productos),
                    'productos': productos  # Incluir productos en la respuesta
                }
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print('Error creando compra:', e)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Error interno: {str(e)}'}, cls=DecimalEncoder)
        }
