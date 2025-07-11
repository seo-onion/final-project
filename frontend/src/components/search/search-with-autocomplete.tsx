"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mockProducts } from "@/lib/mock-data"
import type { Product } from "@/types"
import { Search } from "lucide-react"

export function SearchWithAutocomplete() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fuzzy search function
  const fuzzySearch = (searchTerm: string, products: Product[]) => {
    if (!searchTerm) return []

    const term = searchTerm.toLowerCase()

    return products
      .filter((product) => {
        const name = product.name.toLowerCase()
        const description = product.description.toLowerCase()

        // Exact match
        if (name.includes(term) || description.includes(term)) {
          return true
        }

        // Fuzzy match - allow for typos
        const fuzzyMatch = (text: string, search: string) => {
          if (search.length <= 2) return text.startsWith(search)

          let searchIndex = 0
          for (let i = 0; i < text.length && searchIndex < search.length; i++) {
            if (text[i] === search[searchIndex]) {
              searchIndex++
            }
          }
          return searchIndex >= search.length - 1 // Allow for one missing character
        }

        return fuzzyMatch(name, term) || fuzzyMatch(description, term)
      })
      .slice(0, 8) // Limit to 8 suggestions
  }

  useEffect(() => {
    if (query.length >= 2) {
      const results = fuzzySearch(query, mockProducts)
      setSuggestions(results)
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (searchQuery?: string) => {
    const searchTerm = searchQuery || query
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setShowSuggestions(false)
      setQuery("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex].name)
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (product: Product) => {
    handleSearch(product.name)
  }

  return (
    <div className="relative w-full">
      <div className="flex">
        <Input
          ref={inputRef}
          type="text"
          placeholder="¿Qué estás buscando?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          className="rounded-r-none border-r-0 focus:ring-0 focus:border-gray-300 text-black"
        />
        <Button onClick={() => handleSearch()} className="rounded-l-none bg-yellow-400 hover:bg-yellow-500 text-black">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.map((product, index) => (
            <div
              key={product.id}
              className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                index === selectedIndex ? "bg-gray-50" : ""
              }`}
              onClick={() => handleSuggestionClick(product)}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.category} • S/ {product.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />}
    </div>
  )
}
