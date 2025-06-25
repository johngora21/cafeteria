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
import { useCart } from "@/hooks/useCart"
import { CartSummary } from "@/components/CartSummary"
import { QRCodeSVG } from 'qrcode.react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  ready: boolean
  image: string
}

export default function StudentPortal() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getItemQuantity,
  } = useCart();
  
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

  const handlePayment = async () => {
    try {
      const newOrderNumber = `ORD${Date.now().toString().slice(-6)}`
      const orderData = {
        orderNumber: newOrderNumber,
        customerName: "Student", // Could be made dynamic later
        phoneNumber: phoneNumber,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total: getTotalPrice(),
        status: "ordered",
        timestamp: new Date().toISOString(),
        specialInstructions: specialInstructions,
        source: "student_portal"
      };
      
      await addDoc(collection(db, "orders"), orderData);
      
      setOrderNumber(newOrderNumber);
      setShowPayment(false);
      setShowQRCode(true);
      clearCart();
      setPhoneNumber("");
      setSpecialInstructions("");
    } catch (error) {
      console.error("Error placing order:", error);
      // You could add error handling UI here
    }
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

  // Show loading state while data is being fetched
  if (menuItems === null || categories === null || cashiers === null || orders === null) {
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
                      {getItemQuantity(item.id) > 0 ? (
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
                            {getItemQuantity(item.id)}
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
      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Checkout</DialogTitle>
            <DialogDescription className="text-xs">Review your order and provide contact details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <CartSummary
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                total={getTotalPrice()}
                showActions={true}
                compact={true}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="instructions" className="text-xs">Special Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests or dietary requirements"
                  className="text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCheckout(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowCheckout(false);
                setShowPayment(true);
              }}
              disabled={!phoneNumber.trim()}
              className="text-xs"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Payment</DialogTitle>
            <DialogDescription className="text-xs">Choose your payment method to complete the order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <CartSummary
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                total={getTotalPrice()}
                showActions={true}
                compact={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePayment()}
                className="h-12 text-xs"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Mobile Money
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePayment()}
                className="h-12 text-xs"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Card Payment
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPayment(false)} className="text-xs">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-green-600">Order Placed Successfully!</DialogTitle>
            <DialogDescription className="text-xs">
              Your order has been placed. Please show this QR code at the pickup counter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              {orderNumber && <QRCodeSVG value={orderNumber} size={128} />}
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
              {phoneNumber && <p className="text-xs">Contact: {phoneNumber}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowQRCode(false)} className="w-full text-xs">
              Start New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
