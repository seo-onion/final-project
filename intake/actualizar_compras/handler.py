# actualizar_compras/handler.py
import os
import json
import boto3
from datetime import datetime
from shared.s3_client import upload_to_s3
import logging

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

BUCKET = os.environ['COMPRAS_BUCKET']
glue_client = boto3.client('glue')

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

def create_glue_resources_if_needed():
    """Crear recursos de Glue si no existen"""
    try:
        # Crear database
        try:
            glue_client.create_database(
                DatabaseInput={
                    'Name': 'compras_database',
                    'Description': 'Base de datos para análisis de compras'
                }
            )
            logger.info("✅ Database Glue creada")
        except glue_client.exceptions.AlreadyExistsException:
            logger.info("ℹ️ Database Glue ya existe")
        
        # Crear tabla
        try:
            glue_client.create_table(
                DatabaseName='compras_database',
                TableInput={
                    'Name': 'compras_table',
                    'StorageDescriptor': {
                        'Columns': [
                            {'Name': 'tenant_id', 'Type': 'string'},
                            {'Name': 'sort_id', 'Type': 'string'},
                            {'Name': 'user_email', 'Type': 'string'},
                            {'Name': 'total_amount', 'Type': 'string'},  # Como string por simplicidad
                            {'Name': 'productos', 'Type': 'string'},
                            {'Name': 'created_at', 'Type': 'string'},
                            {'Name': 'status', 'Type': 'string'}
                        ],
                        'Location': f's3://{BUCKET}/compras/',
                        'InputFormat': 'org.apache.hadoop.mapred.TextInputFormat',
                        'OutputFormat': 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
                        'SerdeInfo': {
                            'SerializationLibrary': 'org.openx.data.jsonserde.JsonSerDe'
                        }
                    },
                    'PartitionKeys': [
                        {'Name': 'year', 'Type': 'string'},
                        {'Name': 'month', 'Type': 'string'},
                        {'Name': 'day', 'Type': 'string'}
                    ]
                }
            )
            logger.info("✅ Tabla Glue creada")
        except glue_client.exceptions.AlreadyExistsException:
            logger.info("ℹ️ Tabla Glue ya existe")
            
    except Exception as e:
        logger.error(f"❌ Error configurando Glue: {str(e)}")

def lambda_handler(event, context):
    """Handler principal mejorado"""
    
    logger.info(f"Procesando {len(event['Records'])} registros de compras")
    
    # Crear recursos Glue
    create_glue_resources_if_needed()
    
    processed_count = 0
    error_count = 0
    
    for record in event['Records']:
        try:
            # Solo procesar INSERTs y MODIFYs
            if record['eventName'] not in ['INSERT', 'MODIFY']:
                logger.info(f"Evento ignorado: {record['eventName']}")
                continue
            
            if 'NewImage' not in record['dynamodb']:
                logger.warning("No hay NewImage en el registro")
                continue
            
            # Extraer datos mejorado
            new_image = record['dynamodb']['NewImage']
            compra = {}
            
            for key, value in new_image.items():
                compra[key] = extract_dynamodb_value(value)
            
            # Obtener información para el archivo
            tenant_id = compra.get('tenant_id', 'unknown')
            compra_id = compra.get('sort_id', f"compra_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            
            # Agregar timestamp si no existe
            if 'created_at' not in compra:
                compra['created_at'] = datetime.now().isoformat()
            
            # Crear fecha para particionado
            try:
                if 'created_at' in compra and compra['created_at']:
                    created_dt = datetime.fromisoformat(compra['created_at'].replace('Z', '+00:00'))
                else:
                    created_dt = datetime.now()
                    compra['created_at'] = created_dt.isoformat()
            except:
                created_dt = datetime.now()
                compra['created_at'] = created_dt.isoformat()
            
            year = created_dt.strftime('%Y')
            month = created_dt.strftime('%m')
            day = created_dt.strftime('%d')
            
            # Crear clave S3 particionada
            file_key = f"compras/year={year}/month={month}/day={day}/tenant_{tenant_id}_{compra_id}.json"
            
            # Subir a S3
            success = upload_to_s3(BUCKET, file_key, json.dumps(compra, indent=2))
            
            if success:
                logger.info(f"✅ Compra procesada: {compra_id} de tenant {tenant_id}")
                processed_count += 1
                
                # Crear partición en Glue si no existe
                try:
                    glue_client.create_partition(
                        DatabaseName='compras_database',
                        TableName='compras_table',
                        PartitionInput={
                            'Values': [year, month, day],
                            'StorageDescriptor': {
                                'Columns': [
                                    {'Name': 'tenant_id', 'Type': 'string'},
                                    {'Name': 'sort_id', 'Type': 'string'},
                                    {'Name': 'user_email', 'Type': 'string'},
                                    {'Name': 'total_amount', 'Type': 'string'},
                                    {'Name': 'productos', 'Type': 'string'},
                                    {'Name': 'created_at', 'Type': 'string'},
                                    {'Name': 'status', 'Type': 'string'}
                                ],
                                'Location': f's3://{BUCKET}/compras/year={year}/month={month}/day={day}/',
                                'InputFormat': 'org.apache.hadoop.mapred.TextInputFormat',
                                'OutputFormat': 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
                                'SerdeInfo': {
                                    'SerializationLibrary': 'org.openx.data.jsonserde.JsonSerDe'
                                }
                            }
                        }
                    )
                    logger.info(f"✅ Partición Glue creada: {year}/{month}/{day}")
                except glue_client.exceptions.AlreadyExistsException:
                    pass  # La partición ya existe
                except Exception as e:
                    logger.warning(f"⚠️ Error creando partición Glue: {str(e)}")
                    
            else:
                error_count += 1
                
        except Exception as e:
            logger.error(f"❌ Error procesando registro: {str(e)}")
            error_count += 1
            continue
    
    result = {
        'statusCode': 200 if error_count == 0 else 207,
        'body': json.dumps({
            'message': 'Procesamiento completado',
            'recordsTotal': len(event['Records']),
            'recordsProcessed': processed_count,
            'recordsWithErrors': error_count,
            'bucket': BUCKET
        })
    }
    
    logger.info(f"Resultado final: {result['body']}")
    return result