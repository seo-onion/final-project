"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"

interface ProductFiltersProps {
  onCategoryChange: (category: string) => void
  onPriceRangeChange: (range: number[]) => void
  selectedCategory: string
  priceRange: number[]
  maxPrice: number
}

const categories = [
  { value: "", label: "Todas las categorías" },
  { value: "Supermercado", label: "Supermercado" },
  { value: "Electro", label: "Electro" },
  { value: "Hogar", label: "Hogar" },
  { value: "Cuidado-personal", label: "Cuidado Personal" },
  { value: "Moda", label: "Moda" },
]

export function ProductFilters({
  onCategoryChange,
  onPriceRangeChange,
  selectedCategory,
  priceRange,
  maxPrice,
}: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedCategory} onValueChange={onCategoryChange}>
            {categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <RadioGroupItem value={category.value} id={category.value} />
                <Label htmlFor={category.value}>{category.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rango de Precio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={onPriceRangeChange}
              max={maxPrice}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>S/ {priceRange[0]}</span>
              <span>S/ {priceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
