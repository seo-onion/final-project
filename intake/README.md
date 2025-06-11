# Ingesta en Tiempo Real (`/intake`)

Este directorio contiene el código fuente de las Lambdas y utilidades para la ingesta en tiempo real desde DynamoDB Streams hacia Elasticsearch y S3.

## Componentes
- `actualizar_productos/`: Lambda para sincronizar productos con Elasticsearch.
- `actualizar_compras/`: Lambda para almacenar compras en S3.
- `shared/`: Código compartido (clientes, utilidades).

## Despliegue
Cada Lambda tiene su propio README con instrucciones de despliegue y variables de entorno requeridas. 