'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.lambda_handler = async (event) => {
  try {
    // 1. Autorización
    const auth = (event.headers || {}).Authorization || event.headers.authorization;
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
      FunctionName: 'ValidateToken-prod',
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

    // 2. Parsear body y validar tenant_id + sku
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }
    const { tenant_id, sku, ...updates } = body;
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
    if (!sku) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Falta el campo "sku"' })
      };

    }

    const query = await db.send(new QueryCommand({
      TableName: "t_productos-prod",
      IndexName: 'SkuIndex',
      KeyConditionExpression: '#tid = :t AND #sku = :s',
      ExpressionAttributeNames: { '#tid': 'tenant_id', '#sku': 'sku' },
      ExpressionAttributeValues: { ':t': tenant_id, ':s': sku }
    }));

    const items = query.Items || [];
    if (items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Producto no encontrado' })
      };

    }
    const { sort_id } = items[0];

    // 4. Preparar expresión de actualización dinámica
    const attrs = Object.keys(updates);
    if (attrs.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'No hay atributos para actualizar' })
      };

    }

    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const setClauses = [];

    attrs.forEach((attr, i) => {
      const nameKey = `#attr${i}`;
      const valKey = `:val${i}`;
      ExpressionAttributeNames[nameKey] = attr;
      ExpressionAttributeValues[valKey] = updates[attr];
      setClauses.push(`${nameKey} = ${valKey}`);
    });
    // opcional: registrar fecha de modificación
    const now = new Date().toISOString();
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':now'] = now;
    setClauses.push('#updatedAt = :now');

    const updateParams = {
      TableName: "t_productos-prod",
      Key: { tenant_id, sort_id },
      UpdateExpression: 'SET ' + setClauses.join(', '),
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression: 'attribute_exists(sort_id)',
      ReturnValues: 'ALL_NEW'
    };

    // 5. Ejecutar UpdateCommand
    const result = await db.send(new UpdateCommand(updateParams));
    const updated = result.Attributes;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://proyecto-final-plaza-vea.s3-website-us-east-1.amazonaws.com',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Producto actualizado',
        producto: updated
      })
    };


  } catch (error) {
    console.error('Error modificando producto:', error);
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
