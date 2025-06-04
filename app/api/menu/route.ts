import { type NextRequest, NextResponse } from "next/server"

// Mock menu database
let menuItems = [
  {
    id: "1",
    name: "Ugali with Beef Stew",
    description: "Traditional Tanzanian meal with tender beef",
    price: 3500,
    category: "Main Course",
    available: true,
  },
  {
    id: "2",
    name: "Rice with Chicken",
    description: "Steamed rice served with grilled chicken",
    price: 4000,
    category: "Main Course",
    available: true,
  },
  {
    id: "3",
    name: "Chapati with Beans",
    description: "Soft chapati with spiced beans",
    price: 2500,
    category: "Main Course",
    available: true,
  },
  {
    id: "4",
    name: "Fresh Juice",
    description: "Mixed tropical fruit juice",
    price: 1500,
    category: "Beverages",
    available: true,
  },
  {
    id: "5",
    name: "Tea/Coffee",
    description: "Hot tea or coffee",
    price: 1000,
    category: "Beverages",
    available: true,
  },
  {
    id: "6",
    name: "Mandazi",
    description: "Traditional fried dough snack",
    price: 500,
    category: "Snacks",
    available: false,
  },
]

export async function GET() {
  return NextResponse.json(menuItems)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, available } = body

  menuItems = menuItems.map((item) => (item.id === id ? { ...item, available } : item))

  const updatedItem = menuItems.find((item) => item.id === id)

  return NextResponse.json(updatedItem)
}
