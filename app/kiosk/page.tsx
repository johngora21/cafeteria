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
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[] | null>(null)
  const [cashiers, setCashiers] = useState<{ id: string; name: string }[] | null>(null)
  const [orders, setOrders] = useState<{ id: string; status: string }[] | null>(null)
  const [receiptData, setReceiptData] = useState<{
    items: any[];
    total: number;
  } | null>(null)

  const filteredItems =
    selectedCategory === "All" ? menuItems : menuItems?.filter((item) => item.category === selectedCategory)

  const handlePayment = async () => {
    try {
      // Store cart data before clearing for receipt
      setReceiptData({
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total: getTotalPrice()
      });

      const newOrderNumber = `KIOSK${Date.now().toString().slice(-6)}`
      const orderData = {
        orderNumber: newOrderNumber,
        customerName: "Kiosk Customer", // Could be made dynamic later
        phoneNumber: "", // Kiosk orders might not need phone
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
        specialInstructions: "",
        source: "kiosk"
      };
      
      await addDoc(collection(db, "orders"), orderData);
      
      setOrderNumber(newOrderNumber);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
      setPaymentMethod("");
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

  const downloadQRCode = () => {
    const svg = document.querySelector('#kiosk-qr-code-svg') as SVGElement;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const DOMURL = window.URL || window.webkitURL || window;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.download = `kiosk-order-${orderNumber}-qr-code.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
    };

    img.src = url;
  };

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

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex gap-2 mb-4 justify-center overflow-x-auto">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-28 sm:h-40 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="p-2 sm:p-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-sm sm:text-base">{item.name}</CardTitle>
                  <Badge variant={item.ready ? "default" : "secondary"} className="text-xs sm:text-sm">
                    {item.ready ? "Ready to Order" : "Not Ready"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mb-2 line-clamp-2">{item.description}</CardDescription>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-600">TSh {item.price.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {getItemQuantity(item.id) > 0 ? (
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
                          {getItemQuantity(item.id)}
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
              <CartSummary
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                total={getTotalPrice()}
                showActions={false}
                compact={true}
              />
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
              {orderNumber && receiptData && (
                <>
                  <QRCodeSVG 
                    id="kiosk-qr-code-svg"
                    value={JSON.stringify({
                      orderNumber,
                      status: "ordered",
                      timestamp: new Date().toISOString(),
                      customer: {
                        name: "Kiosk Customer",
                        source: "kiosk"
                      },
                      payment: {
                        total: receiptData.total,
                        currency: "TSh",
                        status: "COMPLETED",
                        timestamp: new Date().toISOString()
                      },
                      items: receiptData.items,
                      meta: {
                        version: "1.0",
                        type: "cafeteria_kiosk_order",
                        generated: new Date().toISOString()
                      }
                    })} 
                    size={128} 
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    includeMargin={true}
                  />
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Order #{orderNumber}</p>
                    <p className="text-xs text-gray-600">Show this at the pickup counter</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadQRCode}
                      className="text-xs h-8"
                    >
                      Download QR Code
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-medium text-sm mb-1">Order Details</h3>
              <p className="text-xs">
                Status: <Badge className="bg-yellow-500 text-[10px]">Preparing</Badge>
              </p>
              <p className="text-xs">Estimated Time: 15-20 minutes</p>
              <p className="text-xs">Total: TSh {receiptData?.total.toLocaleString()}</p>
              
              {receiptData && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium">Items:</p>
                  {receiptData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.quantity}x {item.name}</span>
                      <span>TSh {item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
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
