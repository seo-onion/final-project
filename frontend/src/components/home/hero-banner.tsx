"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const banners = [
  {
    id: 1,
    title: "Mi papá luce increíble!",
    subtitle: "Ofertas especiales para el Día del Padre",
    buttonText: "¡VER TODO!",
    image: "/placeholder.png?height=400&width=800",
    bgColor: "bg-gradient-to-r from-blue-400 to-blue-600",
  },
  {
    id: 2,
    title: "Electro y Hogar",
    subtitle: "Los mejores precios en tecnología",
    buttonText: "EXPLORAR",
    image: "/placeholder.png?height=400&width=800",
    bgColor: "bg-gradient-to-r from-purple-400 to-purple-600",
  },
  {
    id: 3,
    title: "Supermercado",
    subtitle: "Todo lo que necesitas para tu hogar",
    buttonText: "COMPRAR",
    image: "/placeholder.png?height=400&width=800",
    bgColor: "bg-gradient-to-r from-green-400 to-green-600",
  },
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  return (
    <div className="relative h-96 overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
          }`}
        >
          <div className={`w-full h-full ${banner.bgColor} flex items-center`}>
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">{banner.title}</h1>
                  <p className="text-xl mb-6">{banner.subtitle}</p>
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                    {banner.buttonText}
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img
                    src={banner.image || "/placeholder.svg"}
                    alt={banner.title}
                    className="w-full h-auto max-w-md mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
