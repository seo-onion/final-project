'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient }              = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db     = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,DELETE,POST',
};

module.exports.lambda_handler = async (event) => {
  try {
    // 🔁 Manejar preflight (CORS)
    if (event.requestContext?.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // 1. Autorización
    const headers = event.headers || {};
    const auth    = headers.Authorization || headers.authorization;
    if (!auth) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ message: 'Missing Authorization header' }) };
    }

    const token = auth.replace(/^Bearer\s+/i, '');
    const valResp = await lambda.send(new InvokeCommand({
      FunctionName: 'ValidateToken-dev',
      Payload: JSON.stringify({ token })
    }));

    const { statusCode: codeVal } = JSON.parse(new TextDecoder().decode(valResp.Payload));
    if (codeVal === 403) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Forbidden – Token inválido o expirado' })
      };
    }

    // 2. Parsear body y validar tenant_id + sku
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;
    }

    const { tenant_id, sku } = body;
    if (!tenant_id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Falta el campo "tenant_id"' }) };
    }
    if (!sku) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Falta el campo "sku"' }) };
    }

    // 3. Buscar el producto por índice
    const query = await db.send(new QueryCommand({
      TableName: "t_productos-dev",
      IndexName:  'SkuIndex',
      KeyConditionExpression: '#tid = :t AND #sku = :s',
      ExpressionAttributeNames:  { '#tid': 'tenant_id', '#sku': 'sku' },
      ExpressionAttributeValues: { ':t': tenant_id, ':s': sku }
    }));

    const items = query.Items || [];
    if (items.length === 0) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: 'Producto no encontrado' }) };
    }

    const { sort_id } = items[0];

    // 4. Eliminar el ítem usando su clave compuesta
    await db.send(new DeleteCommand({
      TableName: "t_productos-dev",
      Key: { tenant_id, sort_id },
      ConditionExpression: 'attribute_exists(sort_id)'
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Producto eliminado',
        producto: { tenant_id, sku, sort_id }
      })
    };

  } catch (error) {
    console.error('Error eliminando producto:', error);
    const status = error.name === 'ConditionalCheckFailedException' ? 404 : 500;
    return {
      statusCode: status,
      headers: corsHeaders,
      body: JSON.stringify({
        message: status === 404
          ? 'Producto no encontrado'
          : `Error interno: ${error.message}`
      })
    };
  }
};
