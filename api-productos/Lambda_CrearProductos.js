const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const lambda = new LambdaClient({});
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

module.exports.lambda_handler = async (event) => {
  try {
    // 🔁 Manejo de preflight OPTIONS
    if (event.requestContext?.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // 1. Validar token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, headers: corsHeaders, body: 'Missing Authorization header' };
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const validateResp = await lambda.send(new InvokeCommand({
      FunctionName: 'ValidateToken-dev',
      Payload: JSON.stringify({ token }),
    }));

    const payload = JSON.parse(new TextDecoder().decode(validateResp.Payload));
    if (payload.statusCode === 403) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Forbidden - Token inválido o expirado' })
      };
    }

    // 2. Parsear y validar body
    const { tenant_id, nombre, precio, descripcion } = JSON.parse(event.body);
    if (!tenant_id) {
      return { statusCode: 400, headers: corsHeaders, body: 'El campo "tenant_id" es obligatorio' };
    }
    if (!nombre) {
      return { statusCode: 400, headers: corsHeaders, body: 'El campo "nombre" es obligatorio' };
    }
    if (precio == null) {
      return { statusCode: 400, headers: corsHeaders, body: 'El campo "precio" es obligatorio' };
    }

    // 3. Construir item
    const sku = Date.now().toString(36);
    const sort_id = `${nombre}#${precio}`;

    const item = {
      tenant_id,
      sort_id,
      sku,
      nombre,
      precio,
      descripcion: descripcion ?? '',
      createdAt: new Date().toISOString()
    };

    await db.send(new PutCommand({
      TableName: "t_productos-dev",
      Item: item,
      ConditionExpression: 'attribute_not_exists(sort_id)'
    }));

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Producto creado',
        producto: { tenant_id, sku, nombre, precio, sort_id }
      })
    };

  } catch (error) {
    console.error('Error creando producto:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `Error interno: ${error.message}`,
        stack: error.stack
      })
    };
  }
};
