'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.lambda_handler = async (event) => {
  try {
    const headers = event.headers || {};
    const auth = headers.Authorization || headers.authorization;
    if (!auth) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Missing Authorization header' })
      };

    }
    const token = auth.replace(/^Bearer\s+/i, '');
    const valResp = await lambda.send(new InvokeCommand({
      FunctionName: 'ValidateToken-test',
      Payload: JSON.stringify({ token })
    }));
    const { statusCode: codeVal } = JSON.parse(new TextDecoder().decode(valResp.Payload));
    if (codeVal === 403) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Forbidden – Token inválido o expirado' })
      };

    }

    // 2. Leer parámetros de paginación y tenant
    // Podrías usar queryStringParameters o body según prefieras
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;
    }
    const qs = event.queryStringParameters || {};

    const tenant_id = body.tenant_id || qs.tenant_id;
    const pageSize = parseInt(body.pageSize || qs.pageSize || '20', 10);
    const lastKey = body.lastKey || qs.lastKey ? JSON.parse(body.lastKey) : undefined;

    if (!tenant_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Falta el campo "tenant_id"' })
      };

    }

    const params = {
      TableName: "t_productos-test",
      IndexName: undefined, // omitimos GSI, usamos tabla primaria
      KeyConditionExpression: '#tid = :t',
      ExpressionAttributeNames: { '#tid': 'tenant_id' },
      ExpressionAttributeValues: { ':t': tenant_id },
      Limit: pageSize,
      ScanIndexForward: false    // false = orden descendente (opcional)
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    // 4. Ejecutar Query
    const result = await db.send(new QueryCommand(params));
    const items = result.Items || [];

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        products: items,
        lastKey: result.LastEvaluatedKey || null
      })
    };


  } catch (error) {
    console.error('Error listando productos:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: `Error interno: ${error.message}` })
    };

  }
};
