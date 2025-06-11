# API Compras (Serverless, Multi-Tenant, Token Protected)

## Descripción
Microservicio para registrar y listar compras de usuarios, siguiendo el mismo patrón que api-productos y api-usuarios. Utiliza AWS Lambda, DynamoDB y validación de token vía Lambda.

## Endpoints
- `POST /compra/create` — Registrar una compra (requiere header Authorization)
- `POST /compra/list` — Listar compras del usuario autenticado (requiere header Authorization)

## Estructura de la compra
```json
{
  "tenant_id": "regionA",
  "user_id": "user1",
  "productos": ["prod1", "prod2"],
  "total": 100,
}
```

## Despliegue

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Desplegar con Serverless
```bash
sls deploy
```

### 3. Validación de token
El microservicio invoca la Lambda `ValidateToken` definida en api-usuarios para validar el token recibido en el header `Authorization`.

## Notas
- La tabla DynamoDB `t_compras` usa `tenant_id` como PK y `sort_id` como SK (`user_id#timestamp`).
- Sigue el mismo patrón de código y despliegue que los otros microservicios del proyecto. 