"use client"

import { stringify } from "querystring"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  name: string
  lastname: string
  email: string
  region: string
  tenant?: "customer" | "vendor" | "admin"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, lastname: string,  email: string, password: string, region: string, tenant: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("plazavea_user")
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Error parsing stored user:", error)
      localStorage.removeItem("plazavea_user")
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("https://iwrywt4dql.execute-api.us-east-1.amazonaws.com/dev/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          region: "Lima",
          email,
          password,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Registro fallido")
      }

      const data = await response.json()
      if (data.statusCode === 403) {
        const body = JSON.parse(data.body)
        throw new Error(body.error || "Credenciales incorrectas")
      }

      const parsedBody = JSON.parse(data.body)
      let user: User = parsedBody.user
      if (user.email === "admin@plazavea.com") {
        user = {...user, tenant: "admin"}
      }
      setUser(user)
      localStorage.setItem("plazavea_user", JSON.stringify(user))
      localStorage.setItem("plazavea_token", parsedBody.token)
    }
    catch (error) {
      console.error("Error en login", error)
      throw error
    }
  }

  const register = async (region: string, email: string, name: string, lastname: string, password: string, tenant: string) => {
    try {
      const response = await fetch("https://iwrywt4dql.execute-api.us-east-1.amazonaws.com/dev/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        region,
        email,
        name,
        lastname,
        password,
        tenant,
        }),
      })

      if (!response.ok) {
        throw new Error("Registro fallido")
      }

      const data = await response.json()
      // console.log(data)
      const parsedBody = typeof data.body === "string" ? JSON.parse(data.body) : data.body

      if (data.statusCode === 409) {
        const body = JSON.parse(data.body)
        throw new Error(body.error || "Email ya registrado")
      }

      const newUser: User = {
        ...parsedBody.user,
        tenant: "customer"
      }
      setUser(newUser)
      localStorage.setItem("plazavea_user", JSON.stringify(newUser))
    }
    catch(error) {
      console.error("Error en el registro: ", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("plazavea_user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
