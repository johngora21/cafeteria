"use client"

import { useState } from "react"
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

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD123456",
    customerName: "John Mwalimu",
    items: [
      { name: "Ugali with Beef Stew", quantity: 1, price: 3500 },
      { name: "Fresh Juice", quantity: 1, price: 1500 },
    ],
    total: 5000,
    status: "ready_for_pickup",
    timestamp: "2024-01-15 14:30",
    phoneNumber: "+255 123 456 789",
  },
  {
    id: "2",
    orderNumber: "ORD123457",
    customerName: "Mary Juma",
    items: [{ name: "Rice with Chicken", quantity: 2, price: 4000 }],
    total: 8000,
    status: "ordered",
    timestamp: "2024-01-15 14:25",
    phoneNumber: "+255 987 654 321",
  },
  {
    id: "3",
    orderNumber: "ORD123458",
    customerName: "Peter Moshi",
    items: [
      { name: "Chapati with Beans", quantity: 1, price: 2500 },
      { name: "Tea/Coffee", quantity: 2, price: 1000 },
    ],
    total: 4500,
    status: "ordered",
    timestamp: "2024-01-15 14:35",
    phoneNumber: "+255 555 123 456",
  },
]

const mockMenuItems: MenuItem[] = [
  { id: "1", name: "Ugali with Beef Stew", price: 3500, category: "Main Course", ready: true },
  { id: "2", name: "Rice with Chicken", price: 4000, category: "Main Course", ready: true },
  { id: "3", name: "Chapati with Beans", price: 2500, category: "Main Course", ready: true },
  { id: "4", name: "Fresh Juice", price: 1500, category: "Beverages", ready: true },
  { id: "5", name: "Tea/Coffee", price: 1000, category: "Beverages", ready: true },
  { id: "6", name: "Mandazi", price: 500, category: "Snacks", ready: false },
]

export default function CashierPortal() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems)
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

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ready: !item.ready } : item)))
  }

  const handleQRScan = () => {
    const orderNumber = scannedCode.toUpperCase()
    const order = orders.find((o) => o.orderNumber === orderNumber)

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
              {mockMenuItems.map((item) => (
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
                  <div className="text-lg font-bold">24</div>
                  <p className="text-[10px] text-muted-foreground">+12% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">TSh 156,000</div>
                  <p className="text-[10px] text-muted-foreground">+8% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">TSh 6,500</div>
                  <p className="text-[10px] text-muted-foreground">+3% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium">Popular Item</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-lg font-bold">Rice & Chicken</div>
                  <p className="text-[10px] text-muted-foreground">18 orders today</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Scan QR Code</DialogTitle>
            <DialogDescription className="text-xs">
              Enter the order number from the QR code or use camera to scan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-600">Camera scanner would appear here</p>
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
