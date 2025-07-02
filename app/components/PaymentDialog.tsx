import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess?: (orderId: string, customerData?: { name: string; phone: string }) => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  amount,
  onSuccess,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Function to validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any spaces or special characters except + and numbers
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Valid formats: 0XXXXXXXXX or +255XXXXXXXXX
    return /^(0\d{9}|(\+255)\d{9})$/.test(cleaned);
  };

  // Function to format phone number
  const formatPhoneNumber = (phone: string): string => {
    // Remove any spaces or special characters except + and numbers
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If starts with +255, convert to 0 format
    if (cleaned.startsWith('+255')) {
      cleaned = '0' + cleaned.slice(4);
    }
    
    return cleaned;
  };

  // Function to check payment status
  const checkStatus = async () => {
    if (!orderId) return;
    
    setIsChecking(true);
    setStatusMessage("Checking payment status...");
    try {
      const response = await fetch(`/api/payment/status?orderId=${orderId}`);
      const data = await response.json();
      
      if (!data.success) {
        setStatusMessage("Failed to check status. Please try again.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not check payment status.",
        });
        return;
      }

      const sdkMessage = data.message || {};
      console.log("Payment status response:", sdkMessage);

      // Handle COMPLETED status
      if (sdkMessage.payment_status === "COMPLETED") {
        setPaymentStatus("SUCCESS");
        setStatusMessage("Payment completed successfully!");
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed.",
        });
        if (onSuccess) {
          onSuccess(orderId, { name: customerName, phone: phoneNumber });
        }
        return; // Exit early on success
      }

      // Handle FAILED status
      if (sdkMessage.payment_status === "FAILED") {
        setPaymentStatus("FAILED");
        setStatusMessage("Payment failed. Please try again.");
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: sdkMessage.message || "Please try again.",
        });
        return; // Exit early on failure
      }

      // If still PENDING, update the message
      setPaymentStatus("PENDING");
      setStatusMessage("Please complete the payment on your phone.");

    } catch (error) {
      console.error("Error checking payment status:", error);
      setStatusMessage("Failed to check status. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to check payment status.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Effect to reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsChecking(false);
      setPaymentStatus(null);
      setOrderId(null);
      setStatusMessage("");
      // Clear form fields for a fresh start
      setCustomerName("");
      setPhoneNumber("");
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!customerName.trim()) {
      toast({ variant: "destructive", title: "Name is required." });
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      toast({ variant: "destructive", title: "Invalid Phone Number", description: "Use 0... or +255... format." });
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Sending payment request...");

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          customerName: customerName.trim(),
          phoneNumber: formattedPhone, // Send formatted number
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderId(data.message.order_id);
        setPaymentStatus("PENDING");
        setStatusMessage("Request sent! Check your phone for a USSD prompt to complete the payment.");
      } else {
        setPaymentStatus(null); // Go back to the form
        setStatusMessage("");
        toast({ variant: "destructive", title: "Failed to Initiate", description: data.message || "An unknown error occurred." });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentStatus(null);
      toast({ variant: "destructive", title: "Network Error", description: "Could not send payment request." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
                      <div className="text-center">
            <div className="text-lg font-semibold">
              Amount to Pay: TSh {amount.toLocaleString()}
            </div>
          </div>

          {!paymentStatus ? (
            // Initial Form View
            <div className="grid w-full items-center gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input 
                  id="customerName" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Enter your full name" 
                  disabled={isProcessing} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="0712345678" 
                  disabled={isProcessing} 
                />
                <p className="text-xs text-muted-foreground">
                  Format: 0712345678 or +255712345678
                </p>
              </div>
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing} 
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          ) : (
            // Status View
            <div className="flex flex-col items-center space-y-4 py-4">
              {paymentStatus === "SUCCESS" && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <p className="font-medium text-green-600">{statusMessage}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting to orders page...
                    </p>
                  </div>
                </>
              )}
              {paymentStatus === "FAILED" && (
                <>
                  <XCircle className="h-12 w-12 text-red-500" />
                  <div className="text-center">
                    <p className="font-medium text-red-600">{statusMessage}</p>
                  </div>
                </>
              )}
              {paymentStatus === "PENDING" && (
                <>
                  <div className="text-center space-y-4">
                    <p className="font-medium">{statusMessage}</p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">
                        1. Check your phone for USSD prompt<br/>
                        2. Complete the payment<br/>
                        3. Click below to verify
                      </p>
                    </div>
                    <Button 
                      onClick={checkStatus} 
                      disabled={isChecking} 
                      className="w-full" 
                      variant="outline"
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {isChecking ? "Checking..." : "Verify Payment"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 