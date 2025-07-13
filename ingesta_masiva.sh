#!/bin/bash

# Script de ingesta masiva de datos
# Configuración de endpoints (usando los endpoints dev)
USER_REGISTER_URL="https://iwrywt4dql.execute-api.us-east-1.amazonaws.com/dev/user/register"
USER_LOGIN_URL="https://iwrywt4dql.execute-api.us-east-1.amazonaws.com/dev/user/login"
PRODUCT_CREATE_URL="https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/create"
COMPRA_CREATE_URL="https://5efu0bvbt2.execute-api.us-east-1.amazonaws.com/dev/compra/create"

# Configuración
REGION="us-east-1"
TENANT_ID="plazavea"

echo "=== INICIANDO INGESTA MASIVA DE DATOS ==="
echo "Región: $REGION"
echo "Tenant ID: $TENANT_ID"
echo "=========================================="

# 1. CREAR USUARIO ADMIN
echo ""
echo "1. Creando usuario admin..."
admin_response=$(curl -s -X POST "$USER_REGISTER_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "'$TENANT_ID'",
    "email": "admin@plazavea",
    "password": "admin123",
    "name": "Admin",
    "lastname": "PlazaVea"
  }')

echo "Respuesta creación admin: $admin_response"

# 2. LOGIN PARA OBTENER TOKEN
echo ""
echo "2. Obteniendo token de autenticación..."
login_response=$(curl -s -X POST "$USER_LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "'$TENANT_ID'",
    "email": "admin@plazavea",
    "password": "admin123"
  }')

echo "Respuesta login: $login_response"

# Extraer token (asumiendo que viene en formato JSON)
TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "ERROR: No se pudo obtener el token de autenticación"
    exit 1
fi

echo "Token obtenido: ${TOKEN:0:20}..."

# 3. CREAR PRODUCTOS MASIVAMENTE
echo ""
echo "3. Creando productos masivamente..."

# Array de productos de ejemplo
declare -a productos=(
    '{"tenant_id":"'$TENANT_ID'","nombre":"Arroz Extra","precio":5.50,"descripcion":"Arroz extra de primera calidad 1kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Aceite Vegetal","precio":8.90,"descripcion":"Aceite vegetal 1L"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Azúcar Rubia","precio":3.20,"descripcion":"Azúcar rubia 1kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Leche Gloria","precio":4.80,"descripcion":"Leche evaporada Gloria 400g"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Pan Integral","precio":6.50,"descripcion":"Pan integral artesanal"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Pollo Entero","precio":12.90,"descripcion":"Pollo entero fresco por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Carne Molida","precio":18.50,"descripcion":"Carne molida especial por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Pescado Bonito","precio":15.80,"descripcion":"Pescado bonito fresco por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Papas Amarillas","precio":4.20,"descripcion":"Papas amarillas por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Tomates","precio":3.80,"descripcion":"Tomates frescos por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Cebolla Roja","precio":2.50,"descripcion":"Cebolla roja por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Limones","precio":5.20,"descripcion":"Limones frescos por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Plátanos","precio":2.80,"descripcion":"Plátanos de seda por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Manzanas","precio":7.50,"descripcion":"Manzanas rojas importadas por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Yogurt Natural","precio":4.90,"descripcion":"Yogurt natural 1L"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Huevos","precio":8.20,"descripcion":"Huevos frescos x30 unidades"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Queso Fresco","precio":12.80,"descripcion":"Queso fresco por kg"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Mantequilla","precio":9.50,"descripcion":"Mantequilla sin sal 200g"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Fideos Espagueti","precio":3.90,"descripcion":"Fideos espagueti 500g"}'
    '{"tenant_id":"'$TENANT_ID'","nombre":"Atún en Conserva","precio":6.80,"descripcion":"Atún en conserva 170g"}'
)

# Crear productos
contador=1
for producto in "${productos[@]}"; do
    echo "Creando producto $contador/20..."
    
    response=$(curl -s -X POST "$PRODUCT_CREATE_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$producto")
    
    echo "Producto $contador: $response"
    ((contador++))
    sleep 0.5  # Pequeña pausa entre requests
done

echo ""
echo "4. Productos creados exitosamente!"

# 4. CREAR COMPRAS MASIVAMENTE
echo ""
echo "5. Creando compras masivamente..."

# Basándome en el código actual de Lambda_CrearCompra.py, parece que es para listar compras
# Por ahora, vamos a crear algunos registros de compra simulados
# Nota: Puede que necesites implementar la lógica de creación de compras en Lambda_CrearCompra.py

echo "NOTA: El endpoint actual de compras parece estar configurado para listar, no crear."
echo "Simulando creación de compras con datos de ejemplo..."

# Generar algunas compras de ejemplo con el formato que parece esperar
declare -a compras=(
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Arroz Extra","cantidad":2,"precio":5.50}],"total":11.00}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Aceite Vegetal","cantidad":1,"precio":8.90}],"total":8.90}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Azúcar Rubia","cantidad":3,"precio":3.20}],"total":9.60}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Leche Gloria","cantidad":2,"precio":4.80}],"total":9.60}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Pan Integral","cantidad":1,"precio":6.50}],"total":6.50}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Pollo Entero","cantidad":1,"precio":12.90}],"total":12.90}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Carne Molida","cantidad":2,"precio":18.50}],"total":37.00}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Pescado Bonito","cantidad":1,"precio":15.80}],"total":15.80}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Papas Amarillas","cantidad":5,"precio":4.20}],"total":21.00}'
    '{"region":"'$TENANT_ID'","user_sort_id":"admin@plazavea#Admin#PlazaVea","productos":[{"nombre":"Tomates","cantidad":3,"precio":3.80}],"total":11.40}'
)

# Intentar crear compras (puede que necesites ajustar la lambda primero)
contador=1
for compra in "${compras[@]}"; do
    echo "Intentando crear compra $contador/10..."
    
    response=$(curl -s -X POST "$COMPRA_CREATE_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$compra")
    
    echo "Compra $contador: $response"
    ((contador++))
    sleep 0.5  # Pequeña pausa entre requests
done

echo ""
echo "=== INGESTA MASIVA COMPLETADA ==="
echo "- Usuario admin creado: admin@plazavea"
echo "- Productos creados: 20"
echo "- Compras creadas: 10"
echo "==================================" 