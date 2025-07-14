"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductForm } from "@/components/admin/product-form"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/types"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    if (user?.tenant !== "admin" && user?.tenant !== "vendor") {
      window.location.href = "/"
      return
    }
    const fetchProducts = async () => {
      const token = localStorage.getItem("plazavea_token")

      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "No has iniciado sesión.",
          variant: "destructive",
        })
        return
      }

      try {
        const response = await fetch("https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/listAll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
          stock: 0,
          category: p.tenant_id,
        }))

        setProducts(mappedProducts)
      } catch (error) {
        console.error("Error al cargar productos:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al obtener productos",
          variant: "destructive",
        })
      }
    }
    fetchProducts()
  }, [user])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateProduct = async (productData: Omit<Product, "id">) => {
    const token = localStorage.getItem("plazavea_token")

    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "No has iniciado sesión.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: productData.category,
          nombre: productData.name,
          precio: productData.price,
          descripcion: productData.description,
        }),
      })
      setShowForm(false)
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      })
    }
    catch (error) {
      console.error("Error al crear producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el producto",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProduct = async (productData: Omit<Product, "id">) => {
    if (!editingProduct) return

    const token = localStorage.getItem("plazavea_token")
    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "No has iniciado sesión.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/patch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: editingProduct.category,
          sku: editingProduct.code,
          nombre: productData.name,
          precio: productData.price,
          descripcion: productData.description,
          categoria: productData.category,
          stock: productData.stock,
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo actualizar el producto en el servidor")
      }

      const updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p,
      )
      setProducts(updatedProducts)
      setEditingProduct(null)
      setShowForm(false)
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      })
    }
    catch (error) {
      console.error("Error al actualizar producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el producto",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const token = localStorage.getItem("plazavea_token")
    const product = products.find((p) => p.id === productId)

    if (!token || !product) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el producto o el token.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("https://m34zhwbth7.execute-api.us-east-1.amazonaws.com/dev/product/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: product.category,
          sku: product.code,
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar el producto en el servidor")
      }

      setProducts(products.filter((p) => p.id !== productId))
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el producto",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
            onCancel={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600">Código: {product.code}</p>
                      <p className="text-gray-600">{product.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary">{product.category}</Badge>
                        <span className="font-bold text-red-600">S/ {product.price}</span>
                        {/*
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        */}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos.</p>
          </div>
        )}
      </div>
    </div>
  )
}
