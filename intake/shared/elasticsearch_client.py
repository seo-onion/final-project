# shared/elasticsearch_client.py
import os
import json
import logging
from elasticsearch import Elasticsearch

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_es_client(tenant_id):
    """
    Obtiene el cliente de Elasticsearch para un tenant específico
    """
    try:
        # Mapear tenant_id a las variables de entorno
        if tenant_id in ['plaza-vea', 'plaza_vea', 'plazavea']:
            es_host = os.environ['ES_HOST_PLAZA_VEA']
        elif tenant_id in ['otro-tenant', 'otro_tenant', 'otrotenant']:
            es_host = os.environ['ES_HOST_OTRO_TENANT']
        else:
            # Mapeo por defecto - puedes ajustar según tus tenants
            logger.warning(f"Tenant no reconocido: {tenant_id}, usando plaza-vea por defecto")
            es_host = os.environ['ES_HOST_PLAZA_VEA']
        
        # Crear cliente Elasticsearch
        es_client = Elasticsearch(
            [es_host],
            timeout=30,
            max_retries=3,
            retry_on_timeout=True
        )
        
        # Verificar conexión
        if es_client.ping():
            logger.info(f"✅ Conexión exitosa a Elasticsearch para tenant {tenant_id}: {es_host}")
            return es_client
        else:
            logger.error(f"❌ No se pudo conectar a Elasticsearch para tenant {tenant_id}: {es_host}")
            raise Exception(f"No se pudo conectar a Elasticsearch: {es_host}")
            
    except Exception as e:
        logger.error(f"❌ Error obteniendo cliente ES para tenant {tenant_id}: {str(e)}")
        raise e

def create_index_if_not_exists(es_client, index_name='productos'):
    """
    Crear índice de productos si no existe
    """
    try:
        if not es_client.indices.exists(index=index_name):
            # Configuración del índice para búsquedas avanzadas
            index_config = {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0,
                    "analysis": {
                        "analyzer": {
                            "autocomplete": {
                                "tokenizer": "autocomplete",
                                "filter": ["lowercase", "asciifolding"]
                            },
                            "autocomplete_search": {
                                "tokenizer": "standard",
                                "filter": ["lowercase", "asciifolding"]
                            }
                        },
                        "tokenizer": {
                            "autocomplete": {
                                "type": "edge_ngram",
                                "min_gram": 2,
                                "max_gram": 10,
                                "token_chars": ["letter", "digit"]
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "tenant_id": {"type": "keyword"},
                        "product_id": {"type": "keyword"},
                        "code": {"type": "keyword"},
                        "name": {
                            "type": "text",
                            "analyzer": "autocomplete",
                            "search_analyzer": "autocomplete_search",
                            "fields": {
                                "prefix": {"type": "text", "analyzer": "autocomplete"}
                            }
                        },
                        "description": {"type": "text", "analyzer": "standard"},
                        "price": {"type": "double"},
                        "stock": {"type": "integer"},
                        "category": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"}
                    }
                }
            }
            
            es_client.indices.create(index=index_name, body=index_config)
            logger.info(f"✅ Índice {index_name} creado exitosamente")
        else:
            logger.info(f"ℹ️ Índice {index_name} ya existe")
            
    except Exception as e:
        logger.error(f"❌ Error creando índice {index_name}: {str(e)}")
        raise e

def search_products(es_client, query, tenant_id, search_type='fuzzy'):
    """
    Buscar productos en Elasticsearch
    """
    try:
        if search_type == 'fuzzy':
            # Búsqueda fuzzy para errores ortográficos
            search_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"tenant_id": tenant_id}}
                        ],
                        "should": [
                            {
                                "fuzzy": {
                                    "name": {
                                        "value": query,
                                        "fuzziness": "AUTO"
                                    }
                                }
                            },
                            {
                                "fuzzy": {
                                    "description": {
                                        "value": query,
                                        "fuzziness": "AUTO"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        elif search_type == 'prefix':
            # Búsqueda por prefijo
            search_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"tenant_id": tenant_id}},
                            {
                                "bool": {
                                    "should": [
                                        {"prefix": {"name": query}},
                                        {"prefix": {"description": query}}
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        elif search_type == 'autocomplete':
            # Búsqueda con autocompletado
            search_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"tenant_id": tenant_id}},
                            {
                                "match": {
                                    "name": {
                                        "query": query,
                                        "analyzer": "autocomplete_search"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        else:
            # Búsqueda estándar
            search_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"tenant_id": tenant_id}},
                            {
                                "multi_match": {
                                    "query": query,
                                    "fields": ["name^2", "description", "code"]
                                }
                            }
                        ]
                    }
                }
            }
        
        response = es_client.search(index='productos', body=search_body)
        return response['hits']['hits']
        
    except Exception as e:
        logger.error(f"❌ Error buscando productos: {str(e)}")
        return []