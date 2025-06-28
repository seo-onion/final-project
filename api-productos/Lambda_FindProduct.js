'use strict';
const {
  LambdaClient,
  InvokeCommand
} = require('@aws-sdk/client-lambda');
const {
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db     = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.lambda_handler = async (event) => {
  try {
    // 1. Validación de token
    const auth = event.headers.Authorization || event.headers.authorization;
    if (!auth) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Missing Authorization header' }) };
    }
    const token = auth.replace(/^Bearer\s+/i, '');
    const respVal = await lambda.send(new InvokeCommand({
      FunctionName: 'ValidateToken',
      Payload: JSON.stringify({ token }),
    }));
    const { statusCode: statusValidate } = JSON.parse(new TextDecoder().decode(respVal.Payload));
    if (statusValidate === 403) {
      return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden – Token inválido o expirado' }) };
    }

    // 2. Parseamos body JSON y validamos region + sku
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }
    const { region, sku } = body;
    if (!region) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Falta el campo "region" en el body' }) };
    }
    if (!sku) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Falta el campo "sku" en el body' }) };
    }

    // 3. Hacemos Query sobre el GSI SkuIndex
    const tableName = process.env.TABLE_NAME; 
    if (!tableName) {
      throw new Error('Environment variable TABLE_NAME no está definida');
    }

    const queryResult = await db.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'SkuIndex',
      KeyConditionExpression: '#tid = :t AND #sku = :s',
      ExpressionAttributeNames: {
        '#tid': 'tenant_id',
        '#sku': 'sku'
      },
      ExpressionAttributeValues: {
        ':t': region,
        ':s': sku
      }
    }));

    const items = queryResult.Items || [];
    if (items.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Producto encontrado',
          producto: items[0]
        })
      };
    }

    // 4. Si no encuentra ningún item
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Producto no encontrado',
        producto: null
      })
    };

  } catch (error) {
    console.error('Error buscando producto global:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error interno: ${error.message}`
      })
    };
  }
};
