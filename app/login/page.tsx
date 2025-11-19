"use client"

import type React from "react"

import { useState } from "react"
// import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (
        (email === "admin@stogo.com" && password === "admin") ||
        (email === "coordinator@stogo.com" && password === "coordinator")
      ) {
        // Simulate loading
        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push("/")
        router.refresh()
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/stogo.png" alt="STOGO Logo" width={64} height={64} className="rounded-lg" />{" "}
            {/* Updated logo path and alt text */}
          </div>
          <CardTitle className="text-2xl font-bold text-primary">STOGO Ledger</CardTitle>{" "}
          {/* Updated from "Stogo Flex Coordinator" to "STOGO Ledger" */}
          <CardDescription>Sign in to access your workforce management dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Demo Accounts:</p>
            <div className="space-y-1">
              <p>
                <strong>Admin:</strong> admin@stogo.com / admin
              </p>
              <p>
                <strong>Coordinator:</strong> coordinator@stogo.com / coordinator
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
