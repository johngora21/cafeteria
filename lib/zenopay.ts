import ZenoPay from "zenopay";

// Environment variables check
if (!process.env.ZENOPAY_ACCOUNT_ID) {
  throw new Error("ZENOPAY_ACCOUNT_ID is not set in environment variables");
}
if (!process.env.ZENOPAY_API_KEY) {
  throw new Error("ZENOPAY_API_KEY is not set in environment variables");
}
if (!process.env.ZENOPAY_SECRET_KEY) {
  throw new Error("ZENOPAY_SECRET_KEY is not set in environment variables");
}

// Initialize ZenoPay with credentials from environment variables
const zenoPayOptions = {
  accountID: process.env.ZENOPAY_ACCOUNT_ID,
  apiKey: process.env.ZENOPAY_API_KEY,
  secretKey: process.env.ZENOPAY_SECRET_KEY,
};
const zenoPay = new ZenoPay(zenoPayOptions);

// Define the type for payment options based on the documentation
interface PaymentOptionsType {
  amountToCharge: number;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  callbackURL: string;
}

/**
 * Creates a payment request to ZenoPay using the official Node.js package.
 */
export async function createPayment(paymentOptions: PaymentOptionsType) {
  try {
    console.log("Creating payment with ZenoPay SDK:", paymentOptions);
    const result = await zenoPay.Pay(paymentOptions);
    console.log("ZenoPay SDK response:", result);
    return result;
  } catch (error: any) {
    console.error("ZenoPay SDK payment error:", error);
    return {
      success: false,
      message: error.message || "An error occurred during payment creation.",
    };
  }
}

/**
 * Checks the status of a payment using the official Node.js package.
 */
export async function checkPaymentStatus(orderID: string) {
  try {
    console.log("Checking payment status with ZenoPay SDK for order:", orderID);
    const result = await zenoPay.CheckPaymentStatus(orderID);
    console.log("ZenoPay SDK status response:", result);
    return result;
  } catch (error: any) {
    console.error("ZenoPay SDK status check error:", error);
    return {
      success: false,
      message: error.message || "An error occurred during status check.",
    };
  }
} 