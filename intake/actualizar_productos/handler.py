import os
import json
from shared.elasticsearch_client import get_es_client

def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] not in ['INSERT', 'MODIFY', 'REMOVE']:
            continue

        new_image = record.get('dynamodb', {}).get('NewImage')
        old_image = record.get('dynamodb', {}).get('OldImage')
        tenant_id = (new_image or old_image)['tenant_id']['S']

        es = get_es_client(tenant_id)
        product_id = (new_image or old_image)['product_id']['S']

        if record['eventName'] == 'REMOVE':
            es.delete(index='productos', id=product_id, ignore=[404])
        else:
            doc = {k: v['S'] for k, v in (new_image or {}).items()}
            es.index(index='productos', id=product_id, body=doc)
    return {'statusCode': 200} 