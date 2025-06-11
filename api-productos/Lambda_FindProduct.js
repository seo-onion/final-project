'use strict';
const {
  LambdaClient, InvokeCommand
} = require('@aws-sdk/client-lambda');
const {
  DynamoDBClient, ListTablesCommand
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient
} = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const ddbRaw = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(ddbRaw);

module.exports.lambda_handler = async (event) => {
  try {
    // 1. Validación de token
    const auth = event.headers.Authorization || event.headers.authorization;
    if (!auth) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Missing Authorization header' }) };
    }
    const token = auth.replace(/^Bearer\s+/i, '');
    const respVal = await lambda.send(new InvokeCommand({
      FunctionName: process.env.VALIDATE_TOKEN_FN,
      Payload: JSON.stringify({ token }),
    }));
    const { statusCode } = JSON.parse(new TextDecoder().decode(respVal.Payload));
    if (statusCode === 403) {
      return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden – Token inválido o expirado' }) };
    }

    // 2. Leer sku del body
    const { sku } = JSON.parse(event.body || '{}');
    if (!sku) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Falta el campo sku en el body' }) };
    }

    // 3. Listar todas las tablas en tu cuenta
    const { TableNames = [] } = await ddbRaw.send(new ListTablesCommand({}));

    // 4. Escanear cada tabla que empiece por 't_producto'
    for (const TableName of TableNames) {
      if (!TableName.startsWith('t_producto')) continue;
      const { Items = [] } = await db.scan({
        TableName,
        FilterExpression: 'sku = :s',
        ExpressionAttributeValues: { ':s': sku }
      });
      if (Items.length > 0) {
        // Devolver primer match (puedes devolver todos si prefieres)
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Producto encontrado',
            table: TableName,
            producto: Items[0]
          })
        };
      }
    }

    // 5. Si no encuentra en ninguna tabla
    return { statusCode: 404, body: JSON.stringify({ message: 'Producto no encontrado' }) };

  } catch (error) {
    console.error('Error buscando producto global:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error interno: ${error.message}`
      }),
    };
  }
};
