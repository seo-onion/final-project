#!/bin/bash

# Script para listar todos los endpoints de API Gateway con URLs completas
# Basado en la información proporcionada

# Configuración
REGION="us-east-1"  # Cambiar según tu región
STAGE="dev"         # Cambiar según tu stage

echo "=== LISTANDO TODOS LOS ENDPOINTS DE API GATEWAY ==="
echo "Región: $REGION"
echo "Stage: $STAGE"
echo ""

# Verificar si AWS CLI está configurado
if ! aws sts get-caller-identity &>/dev/null; then
    echo "Error: AWS CLI no está configurado correctamente"
    exit 1
fi

# Función para obtener endpoints de una API
get_api_endpoints() {
    local api_id=$1
    local api_name=$2
    
    echo "API: $api_name ($api_id)"
    echo "URL Base: https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE"
    echo ""
    
    # Obtener recursos y métodos
    aws apigateway get-resources --rest-api-id $api_id --output json | jq -r '
        .items[] | 
        select(.resourceMethods) | 
        .path as $path | 
        .resourceMethods | 
        keys[] as $method | 
        "\($method) \($path)"
    ' | while read method path; do
        full_url="https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE$path"
        echo "  $method $path"
        echo "    URL: $full_url"
    done
    
    echo ""
    echo "-----------------------------"
    echo ""
}

# Listar todas las APIs
echo "Obteniendo lista de APIs..."
apis=$(aws apigateway get-rest-apis --query "items[*].[name,id]" --output text)

if [ -z "$apis" ]; then
    echo "No se encontraron APIs en la región $REGION"
    exit 1
fi

echo "APIs encontradas:"
echo "$apis"
echo ""
echo "=============================="
echo ""

# Procesar cada API
echo "$apis" | while read api_name api_id; do
    get_api_endpoints "$api_id" "$api_name"
done

echo ""
echo "=== RESUMEN PARA INGESTA ==="
echo ""

# Crear un resumen específico para nuestras APIs
echo "Endpoints para ingesta masiva:"
echo ""

# Buscar APIs específicas
for api_pattern in "api-usuarios" "api-productos" "api-compras"; do
    api_info=$(echo "$apis" | grep "$api_pattern")
    if [ ! -z "$api_info" ]; then
        api_name=$(echo "$api_info" | awk '{print $1}')
        api_id=$(echo "$api_info" | awk '{print $2}')
        
        echo "$api_name ($api_id):"
        
        # Obtener endpoints específicos para cada API
        case "$api_pattern" in
            "api-usuarios")
                echo "  POST /user/create -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/user/create"
                echo "  POST /user/login -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/user/login"
                ;;
            "api-productos")
                echo "  POST /product/create -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/product/create"
                echo "  GET /product/list -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/product/list"
                ;;
            "api-compras")
                echo "  POST /compra/create -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/compra/create"
                echo "  GET /compra/list -> https://$api_id.execute-api.$REGION.amazonaws.com/$STAGE/compra/list"
                ;;
        esac
        echo ""
    fi
done

echo "Para usar estos endpoints en tu script de ingesta, copia las URLs completas." 