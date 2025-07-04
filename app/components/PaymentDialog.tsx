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
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 20; // Maximum number of polling attempts
  const POLL_INTERVAL = 3000; // Poll every 3 seconds
  
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

  // Effect to reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsChecking(false);
      setPaymentStatus(null);
      setOrderId(null);
      setStatusMessage("");
      setIsPolling(false);
      setPollCount(0);
      // Clear form fields for a fresh start
      setCustomerName("");
      setPhoneNumber("");
    }
  }, [isOpen]);

  // Effect for automatic polling
  useEffect(() => {
    let pollTimer: NodeJS.Timeout;

    const startPolling = async () => {
      if (!orderId || !isPolling || pollCount >= MAX_POLLS) {
        return;
      }

      try {
        const response = await fetch(`/api/payment/status?orderId=${orderId}`);
        const data = await response.json();
        
        if (!data.success) {
          console.log(`Poll #${pollCount + 1} failed:`, data);
          return;
        }

        const sdkMessage = data.message || {};
        console.log(`Poll #${pollCount + 1} status:`, sdkMessage.payment_status);

        // Handle COMPLETED status
        if (sdkMessage.payment_status === "COMPLETED") {
          setPaymentStatus("SUCCESS");
          setStatusMessage("Payment completed successfully!");
          setIsPolling(false);
          
          const trimmedName = customerName.trim();
          const formattedPhone = formatPhoneNumber(phoneNumber);
          
          if (trimmedName && formattedPhone && onSuccess) {
            onSuccess(orderId, { 
              name: trimmedName,
              phone: formattedPhone
            });
          }
          return;
        }

        // Handle FAILED status
        if (sdkMessage.payment_status === "FAILED") {
          setPaymentStatus("FAILED");
          setStatusMessage("Payment failed. Please try again.");
          setIsPolling(false);
          return;
        }

        // Continue polling if still pending
        setPollCount(prev => prev + 1);
        
        // If reached max polls, stop polling but keep status as pending
        if (pollCount + 1 >= MAX_POLLS) {
          setIsPolling(false);
          setStatusMessage("Payment status check timed out. Please verify manually.");
        }

      } catch (error) {
        console.error("Polling error:", error);
        // Don't stop polling on network errors, just skip this attempt
      }
    };

    if (isPolling && orderId) {
      pollTimer = setTimeout(startPolling, POLL_INTERVAL);
    }

    return () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [isPolling, orderId, pollCount, customerName, phoneNumber, onSuccess]);

  // Function to check payment status manually
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
        
        // Ensure we have valid customer data before calling success
        const trimmedName = customerName.trim();
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        if (!trimmedName || !formattedPhone) {
          console.error("Missing customer data:", { customerName, phoneNumber });
          toast({
            variant: "destructive",
            title: "Error",
            description: "Missing customer information. Please try again.",
          });
          return;
        }
        
        if (onSuccess) {
          onSuccess(orderId, { 
            name: trimmedName,
            phone: formattedPhone
          });
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
        // Start automatic polling
        setIsPolling(true);
        setPollCount(0);
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
                    <div className="space-y-2">
                      {isPolling ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Auto-checking payment ({pollCount}/{MAX_POLLS})</span>
                        </div>
                      ) : null}
                      
                      <Button 
                        onClick={checkStatus} 
                        disabled={isChecking || isPolling} 
                        className="w-full" 
                        variant="outline"
                      >
                        {isChecking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {isChecking ? "Checking..." : "Verify Payment Manually"}
                      </Button>
                      
                      {!isPolling && pollCount >= MAX_POLLS ? (
                        <p className="text-xs text-center text-amber-600">
                          Auto-check timed out. Please verify manually.
                        </p>
                      ) : null}
                    </div>
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