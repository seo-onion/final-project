# Lambda: ActualizarProductos

Esta función Lambda se activa por el Stream de DynamoDB de la tabla `t_productos` y sincroniza los cambios (alta, modificación, baja) en Elasticsearch según el `tenant_id` del producto.

## Variables de entorno necesarias
- `ES_HOST_<TENANT_ID>`: Endpoint de Elasticsearch para cada tenant (ejemplo: `ES_HOST_PLAZA_VEA`).

## Despliegue
1. Instala dependencias:
   ```
   pip install -r requirements.txt -t .
   ```
2. Empaqueta el código y dependencias en un zip para Lambda.
3. Configura el trigger del Stream de DynamoDB.
4. Define las variables de entorno necesarias. 