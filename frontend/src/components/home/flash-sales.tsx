"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductCard } from "@/components/products/product-card"
import { mockProducts } from "@/lib/mock-data"

export function FlashSales() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 22,
    minutes: 23,
    seconds: 35,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const flashProducts = mockProducts.filter((p) => p.discount).slice(0, 4)

  return (
    <div className="bg-gradient-to-r from-pink-500 to-red-500 py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
              ¡Solo por hoy!
            </CardTitle>
            <div className="flex justify-center items-center space-x-4 mt-4">
              <span className="text-black font-semibold">Termina en:</span>
              <div className="flex space-x-2">
                <div className="bg-black text-white px-3 py-2 rounded font-bold text-xl">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </div>
                <div className="bg-black text-white px-3 py-2 rounded font-bold text-xl">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </div>
                <div className="bg-black text-white px-3 py-2 rounded font-bold text-xl">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
