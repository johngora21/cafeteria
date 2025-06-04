import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Smartphone, QrCode, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">CoICT Cafeteria</h1>
          <p className="text-base md:text-lg text-gray-600 mb-6">
            University of Dar es Salaam - Smart Food Ordering System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Student Portal</CardTitle>
              <CardDescription className="text-sm">Browse menu, place orders, and track your food</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Link href="/student">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Order Food</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Cashier Portal</CardTitle>
              <CardDescription className="text-sm">Scan QR codes, manage orders, and update menu</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Link href="/cashier">
                <Button className="w-full bg-green-600 hover:bg-green-700">Cashier Login</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Coffee className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Self-Service Kiosk</CardTitle>
              <CardDescription className="text-sm">Touch screen ordering for quick service</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Link href="/kiosk">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Start Ordering</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mx-auto w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Mobile Ordering</h3>
              <p className="text-xs text-gray-600">Order from your phone anytime</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">QR Code Pickup</h3>
              <p className="text-xs text-gray-600">Quick and contactless pickup</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Coffee className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Real-time Status</h3>
              <p className="text-xs text-gray-600">Track your order progress</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-medium text-sm mb-1">Multi-Platform</h3>
              <p className="text-xs text-gray-600">Mobile, web, and kiosk access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
