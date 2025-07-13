#!/usr/bin/env python3
import requests
import json
import time
from decimal import Decimal

# URLs específicas obtenidas del script de endpoints
USUARIOS_API_BASE = "https://iwrywt4dql.execute-api.us-east-1.amazonaws.com/dev"
PRODUCTOS_API_BASE = "https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev"
COMPRAS_API_BASE = "https://5efu0bvbt2.execute-api.us-east-1.amazonaws.com/dev"

# Endpoints específicos
ENDPOINTS = {
    'user_register': f"{USUARIOS_API_BASE}/user/register",
    'user_login': f"{USUARIOS_API_BASE}/user/login",
    'product_create': f"{PRODUCTOS_API_BASE}/product/create",
    'product_list': f"{PRODUCTOS_API_BASE}/product/list",
    'compra_create': f"{COMPRAS_API_BASE}/compra/create",
    'compra_list': f"{COMPRAS_API_BASE}/compra/list"
}

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def make_request(method, url, data=None, headers=None):
    """Hacer petición HTTP con manejo de errores"""
    try:
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        else:
            raise ValueError(f"Método HTTP no soportado: {method}")
        
        print(f"{method} {url}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        print("-" * 50)
        
        return response
    except Exception as e:
        print(f"Error en petición {method} {url}: {str(e)}")
        return None

def register_admin_user():
    """Registrar usuario administrador"""
    print("=== REGISTRANDO USUARIO ADMINISTRADOR ===")
    
    user_data = {
        "region": "plazavea",  # tenant_id requerido
        "email": "admin@plazavea",
        "password": "admin123",
        "name": "Admin",
        "lastname": "PlazaVea"  # lastname requerido
    }
    
    response = make_request('POST', ENDPOINTS['user_register'], user_data)
    if response and response.status_code in [200, 201]:
        print("✅ Usuario administrador registrado exitosamente")
        return True
    else:
        print("❌ Error al registrar usuario administrador")
        return False

def login_user():
    """Hacer login y obtener token"""
    print("=== HACIENDO LOGIN ===")
    
    login_data = {
        "region": "plazavea",  # tenant_id requerido
        "email": "admin@plazavea",
        "password": "admin123"
    }
    
    response = make_request('POST', ENDPOINTS['user_login'], login_data)
    if response and response.status_code == 200:
        try:
            response_data = response.json()
            print(f"Response data: {response_data}")
            
            # Manejar estructura de respuesta anidada
            if 'body' in response_data:
                if isinstance(response_data['body'], str):
                    # Si body es string, parsearlo como JSON
                    body_data = json.loads(response_data['body'])
                else:
                    # Si body ya es dict
                    body_data = response_data['body']
                
                if 'token' in body_data:
                    token = body_data['token']
                    print(f"✅ Login exitoso. Token obtenido: {token[:20]}...")
                    return token
            
            # Si no hay estructura body, buscar token directamente
            if 'token' in response_data:
                token = response_data['token']
                print(f"✅ Login exitoso. Token obtenido: {token[:20]}...")
                return token
            
            print("❌ No se encontró token en la respuesta")
            return None
            
        except json.JSONDecodeError as e:
            print(f"❌ Error al parsear respuesta JSON: {e}")
            return None
    else:
        print("❌ Error en login")
        return None

def create_products(token):
    """Crear productos de prueba"""
    print("=== CREANDO PRODUCTOS ===")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # Agregar timestamp para hacer nombres únicos
    timestamp = int(time.time())
    
    productos = [
        {
            "tenant_id": "plazavea",
            "nombre": f"Laptop HP Pavilion {timestamp}",
            "descripcion": "Laptop HP Pavilion 15.6 pulgadas, Intel Core i5, 8GB RAM, 256GB SSD",
            "precio": 2499.99
        },
        {
            "tenant_id": "plazavea",
            "nombre": f"Smartphone Samsung Galaxy A54 {timestamp}",
            "descripcion": "Smartphone Samsung Galaxy A54 5G, 128GB, Cámara 50MP",
            "precio": 1299.99
        },
        {
            "tenant_id": "plazavea",
            "nombre": f"Auriculares Sony WH-1000XM4 {timestamp}",
            "descripcion": "Auriculares inalámbricos Sony WH-1000XM4 con cancelación de ruido",
            "precio": 899.99
        },
        {
            "tenant_id": "plazavea",
            "nombre": f"Mesa de Escritorio {timestamp}",
            "descripcion": "Mesa de escritorio de madera, 120cm x 60cm, color nogal",
            "precio": 599.99
        },
        {
            "tenant_id": "plazavea",
            "nombre": f"Cafetera Espresso {timestamp}",
            "descripcion": "Cafetera espresso automática, 15 bares de presión, acero inoxidable",
            "precio": 1799.99
        }
    ]
    
    created_products = []
    
    for i, producto in enumerate(productos, 1):
        print(f"\n--- Creando producto {i}/5: {producto['nombre']} ---")
        
        response = make_request('POST', ENDPOINTS['product_create'], producto, headers)
        if response and response.status_code in [200, 201]:
            try:
                product_data = response.json()
                created_products.append(product_data)
                print(f"✅ Producto creado: {producto['nombre']}")
            except:
                print(f"✅ Producto creado: {producto['nombre']} (sin datos de respuesta)")
                created_products.append(producto)
        else:
            print(f"❌ Error al crear producto: {producto['nombre']}")
        
        time.sleep(1)  # Pausa entre peticiones
    
    return created_products

def create_compras(token, products):
    """Crear compras de prueba"""
    print("=== CREANDO COMPRAS ===")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # El user_sort_id debe ser email#name#lastname según la estructura de usuarios
    user_sort_id = "admin@plazavea#Admin#PlazaVea"
    
    # Si no hay productos creados, usar nombres genéricos
    if not products:
        print("❌ No hay productos creados, usando nombres genéricos")
        product_names = ["Producto Genérico 1", "Producto Genérico 2", "Producto Genérico 3"]
        prices = [100.00, 200.00, 300.00]
    else:
        # Usar los productos realmente creados
        product_names = []
        prices = []
        for product in products[:5]:  # Máximo 5 productos
            if 'producto' in product:
                product_names.append(product['producto']['nombre'])
                prices.append(product['producto']['precio'])
            elif 'nombre' in product:
                product_names.append(product['nombre'])
                prices.append(product['precio'])
    
    compras = []
    for i, (nombre, precio) in enumerate(zip(product_names, prices)):
        cantidad = i + 1  # Cantidad variable
        total = precio * cantidad
        
        compra = {
            "region": "plazavea",
            "user_sort_id": user_sort_id,
            "productos": [
                {
                    "nombre": nombre,
                    "cantidad": cantidad,
                    "precio": Decimal(str(precio))
                }
            ],
            "total": Decimal(str(total))
        }
        compras.append(compra)
    
    created_compras = []
    
    for i, compra in enumerate(compras, 1):
        print(f"\n--- Creando compra {i}/{len(compras)}: {compra['productos'][0]['nombre']} ---")
        
        # Convertir Decimal a float para JSON
        compra_json = json.loads(json.dumps(compra, cls=DecimalEncoder))
        
        response = make_request('POST', ENDPOINTS['compra_create'], compra_json, headers)
        if response and response.status_code in [200, 201]:
            try:
                compra_data = response.json()
                created_compras.append(compra_data)
                print(f"✅ Compra creada: {compra['productos'][0]['nombre']}")
            except:
                print(f"✅ Compra creada: {compra['productos'][0]['nombre']} (sin datos de respuesta)")
                created_compras.append(compra_json)
        else:
            print(f"❌ Error al crear compra: {compra['productos'][0]['nombre']}")
        
        time.sleep(1)  # Pausa entre peticiones
    
    return created_compras

def main():
    """Función principal"""
    print("🚀 INICIANDO INGESTA MASIVA DE DATOS")
    print("=" * 60)
    
    print("URLs configuradas:")
    for key, url in ENDPOINTS.items():
        print(f"  {key}: {url}")
    print("=" * 60)
    
    # Paso 1: Registrar usuario administrador
    if not register_admin_user():
        print("❌ Falló el registro del usuario. Deteniendo proceso.")
        return
    
    time.sleep(2)
    
    # Paso 2: Hacer login
    token = login_user()
    if not token:
        print("❌ Falló el login. Deteniendo proceso.")
        return
    
    time.sleep(2)
    
    # Paso 3: Crear productos
    products = create_products(token)
    if not products:
        print("❌ No se pudieron crear productos. Deteniendo proceso.")
        return
    
    time.sleep(2)
    
    # Paso 4: Crear compras
    compras = create_compras(token, products)
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE INGESTA MASIVA")
    print("=" * 60)
    print(f"✅ Usuario administrador: admin@plazavea")
    print(f"✅ Productos creados: {len(products)}")
    print(f"✅ Compras creadas: {len(compras)}")
    print("=" * 60)
    print("🎉 INGESTA MASIVA COMPLETADA")

if __name__ == "__main__":
    main() 