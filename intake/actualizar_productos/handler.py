# actualizar_productos/handler.py
import os
import json
import logging
from shared.elasticsearch_client import get_es_client, create_index_if_not_exists

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def extract_dynamodb_value(value):
    """Extraer valor de formato DynamoDB"""
    if 'S' in value:
        return value['S']
    elif 'N' in value:
        return float(value['N'])
    elif 'BOOL' in value:
        return value['BOOL']
    elif 'L' in value:  # Lista
        return [extract_dynamodb_value(item) for item in value['L']]
    elif 'M' in value:  # Map/Objeto
        return {k: extract_dynamodb_value(v) for k, v in value['M'].items()}
    elif 'SS' in value:  # String Set
        return value['SS']
    elif 'NS' in value:  # Number Set
        return [float(n) for n in value['NS']]
    elif 'NULL' in value:
        return None
    else:
        return str(value)

def lambda_handler(event, context):
    """Handler principal mejorado"""
    
    logger.info(f"Procesando {len(event['Records'])} registros de productos")
    
    processed_count = 0
    error_count = 0
    
    for record in event['Records']:
        try:
            # Solo procesar eventos relevantes
            if record['eventName'] not in ['INSERT', 'MODIFY', 'REMOVE']:
                logger.info(f"Evento ignorado: {record['eventName']}")
                continue
            
            # Obtener datos del registro
            new_image = record.get('dynamodb', {}).get('NewImage')
            old_image = record.get('dynamodb', {}).get('OldImage')
            
            # Obtener tenant_id y product_id
            image_to_use = new_image or old_image
            if not image_to_use:
                logger.warning("No hay imagen en el registro")
                continue
                
            tenant_id = image_to_use['tenant_id']['S']
            product_id = image_to_use['product_id']['S']
            
            logger.info(f"Procesando {record['eventName']} para producto {product_id} en tenant {tenant_id}")
            
            # Obtener cliente Elasticsearch
            es = get_es_client(tenant_id)
            
            # Crear índice si no existe
            create_index_if_not_exists(es, 'productos')
            
            if record['eventName'] == 'REMOVE':
                # Eliminar producto
                response = es.delete(index='productos', id=product_id, ignore=[404])
                logger.info(f"✅ Producto {product_id} eliminado de ElasticSearch")
                
            else:
                # Insertar o actualizar producto
                if new_image:
                    # Extraer todos los campos mejorado
                    doc = {}
                    for key, value in new_image.items():
                        doc[key] = extract_dynamodb_value(value)
                    
                    # Indexar en Elasticsearch
                    response = es.index(index='productos', id=product_id, body=doc)
                    logger.info(f"✅ Producto {product_id} indexado en ElasticSearch: {response['result']}")
                else:
                    logger.warning(f"No hay NewImage para producto {product_id}")
                    continue
            
            processed_count += 1
            
        except Exception as e:
            logger.error(f"❌ Error procesando registro: {str(e)}")
            logger.error(f"Registro problemático: {json.dumps(record, default=str)}")
            error_count += 1
            continue
    
    # Resultado final
    result = {
        'statusCode': 200 if error_count == 0 else 207,
        'body': json.dumps({
            'message': 'Procesamiento de productos completado',
            'recordsTotal': len(event['Records']),
            'recordsProcessed': processed_count,
            'recordsWithErrors': error_count
        })
    }
    
    logger.info(f"Resultado final: {result['body']}")
    return result