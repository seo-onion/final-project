'use strict';

module.exports.lambda_handler = async (event) => {
  try {
    const lambda = new AWS.Lambda();
    const db = new AWS.DynamoDB.DocumentClient();

    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'Missing Authorization header' };
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const validateResp = await lambda.invoke({
      FunctionName: 'ValidateToken',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ token })
    }).promise();

    const payload = JSON.parse(validateResp.Payload);
    if (payload.statusCode === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden - Token inválido o expirado' })
      };
    }

    const { tenant_id, nombre, precio, descripcion } = JSON.parse(event.body);
    if (!tenant_id) {
      return { statusCode: 400, body: 'El campo "tenant_id" es obligatorio' };
    }
    if (!nombre) {
      return { statusCode: 400, body: 'El campo "nombre" es obligatorio' };
    }

    // Generar SKU simple sin uuid
    const sku = Date.now().toString(36);

    const sort_id = `${sku}#${nombre}`;

    const item = {
      tenant_id,
      sort_id,
      sku,
      nombre,
      precio: precio ?? null,
      descripcion: descripcion ?? '',
      createdAt: new Date().toISOString()
    };

    await db.put({
      TableName: "t_producto",
      Item: item,
      ConditionExpression: 'attribute_not_exists(sort_id)'
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Producto creado',
        producto: { tenant_id, sku, nombre, sort_id }
      })
    };

  } catch (error) {
    console.error('Error creando producto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error interno: ${error.message}`,
        stack: error.stack
      })
    };
  }
};
