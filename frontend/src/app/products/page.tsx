"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductFilters } from "@/components/products/product-filters"
import { SearchBar } from "@/components/products/search-bar"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/components/providers/auth-provider"
import type { Product } from "@/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const { user } = useAuth()

  const productsPerPage = 12

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/listAll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("No se pudo obtener la lista de productos")
        }

        const raw = await response.json()
        const parsed = JSON.parse(raw.body)

        const mappedProducts: Product[] = parsed.products.map((p: any) => ({
          id: p.sku,
          name: p.nombre,
          description: p.descripcion,
          price: p.precio,
          code: p.sku,
          image: "",
          stock: 1000, // Estatic stock value
          category: p.tenant_id,
          rating: 4 // Random rating product value
        }))

        setProducts(mappedProducts)
        setFilteredProducts(mappedProducts)
      } catch (error) {
        console.error("Error al cargar productos:", error)
      }
    }

    fetchProducts()
  }, [user])

  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Price filter
    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, priceRange, products])

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Productos</h1>
          <SearchBar onSearch={setSearchQuery} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProductFilters
              onCategoryChange={setSelectedCategory}
              onPriceRangeChange={setPriceRange}
              selectedCategory={selectedCategory}
              priceRange={priceRange}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="mb-4">
              <p className="text-gray-600">
                Mostrando {currentProducts.length} de {filteredProducts.length} productos
              </p>
            </div>

            <ProductGrid products={currentProducts} />

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
