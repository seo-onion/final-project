"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { SearchWithAutocomplete } from "@/components/search/search-with-autocomplete"
import { Menu, Search, ShoppingCart, User, Package, LogOut, Settings } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { getTotalItems } = useCart()

  return (
    <>
      {/* Top Banner */}
      <div className="bg-yellow-400 text-black text-center py-2 text-sm font-medium">
        DELIVERY GRATIS EN ELECTRO POR COMPRAS DESDE S/999 CON CUALQUIER MEDIO DE PAGO
      </div>

      {/* Main Header */}
      <header className="bg-red-600 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <nav className="space-y-4">
                  <Link href="/" className="block text-lg font-semibold">
                    Inicio
                  </Link>
                  <Link href="/products" className="block text-lg">
                    Productos
                  </Link>
                  {user?.tenant === "admin" || user?.tenant === "vendor" ? (
                    <Link href="/admin/products" className="block text-lg">
                      Gestión de Productos
                    </Link>
                  ) : null}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold">PlazaVea</div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <SearchWithAutocomplete />
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Search - Mobile */}
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span className="hidden md:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Mis Pedidos
                      </Link>
                    </DropdownMenuItem>
                    {(user.tenant === "admin" || user.tenant === "vendor") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/products" className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Gestión de Productos
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout} className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="secondary" size="sm">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-yellow-400 text-black">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 h-12">
            <Link href="/products" className="text-gray-700 hover:text-red-600 font-medium">
              Todos los Productos
            </Link>
            <Link href="/products?category=supermercado" className="text-gray-700 hover:text-red-600">
              Supermercado
            </Link>
            <Link href="/products?category=electro" className="text-gray-700 hover:text-red-600">
              Electro
            </Link>
            <Link href="/products?category=hogar" className="text-gray-700 hover:text-red-600">
              Hogar
            </Link>
            <Link href="/products?category=moda" className="text-gray-700 hover:text-red-600">
              Moda
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
