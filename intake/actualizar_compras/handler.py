import os
import json
from shared.s3_client import upload_to_s3

BUCKET = os.environ['COMPRAS_BUCKET']

def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] not in ['INSERT', 'MODIFY']:
            continue
        new_image = record['dynamodb']['NewImage']
        compra = {k: v['S'] for k, v in new_image.items()}
        file_key = f"compras/{compra['compra_id']}.json"
        upload_to_s3(BUCKET, file_key, json.dumps(compra))
    return {'statusCode': 200} 