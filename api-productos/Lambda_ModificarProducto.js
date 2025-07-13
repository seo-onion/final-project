'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db     = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,PATCH',
};

module.exports.lambda_handler = async (event) => {
  try {
    // Manejar preflight (CORS)
    if (event.requestContext?.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // 1. Autorización
    const auth = (event.headers || {}).Authorization || event.headers.authorization;
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
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    const { tenant_id, sku, ...updates } = body;
    if (!tenant_id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Falta el campo "tenant_id"' }) };
    }
    if (!sku) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Falta el campo "sku"' }) };
    }

    // 3. Buscar producto por SKU
    const query = await db.send(new QueryCommand({
      TableName: "t_productos-dev",
      IndexName: 'SkuIndex',
      KeyConditionExpression: '#tid = :t AND #sku = :s',
      ExpressionAttributeNames: { '#tid': 'tenant_id', '#sku': 'sku' },
      ExpressionAttributeValues: { ':t': tenant_id, ':s': sku }
    }));

    const items = query.Items || [];
    if (items.length === 0) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: 'Producto no encontrado' }) };
    }

    const { sort_id } = items[0];

    // 4. Preparar atributos de actualización
    const attrs = Object.keys(updates);
    if (attrs.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'No hay atributos para actualizar' }) };
    }

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const setClauses = [];

    attrs.forEach((attr, i) => {
      const nameKey = `#attr${i}`;
      const valKey  = `:val${i}`;
      ExpressionAttributeNames[nameKey] = attr;
      ExpressionAttributeValues[valKey] = updates[attr];
      setClauses.push(`${nameKey} = ${valKey}`);
    });

    const now = new Date().toISOString();
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':now'] = now;
    setClauses.push('#updatedAt = :now');

    const updateParams = {
      TableName: "t_productos-dev",
      Key: { tenant_id, sort_id },
      UpdateExpression: 'SET ' + setClauses.join(', '),
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression: 'attribute_exists(sort_id)',
      ReturnValues: 'ALL_NEW'
    };

    // 5. Ejecutar actualización
    const result = await db.send(new UpdateCommand(updateParams));
    const updated = result.Attributes;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Producto actualizado',
        producto: updated
      })
    };

  } catch (error) {
    console.error('Error modificando producto:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Error interno: ${error.message}` })
    };
  }
};
