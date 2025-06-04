import { type NextRequest, NextResponse } from "next/server"

// Mock database
let orders = [
  {
    id: "1",
    orderNumber: "ORD123456",
    customerName: "John Mwalimu",
    items: [
      { name: "Ugali with Beef Stew", quantity: 1, price: 3500 },
      { name: "Fresh Juice", quantity: 1, price: 1500 },
    ],
    total: 5000,
    status: "preparing",
    timestamp: "2024-01-15 14:30",
    phoneNumber: "+255 123 456 789",
  },
]

export async function GET() {
  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newOrder = {
    id: Date.now().toString(),
    orderNumber: `ORD${Date.now().toString().slice(-6)}`,
    ...body,
    timestamp: new Date().toISOString(),
    status: "pending",
  }

  orders.push(newOrder)

  return NextResponse.json(newOrder, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, status } = body

  orders = orders.map((order) => (order.id === id ? { ...order, status } : order))

  const updatedOrder = orders.find((order) => order.id === id)

  return NextResponse.json(updatedOrder)
}
