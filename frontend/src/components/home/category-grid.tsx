import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const categories = [
  {
    id: 1,
    title: "Supermercado",
    description: "Descubre nuestra gran variedad de productos y recibe tu pedido el mismo día, desde 2 horas.",
    buttonText: "Ingresar",
    href: "/products?category=supermercado",
    image: "/placeholder.png?height=200&width=300",
    bgColor: "bg-gray-100",
  },
  {
    id: 2,
    title: "Electro, hogar y más",
    description: "Lo último en tecnología, electrohogar, deportes, infantil y más. Entregas desde 24 hrs.",
    buttonText: "Ingresar",
    href: "/products?category=electro",
    image: "/placeholder.png?height=200&width=300",
    bgColor: "bg-blue-50",
  },
]

export function CategoryGrid() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category) => (
          <Card key={category.id} className={`${category.bgColor} border-0 overflow-hidden`}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.title}</h2>
                  <p className="text-gray-700 mb-6">{category.description}</p>
                  <Link href={category.href}>
                    <Button className="bg-red-600 hover:bg-red-700">{category.buttonText}</Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
