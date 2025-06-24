"use client"

import { useState, useEffect } from "react"
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
import { collection, addDoc, QueryDocumentSnapshot, DocumentData, onSnapshot } from "firebase/firestore"
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

export default function StudentPortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [categories, setCategories] = useState<string[] | null>(null)
  const [cashiers, setCashiers] = useState<any[] | null>(null)
  const [orders, setOrders] = useState<any[] | null>(null)

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
    const newOrderNumber = `ORD${Date.now().toString().slice(-6)}`
    setOrderNumber(newOrderNumber)
    setShowPayment(false)
    setShowQRCode(true)
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
        setCategories(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => doc.data().name as string
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

  if (!mounted || menuItems === null || categories === null || cashiers === null || orders === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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
          {categories.length === 0 ? (
            <span className="text-gray-500 text-xs">No categories found.</span>
          ) : (
            categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap text-xs h-8 px-3"
              >
                {category}
              </Button>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems && filteredItems.length === 0 ? (
            <span className="text-gray-500 text-xs">No menu items available.</span>
          ) : (
            filteredItems?.map((item) => (
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
            ))
          )}
        </div>
      </div>
      {/* ...rest of your dialogs and UI... */}
    </div>
  );
}
