"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/providers/cart-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/types"

export function CartSummary() {
  const [isProcessing, setIsProcessing] = useState(false)
  const { items, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const subtotal = getTotalPrice()
  const shipping = subtotal > 99 ? 0 : 15
  const total = subtotal + shipping

  const handleCheckout = async () => {
    const token = localStorage.getItem("plazavea_token")

    if (!user || !user.email || !token) {
      router.push("/auth/login")
      return
    }
    setIsProcessing(true)

    try {
      const productos = items.map((item) => ({
        sku: item.product.code,
        nombre: item.product.name,
        precio: Number(item.product.price),
      })).filter(p => p.precio && !isNaN(p.precio))

      const response = await fetch("https://5efu0bvbt2.execute-api.us-east-1.amazonaws.com/dev/compra/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          region: "Lima",
          email: user.email,
          productos,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Error al registrar el pedido")
      }

      clearCart()

      toast({
        title: "¡Pedido realizado!",
        description: `Tu pedido ha sido procesado correctamente. Total: S/ ${total.toFixed(2)}`,
      })

      router.push("/orders")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({items.length} productos)</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{shipping === 0 ? "GRATIS" : `S/ ${shipping.toFixed(2)}`}</span>
          </div>
          {shipping === 0 && <p className="text-sm text-green-600">¡Envío gratis por compras mayores a S/ 99!</p>}
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>

        <Button
          onClick={handleCheckout}
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={isProcessing || items.length === 0}
        >
          {isProcessing ? "Procesando..." : "Finalizar Compra"}
        </Button>

        <div className="text-xs text-gray-500 text-center">Al continuar, aceptas nuestros términos y condiciones</div>
      </CardContent>
    </Card>
  )
}
