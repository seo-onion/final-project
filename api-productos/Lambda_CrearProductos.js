'use strict';

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const { v4: uuidv4 } = require('uuid');
const db = new AWS.DynamoDB.DocumentClient();

module.exports.crearProducto = async (event) => {
  try {
    
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'Missing Authorization header' };
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // 2. Invocar tu Lambda de validación de token
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

    const {
      tenant_id,
      nombre, 
      precio,
      descripcion
    } = JSON.parse(event.body);

    // 2. Parse body y validar nombre
    if (!tenant_id) {
      return { statusCode: 400, body: 'El campo "categoría" es obligatorio' };
    }
    if (!nombre) {
      return { statusCode: 400, body: 'El campo "nombre" es obligatorio' };
    }

    // 3. Generar SKU
    const sku = uuidv4().split('-')[0];  // p.ej. "9f1c2b4a"

    // 4. Construir sort_id y el item completo
    const sort_id = `${sku}#${nombre}`;

    const item = {
      tenant_id: tenant_id,
      sort_id,
      sku,
      nombre,
      precio: precio ?? null,
      descripcion: descripcion ?? '',
      createdAt: new Date().toISOString()
    };

    // 5. Insertar en DynamoDB
    await db.put({
      TableName: "t_producto",
      Item: item,
      ConditionExpression: 'attribute_not_exists(sort_id)'
    }).promise();

    // 6. Responder
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Producto creado',
        producto: {
          tenant_id: tenant_id,
          sku,
          nombre,
          sort_id: sort_id
        }
      })
    };

  } catch (error) {
    console.error('Error creando producto:', error);
    const status = error.code === 'ConditionalCheckFailedException' ? 409 : 500;
    return {
      statusCode: status,
      body: status === 409
        ? 'Ya existe un producto con ese nombre en este tenant'
        : `Error interno: ${error.message}`
    };
  }
};
