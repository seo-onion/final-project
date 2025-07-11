# shared/s3_client.py
import boto3
import json
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
s3_client = boto3.client('s3')

def upload_to_s3(bucket, key, data):
    """Subir datos a S3"""
    try:
        if isinstance(data, str):
            body = data
            content_type = 'application/json'
        else:
            body = json.dumps(data, indent=2)
            content_type = 'application/json'
        
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType=content_type
        )
        
        logger.info(f"✅ Archivo subido a S3: s3://{bucket}/{key}")
        return True
        
    except ClientError as e:
        logger.error(f"❌ Error subiendo a S3: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Error inesperado: {str(e)}")
        return False

def list_s3_objects(bucket, prefix=""):
    """Listar objetos en S3"""
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix=prefix
        )
        
        if 'Contents' in response:
            return [obj['Key'] for obj in response['Contents']]
        else:
            return []
            
    except ClientError as e:
        logger.error(f"❌ Error listando objetos S3: {str(e)}")
        return []