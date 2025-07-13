#!/bin/bash

# Configura tu región y stage aquí
REGION="us-east-1"   # <-- Cambia esto si usas otra región
STAGE="dev"          # <-- Cambia esto por el stage que quieras (dev, prod, test, etc.)

echo "Listando endpoints de API Gateway en la región $REGION y stage $STAGE"
echo "---------------------------------------------------------------"

apis=$(aws apigateway get-rest-apis --region $REGION --query "items[*].[id,name]" --output text)

while read -r api_id api_name; do
  echo ""
  echo "API: $api_name ($api_id)"
  resources=$(aws apigateway get-resources --rest-api-id $api_id --region $REGION --query "items[*].[path,resourceMethods]" --output json)
  echo "$resources" | jq -c '.[]' | while read -r resource; do
    path=$(echo $resource | jq -r '.[0]')
    methods=$(echo $resource | jq -r '.[1] | keys_unsorted[]?' 2>/dev/null)
    for method in $methods; do
      url="https://${api_id}.execute-api.${REGION}.amazonaws.com/${STAGE}${path}"
      echo "$method $url"
    done
  done
done <<< "$apis"