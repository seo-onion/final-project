"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/providers/cart-provider"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/types"
import { Star, ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      addItem(product)
      toast({
        title: "Producto agregado",
        description: `${product.name} se agregó al carrito.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="aspect-square relative mb-4 overflow-hidden rounded-lg">
          <img
            src={product.image || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-95 transition-transform duration-200"
          />
          {product.discount && <Badge className="absolute top-2 left-2 bg-red-600">-{product.discount}%</Badge>}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          <p className="text-xs text-gray-500">{product.category}</p>
          
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
          </div>

          <div className="space-y-1">
            {product.originalPrice && (
              <div className="text-xs text-gray-500 line-through">S/ {product.originalPrice.toFixed(2)}</div>
            )}
            <div className="text-lg font-bold text-red-600">S/ {product.price.toFixed(2)}</div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock === 0}
            className="w-full bg-red-600 hover:bg-red-700"
            size="sm"
          >
            {isLoading ? (
              "Agregando..."
            ) : product.stock === 0 ? (
              "Sin stock"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
