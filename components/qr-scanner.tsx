"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera } from "lucide-react"

interface QRScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [manualCode, setManualCode] = useState("")

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode("")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Scan QR Code
        </CardTitle>
        <CardDescription>Scan customer's QR code or enter order number manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera Scanner Area */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">Position QR code within the frame</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="w-32 h-32 mx-auto border-2 border-blue-500 rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-3">
          <Label htmlFor="manual-code">Or enter order number:</Label>
          <div className="flex gap-2">
            <Input
              id="manual-code"
              placeholder="e.g., ORD123456"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
              Scan
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
