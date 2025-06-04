"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingCart, Plus, Minus, ArrowLeft, CreditCard, QrCode } from "lucide-react"
import Link from "next/link"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  ready: boolean
  image: string
}

interface CartItem extends MenuItem {
  quantity: number
}

const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Ugali with Beef Stew",
    description: "Traditional Tanzanian meal with tender beef",
    price: 3500,
    category: "Main Course",
    ready: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "2",
    name: "Rice with Chicken",
    description: "Steamed rice served with grilled chicken",
    price: 4000,
    category: "Main Course",
    ready: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "3",
    name: "Chapati with Beans",
    description: "Soft chapati with spiced beans",
    price: 2500,
    category: "Main Course",
    ready: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "4",
    name: "Fresh Juice",
    description: "Mixed tropical fruit juice",
    price: 1500,
    category: "Beverages",
    ready: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "5",
    name: "Tea/Coffee",
    description: "Hot tea or coffee",
    price: 1000,
    category: "Beverages",
    ready: true,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "6",
    name: "Mandazi",
    description: "Traditional fried dough snack",
    price: 500,
    category: "Snacks",
    ready: false,
    image: "/placeholder.svg?height=200&width=300",
  },
]

export default function StudentPortal() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")

  const categories = ["All", "Main Course", "Beverages", "Snacks"]

  const filteredItems =
    selectedCategory === "All" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id)
      if (existing && existing.quantity > 1) {
        return prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handlePayment = () => {
    const newOrderNumber = `ORD${Date.now().toString().slice(-6)}`
    setOrderNumber(newOrderNumber)
    setShowPayment(false)
    setShowQRCode(true)
    setCart([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-lg font-medium text-gray-900">Student Portal</h1>
            </div>
            <Button onClick={() => setShowCheckout(true)} className="relative h-8 px-3" disabled={cart.length === 0}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              <span className="text-xs">Cart ({getTotalItems()})</span>
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap text-xs h-8 px-3"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className={!item.ready ? "opacity-50" : ""}>
              <CardHeader className="p-0">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-36 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Badge variant={item.ready ? "default" : "secondary"} className="text-xs">
                    {item.ready ? "Ready to Order" : "Not Available"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mb-2 line-clamp-2">{item.description}</CardDescription>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-600">TSh {item.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    {cart.find((cartItem) => cartItem.id === item.id) ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-medium text-sm w-5 text-center">
                          {cart.find((cartItem) => cartItem.id === item.id)?.quantity}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                          disabled={!item.ready}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => addToCart(item)} disabled={!item.ready} className="h-7 text-xs">
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Your Order</DialogTitle>
            <DialogDescription className="text-sm">Review your items before proceeding to payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    TSh {item.price.toLocaleString()} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)} className="h-7 w-7 p-0">
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm w-5 text-center">{item.quantity}</span>
                  <Button size="sm" onClick={() => addToCart(item)} className="h-7 w-7 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-medium">
                <span>Total:</span>
                <span className="text-green-600">TSh {getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="text-xs">
              Continue Shopping
            </Button>
            <Button
              onClick={() => {
                setShowCheckout(false)
                setShowPayment(true)
              }}
              className="text-xs"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Payment Details</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your mobile money details to complete the order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="phone" className="text-sm">
                Mobile Money Number
              </Label>
              <Input
                id="phone"
                placeholder="e.g., +255 123 456 789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="instructions" className="text-sm">
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Any special requests for your order..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span>Subtotal:</span>
                <span>TSh {getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Total:</span>
                <span className="text-green-600">TSh {getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={!phoneNumber} className="bg-green-600 hover:bg-green-700 text-xs">
              <CreditCard className="w-3 h-3 mr-1" />
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-lg text-green-600">Payment Successful!</DialogTitle>
            <DialogDescription className="text-sm">
              Your order has been placed. Show this QR code at pickup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              <QrCode className="w-24 h-24 mx-auto text-gray-400" />
              <p className="mt-2 text-xs text-gray-600">QR Code for Order #{orderNumber}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Order Details</h3>
              <p className="text-xs">
                Order Number: <strong>{orderNumber}</strong>
              </p>
              <p className="text-xs">
                Status: <Badge className="bg-blue-500 text-[10px]">Ordered - Food Ready for Pickup</Badge>
              </p>
              <p className="text-xs">Please proceed to pickup counter with this QR code</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowQRCode(false)} className="w-full text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
