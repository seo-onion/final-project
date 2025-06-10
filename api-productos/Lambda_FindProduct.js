'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');


const lambda = new LambdaClient({});
const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

module.exports.lambda_handler = async (event) => {
  try {
    // Obtener el token de la cabecera de autorización
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'Missing Authorization header' };
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');


    const validateResp = await lambda.send(new InvokeCommand({
      FunctionName: 'ValidateToken',
      Payload: JSON.stringify({ token }),
    }));

    const payload = JSON.parse(new TextDecoder().decode(validateResp.Payload));
    if (payload.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden - Token inválido o expirado' })
      };
    }

    // Obtener el SKU del cuerpo de la solicitud
    const { sku, tenant_id } = JSON.parse(event.body);

    // Parámetros para la búsqueda en DynamoDB
    const params = {
    TableName: 't_producto',
    Key: {
        tenant_id,
        sku
    }
    };

    // Ejecutar la consulta en DynamoDB
    const data = await db.get(params);


    if (data.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Producto encontrado',
          producto: data.Item
        }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Producto no encontrado',
        }),
      };
    }
  } catch (error) {
    console.error('Error buscando producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error interno: ${error.message}`,
        stack: error.stack
      }),
    };
  }
};
