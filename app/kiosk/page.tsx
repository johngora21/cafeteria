"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingCart, Plus, Minus, CreditCard, QrCode, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, addDoc, QueryDocumentSnapshot, DocumentData, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "2",
    name: "Rice with Chicken",
    description: "Steamed rice served with grilled chicken",
    price: 4000,
    category: "Main Course",
    ready: true,
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "3",
    name: "Chapati with Beans",
    description: "Soft chapati with spiced beans",
    price: 2500,
    category: "Main Course",
    ready: true,
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "4",
    name: "Fresh Juice",
    description: "Mixed tropical fruit juice",
    price: 1500,
    category: "Beverages",
    ready: true,
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    id: "5",
    name: "Tea/Coffee",
    description: "Hot tea or coffee",
    price: 1000,
    category: "Beverages",
    ready: true,
    image: "/placeholder.svg?height=300&width=400",
  },
]

export default function KioskInterface() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[] | null>(null)
  const [cashiers, setCashiers] = useState<{ id: string; name: string }[] | null>(null)
  const [orders, setOrders] = useState<{ id: string; status: string }[] | null>(null)

  const filteredItems =
    selectedCategory === "All" ? menuItems : menuItems?.filter((item) => item.category === selectedCategory)

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
    const newOrderNumber = `KIOSK${Date.now().toString().slice(-6)}`
    setOrderNumber(newOrderNumber)
    setShowPayment(false)
    setShowReceipt(true)
    setCart([])
  }

  useEffect(() => {
    // Real-time menuItems
    const unsubMenu = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        setMenuItems(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    // Real-time categories
    const unsubCat = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories && setCategories(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    // Real-time cashiers
    const unsubCash = onSnapshot(
      collection(db, "cashiers"),
      (snapshot) => {
        setCashiers && setCashiers(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    // Real-time orders (if present)
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders && setOrders(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    return () => {
      unsubMenu();
      unsubCat();
      unsubCash();
      unsubOrders();
    };
  }, []);

  if (menuItems === null || categories === null || cashiers === null || orders === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white shadow-md border-b-2 border-purple-500">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Exit
                </Button>
              </Link>
              <h1 className="text-lg font-medium text-gray-900">Self-Service Kiosk</h1>
            </div>
            <Button
              size="sm"
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="bg-purple-600 hover:bg-purple-700 h-8 px-3 text-xs"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Checkout ({getTotalItems()})
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.name)}
              className="text-xs h-8 px-3"
            >
              {category.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Badge className="bg-green-500 text-xs">Ready to Order</Badge>
                </div>
                <CardDescription className="text-xs mb-2 line-clamp-2">{item.description}</CardDescription>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-600">TSh {item.price.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {cart.find((cartItem) => cartItem.id === item.id) ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium text-sm w-6 text-center">
                          {cart.find((cartItem) => cartItem.id === item.id)?.quantity}
                        </span>
                        <Button size="sm" onClick={() => addToCart(item)} className="h-8 w-8 p-0">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => addToCart(item)} className="text-xs h-8">
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-500 shadow-lg p-3">
            <div className="container mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Your Order</h3>
                  <p className="text-xs text-gray-600">{getTotalItems()} items</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-green-600">TSh {getTotalPrice().toLocaleString()}</p>
                  <Button
                    size="sm"
                    onClick={() => setShowPayment(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-xs h-8 mt-1"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Payment</DialogTitle>
            <DialogDescription className="text-xs">Choose your payment method to complete the order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-1 text-xs">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">TSh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium text-sm">
                  <span>Total:</span>
                  <span className="text-green-600">TSh {getTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                variant={paymentMethod === "mobile" ? "default" : "outline"}
                onClick={() => setPaymentMethod("mobile")}
                className="h-12 text-xs"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Mobile Money
              </Button>
              <Button
                size="sm"
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="h-12 text-xs"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Card Payment
              </Button>
            </div>

            {paymentMethod && (
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm mb-2">
                  {paymentMethod === "mobile"
                    ? "Insert your mobile money details on the payment terminal"
                    : "Insert or tap your card on the payment terminal"}
                </p>
                <div className="animate-pulse">
                  <div className="w-10 h-10 bg-blue-200 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">Waiting for payment...</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPayment(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePayment}
              disabled={!paymentMethod}
              className="bg-green-600 hover:bg-green-700 text-xs"
            >
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-green-600">Payment Successful!</DialogTitle>
            <DialogDescription className="text-xs">
              Your order has been placed. Please collect your receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium">Order #{orderNumber}</p>
              <p className="text-xs text-gray-600 mt-1">Show this at the pickup counter</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Order Details</h3>
              <p className="text-xs">
                Status: <Badge className="bg-yellow-500 text-[10px]">Preparing</Badge>
              </p>
              <p className="text-xs">Estimated Time: 15-20 minutes</p>
              <p className="text-xs">Total: TSh {getTotalPrice().toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowReceipt(false)} className="w-full text-xs">
              Start New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
