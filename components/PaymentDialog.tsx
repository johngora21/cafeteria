import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess?: (orderId: string) => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  amount,
  onSuccess,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Clear polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
  const checkStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payment/status?orderId=${orderId}`);
      const data = await response.json();
      
      if (!data.success) {
        setPaymentStatus("ERROR");
        setStatusMessage(data.message?.message || "Failed to check payment status");
        setIsProcessing(false);
        stopPolling();
        return;
      }

      const status = data.message?.payment_status || data.message?.status;
      setStatusMessage(data.message?.message || "Processing payment...");
      console.log(`Payment status check #${statusCheckCount+1}:`, status, data.message);

      // Check for COMPLETED status (this is what ZenoPay returns for successful payments)
      if (status === "COMPLETED" || status === "SUCCESS" || (data.message?.status === "success" && data.message?.message === "Wallet payment successful")) {
        setPaymentStatus("SUCCESS");
        stopPolling();
        setIsProcessing(false);
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });
        
        // Call onSuccess callback with the order ID and customer data
        if (onSuccess && orderId) {
          onSuccess(orderId, { name: customerName, phone: phoneNumber });
        } else {
          // If no callback, just close the dialog and redirect
          setTimeout(() => {
            onClose();
            window.location.href = "/orders"; // Redirect to orders page
          }, 2000);
        }
        return; // Exit early to prevent further polling
      } else if (status === "FAILED" || data.message?.status === "failed") {
        setPaymentStatus("FAILED");
        setStatusMessage(data.message?.message || "Payment failed");
        setIsProcessing(false);
        stopPolling();
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Please try again or contact support if the issue persists.",
        });
      } else if (statusCheckCount >= 40) { // 2 minutes (40 * 3 seconds)
        // Stop polling after 2 minutes
        setPaymentStatus("TIMEOUT");
        setStatusMessage("Payment verification timed out. If you completed the payment, please check your orders later.");
        setIsProcessing(false);
        stopPolling();
      } else {
        // Still pending, continue polling
        setPaymentStatus("PENDING");
        setStatusCheckCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentStatus("ERROR");
      setStatusMessage("Failed to check payment status");
      setIsProcessing(false);
      stopPolling();
    }
  };

  // Start polling for payment status
  const startPolling = (orderId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Check immediately first
    checkStatus(orderId);
    
    // Then set up interval for subsequent checks
    pollingIntervalRef.current = setInterval(() => {
      checkStatus(orderId);
    }, 3000); // Check every 3 seconds
  };
  
  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Effect to start/stop polling when dialog opens/closes
  useEffect(() => {
    if (!isOpen && pollingIntervalRef.current) {
      stopPolling();
    }
    
    // Reset state when dialog opens
    if (isOpen) {
      setIsProcessing(false);
      setPaymentStatus(null);
      setOrderId(null);
      setStatusMessage("");
      setStatusCheckCount(0);
      // Don't reset form fields to preserve user input
    }
  }, [isOpen]);

  const handlePayment = async () => {
    // Validate form fields
    if (!customerName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your name.",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your phone number.",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (e.g., 0712345678 or +255712345678).",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("PROCESSING");
    setStatusMessage("Initiating payment...");

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          customerName: customerName.trim(),
          customerEmail: "mazikuben2@gmail.com", // Default email
          phoneNumber: formatPhoneNumber(phoneNumber),
        }),
      });

      const data = await response.json();

      if (data.success && data.message?.order_id) {
        const newOrderId = data.message.order_id;
        setOrderId(newOrderId);
        setPaymentStatus("PENDING");
        setStatusMessage(data.message?.message || "Payment initiated. Please check your phone for the payment prompt.");
        setStatusCheckCount(0);
        
        // Start polling for status
        startPolling(newOrderId);
      } else {
        setPaymentStatus("FAILED");
        setStatusMessage(data.message?.message || "Failed to initiate payment");
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: data.message?.message || "Failed to initiate payment",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("ERROR");
      setStatusMessage("An error occurred while processing payment");
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        stopPolling();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="text-lg font-semibold text-center mb-4">
            Amount: TSh {amount.toLocaleString()}
          </div>

          {!paymentStatus && (
            <div className="grid w-full items-center gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0712345678 or +255712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {paymentStatus && (
            <div className="grid w-full items-center gap-2">
              <Input
                type="text"
                value={customerName}
                disabled
                className="bg-gray-100"
              />
              <Input
                type="tel"
                value={phoneNumber}
                disabled
                className="bg-gray-100"
              />
            </div>
          )}

          {!isProcessing && !paymentStatus && (
            <Button onClick={handlePayment} className="w-full">
              Pay Now
            </Button>
          )}

          {(isProcessing || paymentStatus) && (
            <div className="flex flex-col items-center space-y-4 py-4">
              {paymentStatus === "PENDING" && (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              )}
              {paymentStatus === "SUCCESS" && (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
              {paymentStatus === "FAILED" && (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              {paymentStatus === "TIMEOUT" && (
                <XCircle className="h-8 w-8 text-yellow-500" />
              )}
              <div className="text-center">
                <p className="font-medium">{statusMessage}</p>
                {paymentStatus === "PENDING" && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please check your phone for the payment prompt
                  </p>
                )}
                {statusCheckCount > 0 && paymentStatus === "PENDING" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Checking status... ({statusCheckCount}/40)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 