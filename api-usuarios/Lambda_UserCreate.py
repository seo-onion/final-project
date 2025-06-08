import boto3
import hashlib
import uuid
import json
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    try:
        body = event.get('body') or {}
        if isinstance(body, str):
            body = json.loads(body)

        region   = body.get('region')
        email    = body.get('email')
        password = body.get('password')
        
        if email and password:
            dynamodb    = boto3.resource('dynamodb')
            t_usuarios  = dynamodb.Table('t_usuarios')

            resp = t_usuarios.query(
                IndexName="EmailIndex",
                KeyConditionExpression=Key('tenant_id').eq(region) & Key('email').eq(email)
            )
            if resp.get('Count', 0) > 0:
                return {
                    'statusCode': 409,
                    'body': json.dumps({'error': 'Email ya registrado'})
                }
            
            hashed_password = hash_password(password)
            user_id         = str(uuid.uuid4())
            sort_key        = f"{user_id}#{email}"
            
            t_usuarios.put_item(Item={
                'tenant_id': region,
                'sort_id':   sort_key,
                'user_id':   user_id,
                'email':     email,
                'password':  hashed_password
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'User registered successfully'
                })
            }
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid request body: missing email or password'})
            }

    except Exception as e:
        print("Exception:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
