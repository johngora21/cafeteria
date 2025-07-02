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
import { collection, addDoc, QueryDocumentSnapshot, DocumentData, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useCart } from "@/hooks/useCart"
import { CartSummary } from "@/components/CartSummary"
import { QRCodeSVG } from 'qrcode.react'
import { PaymentDialog } from "@/app/components/PaymentDialog"
import { toast } from "@/components/ui/use-toast"

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
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [categories, setCategories] = useState<string[] | null>(null)
  const [cashiers, setCashiers] = useState<any[] | null>(null)
  const [orders, setOrders] = useState<any[] | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [orderAmount, setOrderAmount] = useState(0)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  const filteredItems =
    selectedCategory === "All" ? menuItems : menuItems?.filter((item) => item.category === selectedCategory)

  const handlePayment = async () => {
    try {
      const newOrderNumber = `ORD${Date.now().toString().slice(-6)}`
      const orderData = {
        orderNumber: newOrderNumber,
        customerName: "", // Will be updated after payment
        phoneNumber: "", // Will be updated after payment
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
        source: "student_portal",
        zenoPayOrderId: null, // Will be updated after payment
        paymentStatus: "PENDING"
      };
      
      // Save the order to Firebase first
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      
      setOrderNumber(newOrderNumber);
      setOrderId(orderRef.id); // Store the Firebase order ID
      
      // Show payment dialog with the order amount
      setOrderAmount(getTotalPrice());
      setIsPaymentOpen(true);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order. Please try again.",
      });
    }
  }

  const handlePaymentSuccess = async (zenoPayOrderId: string, customerData?: { name: string; phone: string }) => {
    if (!customerData?.name || !customerData?.phone) {
      console.error("Invalid customer data received:", customerData);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing or invalid customer information from payment.",
      });
      return;
    }

    try {
      // First update customer state for the receipt
      const trimmedName = customerData.name.trim();
      const formattedPhone = customerData.phone.trim();
      
      setCustomerName(trimmedName);
      setCustomerPhone(formattedPhone);

      // Then update Firebase if we have an order ID
      if (orderId) {
        const updateData = {
          zenoPayOrderId,
          paymentStatus: "SUCCESS",
          status: "paid",
          paidAt: new Date().toISOString(),
          customerName: customerData.name,
          phoneNumber: customerData.phone
        };
        
        await updateDoc(doc(db, "orders", orderId), updateData);
        
        console.log("Order updated with payment and customer info:", {
          orderId,
          zenoPayOrderId,
          customerName: customerData.name,
          customerPhone: customerData.phone
        });
      }

      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed.",
      });
      
      // Show the QR code and receipt
      setIsPaymentOpen(false);
      setShowQRCode(true);
      clearCart();
    } catch (error) {
      console.error("Error updating order with payment info:", error);
      toast({
        variant: "destructive",
        title: "Warning",
        description: "Order paid but failed to save to database. Please keep this receipt!",
      });
      
      // Still show receipt even if database update fails
      setIsPaymentOpen(false);
      setShowQRCode(true);
      clearCart();
    }
  };

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

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems && filteredItems.length === 0 ? (
            <span className="text-gray-500 text-xs">No menu items available.</span>
          ) : (
            filteredItems?.map((item) => (
              <Card key={item.id} className={!item.ready ? "opacity-50" : ""}>
                <CardHeader className="p-0">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-28 sm:h-36 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-2 sm:p-3">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-sm sm:text-base">{item.name}</CardTitle>
                    <Badge variant={item.ready ? "default" : "secondary"} className="text-xs sm:text-sm">
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
            <DialogTitle className="text-base">Review Order</DialogTitle>
            <DialogDescription className="text-xs">Review your order before proceeding to payment</DialogDescription>
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCheckout(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowCheckout(false);
                setOrderAmount(getTotalPrice());
                setIsPaymentOpen(true);
              }}
              className="text-xs"
            >
              Proceed to Payment
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
              Your order has been placed and paid. Show this QR code at the pickup counter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              {orderNumber && (
                <>
                  <QRCodeSVG 
                    value={JSON.stringify({
                      orderNumber,
                      orderId,
                      status: "paid",
                      timestamp: new Date().toISOString(),
                      customer: {
                        name: customerName,
                        phone: customerPhone
                      },
                      payment: {
                        total: getTotalPrice(),
                        currency: "TSh",
                        status: "COMPLETED",
                        timestamp: new Date().toISOString()
                      },
                      items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.price * item.quantity
                      })),
                      meta: {
                        version: "1.0",
                        type: "cafeteria_order",
                        generated: new Date().toISOString()
                      }
                    })} 
                    size={200}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    includeMargin={true}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium">Order #{orderNumber}</p>
                    <p className="text-xs text-gray-600">Show this QR code at pickup</p>
                  </div>
                </>
              )}
            </div>

            {/* Digital Receipt */}
            <div className="bg-white border rounded-lg text-left divide-y">
              {/* Header */}
              <div className="p-3">
                <h3 className="font-semibold text-sm">Digital Receipt</h3>
                <p className="text-xs text-gray-500 mt-1">Keep this for your records</p>
              </div>
              
              {/* Customer Info */}
              <div className="p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Phone:</span>
                  <span>{customerPhone}</span>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium">Order Status</p>
                    <p className="text-[10px] text-gray-500">{new Date().toLocaleString()}</p>
                  </div>
                  <Badge className="bg-green-500 text-[10px]">Paid & Confirmed</Badge>
                </div>
              </div>

              {/* Items */}
              <div className="p-3">
                <p className="text-xs font-medium mb-2">Order Items:</p>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </div>
                      <span>TSh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Total Amount</span>
                      <span>TSh {getTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50">
                <p className="text-[10px] text-center text-gray-500">
                  Thank you for your order! If you need any assistance,<br/>please contact our support team.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowQRCode(false)} className="w-full text-xs">
              Start New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={orderAmount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
