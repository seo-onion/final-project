"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import type { Order } from "@/types"
import { Eye, Package } from "lucide-react"
import Link from "next/link"
import router from "next/router"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        router.push("/")
        return
      }
      const token = localStorage.getItem("plazavea_token")
      try {
        const res = await fetch("https://5efu0bvbt2.execute-api.us-east-1.amazonaws.com/dev/compra/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Asegúrate que el token esté aquí
          },
          body: JSON.stringify({
            region: user.region || "Lima", // o donde guardes la región
            email: user.email,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || "Error al obtener pedidos")
        }

        const parsedOrders: Order[] = data.compras.map((compra: any) => ({
          id: compra.sort_id.split("#")[1], // extraer solo el UUID
          userId: compra.email,
          createdAt: compra.fecha,
          status: compra.estado,
          items: compra.productos.map((p: any) => ({
            productId: p.sku,
            productName: p.nombre,
            quantity: 1,
            price: parseFloat(p.precio),
          })),
          subtotal: parseFloat(compra.monto_total),
          shipping: parseFloat(compra.monto_total) > 99 ? 0 : 15,
          total: parseFloat(compra.monto_total) > 99 ? parseFloat(compra.monto_total) : parseFloat(compra.monto_total) + 15,
        }))

        setOrders(parsedOrders)
      } catch (err) {
        console.error("Error fetching orders:", err)
      }
    }

    fetchOrders()
  }, [user])


  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "processing":
        return "Procesando"
      case "shipped":
        return "Enviado"
      case "delivered":
        return "Entregado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes pedidos aún</h2>
            <p className="text-gray-600 mb-6">¡Realiza tu primera compra!</p>
            <Link href="/products">
              <Button className="bg-red-600 hover:bg-red-700">Explorar Productos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                      <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString("es-PE")}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Productos ({order.items.length})</h4>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.productId} className="flex justify-between text-sm">
                              <span>
                                {item.productName} x{item.quantity}
                              </span>
                              <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-500">+{order.items.length - 3} productos más</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Resumen</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>S/ {order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>S/ {order.shipping.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>S/ {order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/*
                    <div className="flex justify-end">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                    */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
