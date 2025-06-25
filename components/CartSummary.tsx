import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Trash2 } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartSummaryProps {
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  total: number
  showActions?: boolean
  compact?: boolean
}

export function CartSummary({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  total, 
  showActions = true,
  compact = false 
}: CartSummaryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">Order Summary</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1">
              {!compact && item.image && (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-600">
                  TSh {item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showActions && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <span className="text-sm font-medium">
                TSh {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-2">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Total:</span>
          <span className="text-lg font-semibold text-green-600">
            TSh {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
} 