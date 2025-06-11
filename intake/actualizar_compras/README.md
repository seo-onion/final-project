# Lambda: ActualizarCompras

Esta función Lambda se activa por el Stream de DynamoDB de la tabla `t_compras` y guarda los registros de compras en un bucket S3 como archivos JSON.

## Variables de entorno necesarias
- `COMPRAS_BUCKET`: Nombre del bucket S3 donde se almacenarán los archivos de compras.

## Despliegue
1. Instala dependencias:
   ```
   pip install -r requirements.txt -t .
   ```
2. Empaqueta el código y dependencias en un zip para Lambda.
3. Configura el trigger del Stream de DynamoDB.
4. Define la variable de entorno `COMPRAS_BUCKET`. 