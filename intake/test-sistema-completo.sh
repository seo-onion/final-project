#!/bin/bash

echo "🔥 PROBANDO SISTEMA DE INGESTA EN TIEMPO REAL"
echo "=============================================="

echo ""
echo "1. Verificando ElasticSearch..."
echo "Puerto 9200 (plaza-vea):"
curl -s "http://54.197.160.231:9200/_cluster/health?pretty"

echo ""
echo "Puerto 9201 (otro-tenant):"
curl -s "http://54.197.160.231:9201/_cluster/health?pretty"

echo ""
echo "2. Verificando índices existentes..."
echo "Plaza Vea (9200):"
curl -s "http://54.197.160.231:9200/_cat/indices?v"
echo ""
echo "Otro Tenant (9201):"
curl -s "http://54.197.160.231:9201/_cat/indices?v"

echo ""
echo "3. Verificando bucket S3..."
aws s3 ls s3://proyecto-final-compras-dev/

echo ""
echo "4. Verificando funciones Lambda..."
aws lambda get-function --function-name realtime-ingest-dev-actualizarProductos --query 'Configuration.{Name:FunctionName,State:State,LastModified:LastModified}'
aws lambda get-function --function-name realtime-ingest-dev-actualizarCompras --query 'Configuration.{Name:FunctionName,State:State,LastModified:LastModified}'

echo ""
echo "5. Verificando Event Source Mappings..."
echo "Productos:"
aws lambda list-event-source-mappings --function-name realtime-ingest-dev-actualizarProductos --query 'EventSourceMappings[0].{State:State,EventSourceArn:EventSourceArn}'

echo ""
echo "Compras:"
aws lambda list-event-source-mappings --function-name realtime-ingest-dev-actualizarCompras --query 'EventSourceMappings[0].{State:State,EventSourceArn:EventSourceArn}'

echo ""
echo "6. Probando conexión a ElasticSearch desde AWS..."
echo "Insertando producto de prueba..."

# Insertar producto de prueba directamente en ElasticSearch
curl -X POST "http://54.197.160.231:9200/productos/_doc/test-producto-123" \
-H 'Content-Type: application/json' \
-d '{
  "tenant_id": "plaza-vea",
  "product_id": "test-producto-123",
  "code": "TEST001",
  "name": "Producto de Prueba ElasticSearch",
  "description": "Este es un producto para probar la conexión",
  "price": "99.99",
  "stock": "10",
  "category": "pruebas",
  "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "updated_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

echo ""
echo ""
echo "Esperando indexación..."
sleep 3

echo "Buscando el producto..."
curl -s "http://54.197.160.231:9200/productos/_search?q=tenant_id:plaza-vea" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Productos encontrados: {data[\"hits\"][\"total\"][\"value\"]}')
for hit in data['hits']['hits']:
    print(f'- {hit[\"_source\"][\"name\"]} (ID: {hit[\"_id\"]})')
"

echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
echo ""
echo "🚀 SIGUIENTE PASO: Crear productos y compras usando tus APIs para ver la ingesta automática"