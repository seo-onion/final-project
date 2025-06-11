from elasticsearch import Elasticsearch
import os

def get_es_client(tenant_id):
    es_host = os.environ.get(f'ES_HOST_{tenant_id}')
    if not es_host:
        raise Exception(f"No se encontró la variable de entorno ES_HOST_{tenant_id}")
    return Elasticsearch([es_host]) 