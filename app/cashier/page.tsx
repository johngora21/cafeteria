"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { QrCode, Scan, Package, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, addDoc, QueryDocumentSnapshot, DocumentData, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { QrReader } from 'react-qr-reader'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: "ordered" | "ready_for_pickup" | "picked_up"
  timestamp: string
  phoneNumber: string
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  ready: boolean
}

export default function CashierPortal() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null)
  const [scannedCode, setScannedCode] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-blue-500"
      case "ready_for_pickup":
        return "bg-green-500"
      case "picked_up":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ordered":
        return <Package className="w-3 h-3" />
      case "ready_for_pickup":
        return <CheckCircle className="w-3 h-3" />
      case "picked_up":
        return <CheckCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }

  const toggleMenuItemAvailability = async (itemId: string) => {
    try {
      const item = menuItems?.find(item => item.id === itemId);
      if (item) {
        await updateDoc(doc(db, "menuItems", itemId), {
          ready: !item.ready
        });
      }
    } catch (error) {
      console.error("Error toggling menu item availability:", error);
    }
  }

  const handleQRScan = () => {
    const orderNumber = scannedCode.toUpperCase()
    const order = orders?.find((o) => o.orderNumber === orderNumber)

    if (order) {
      // Automatically update status based on current status
      if (order.status === "ordered") {
        updateOrderStatus(order.id, "ready_for_pickup")
        setSelectedOrder({ ...order, status: "ready_for_pickup" })
      } else if (order.status === "ready_for_pickup") {
        updateOrderStatus(order.id, "picked_up")
        setSelectedOrder({ ...order, status: "picked_up" })
      } else {
        setSelectedOrder(order)
      }
    } else {
      alert("Order not found!")
    }
    setScannedCode("")
    setShowScanner(false)
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
    // Real-time orders
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })
          )
        );
      }
    );
    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, []);

  if (orders === null || menuItems === null) {
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
              <h1 className="text-lg font-medium text-gray-900">Cashier Portal</h1>
            </div>
            <Button onClick={() => setShowScanner(true)} className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs">
              <Scan className="w-3 h-3 mr-1" />
              Scan QR
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="orders" className="text-xs">
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="text-xs">
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-3">
              <h2 className="text-sm font-medium">Active Orders</h2>
              {orders
                .filter((order) => order.status !== "picked_up")
                .map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-1 text-sm">
                            {getStatusIcon(order.status)}
                            Order #{order.orderNumber}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {order.customerName} • {order.timestamp}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-[10px]`}>
                          {order.status === "ordered"
                            ? "Ordered"
                            : order.status === "ready_for_pickup"
                              ? "Ready for Pickup"
                              : "Picked Up"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>TSh {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 flex justify-between font-medium text-xs">
                          <span>Total:</span>
                          <span>TSh {order.total.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {order.status === "ready_for_pickup" && (
                          <Badge className="bg-green-500 text-[10px]">Ready for Pickup - Scan QR to Complete</Badge>
                        )}
                        {order.status === "ordered" && (
                          <Badge className="bg-blue-500 text-[10px]">Ordered - Scan QR when Customer Arrives</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <div className="grid gap-3">
              <h2 className="text-sm font-medium">Menu Items</h2>
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex justify-between items-center p-3">
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-600">
                        {item.category} • TSh {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={item.ready ? "default" : "secondary"} className="text-[10px]">
                        {item.ready ? "Ready to Order" : "Not Available"}
                      </Badge>
                      <Switch
                        checked={item.ready}
                        onCheckedChange={() => toggleMenuItemAvailability(item.id)}
                        className="scale-75"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Today&apos;s Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">
                    {orders.filter(order => {
                      const orderDate = new Date(order.timestamp).toDateString();
                      const today = new Date().toDateString();
                      return orderDate === today;
                    }).length}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Orders placed today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">
                    TSh {orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">All time revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">
                    TSh {orders.length > 0 
                      ? Math.round(orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length).toLocaleString()
                      : 0
                    }
                  </div>
                  <p className="text-[10px] text-muted-foreground">Average per order</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">{orders.length}</div>
                  <p className="text-[10px] text-muted-foreground">All time orders</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Popular Items Section */}
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium">Popular Items</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {(() => {
                  const itemCounts: { [key: string]: number } = {};
                  orders.forEach(order => {
                    order.items.forEach(item => {
                      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                    });
                  });
                  
                  const popularItems = Object.entries(itemCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);
                  
                  if (popularItems.length === 0) {
                    return <p className="text-xs text-gray-500">No orders yet</p>;
                  }
                  
                  return (
                    <div className="space-y-2">
                      {popularItems.map(([itemName, count]) => (
                        <div key={itemName} className="flex justify-between items-center text-xs">
                          <span className="truncate">{itemName}</span>
                          <Badge variant="secondary" className="text-[10px]">{count} orders</Badge>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Scan QR Code</DialogTitle>
            <DialogDescription className="text-xs">
              Scan the order QR code using your device camera
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={(result, error) => {
                  if (!!result) {
                    setScannedCode(result.getText());
                    // Simulate pressing the process button
                    setTimeout(() => handleQRScan(), 200);
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Label htmlFor="qr-input" className="text-xs">
                Or enter order number manually:
              </Label>
              <Input
                id="qr-input"
                placeholder="e.g., ORD123456"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanner(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleQRScan} disabled={!scannedCode} className="text-xs">
              Process Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Order Processed</DialogTitle>
            <DialogDescription className="text-xs">Order details and receipt</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-medium text-sm text-green-800">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-green-600">Customer: {selectedOrder.customerName}</p>
                <p className="text-xs text-green-600">
                  Status:{" "}
                  {selectedOrder.status === "picked_up"
                    ? "Completed - Food Picked Up ✓"
                    : selectedOrder.status === "ready_for_pickup"
                      ? "Ready for Pickup ✓"
                      : "Order Confirmed ✓"}
                </p>
              </div>
              <div className="space-y-1">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>TSh {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-1 flex justify-between font-medium text-xs">
                  <span>Total:</span>
                  <span>TSh {selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedOrder(null)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
