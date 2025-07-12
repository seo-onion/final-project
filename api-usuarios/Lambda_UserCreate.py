import boto3
import hashlib
import json
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    try:
        # Parseamos body JSON
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)

        region    = body.get('region')
        email     = body.get('email')
        password  = body.get('password')
        name      = body.get('name')
        lastname  = body.get('lastname')
        
        # Validamos que vengan todos los datos
        if not (region and email and password and name and lastname):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid request body: missing region, email, password, name or lastname'
                })
            }

        dynamodb    = boto3.resource('dynamodb')
        t_usuarios  = dynamodb.Table('t_usuario-prod')

        # Comprobamos si ya existe el email
        resp = t_usuarios.query(
            IndexName="EmailIndex",
            KeyConditionExpression=Key('tenant_id').eq(region) & Key('email').eq(email)
        )
        if resp.get('Count', 0) > 0:
            return {
                'statusCode': 409,
                'body': json.dumps({'error': 'Email ya registrado'})
            }
        
        # Generamos el sort_id como email#name#lastname
        hashed_password = hash_password(password)
        sort_key        = f"{email}#{name}#{lastname}"
        
        # Guardamos el usuario
        t_usuarios.put_item(Item={
            'tenant_id': region,
            'sort_id':   sort_key,
            'email':     email,
            'name':      name,
            'lastname':  lastname,
            'password':  hashed_password
        })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User registered successfully'
            })
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
