"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/providers/cart-provider"
import { Minus, Plus, Trash2 } from "lucide-react"

export function CartItems() {
  const { items, updateQuantity, removeItem } = useCart()

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.product.id}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <img
                src={item.product.image || "/placeholder.png"}
                alt={item.product.name}
                className="w-20 h-20 object-cover rounded"
              />

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.product.name}</h3>
                <p className="text-gray-600 text-sm">{item.product.description}</p>
                <p className="text-red-600 font-bold text-lg mt-1">S/ {item.product.price.toFixed(2)}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product.id, Number.parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  min="1"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">S/ {(item.product.price * item.quantity).toFixed(2)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-600 hover:text-red-700 mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
