import { type NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/zenopay";

const DEFAULT_EMAIL = "mazikuben2@gmail.com";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields from the frontend
    if (!body.customerName || !body.phoneNumber || !body.amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // A placeholder callback URL is required by the ZenoPay SDK.
    // This can be changed to a real endpoint if you decide to use webhooks later.
    const VERCEL_URL = process.env.VERCEL_URL;
    const callbackURL = VERCEL_URL 
      ? `https://${VERCEL_URL}/api/payment/callback` 
      : 'http://localhost:3000/api/payment/callback';

    // Prepare the paymentOptions object for the ZenoPay SDK
    // The keys here must match the `PaymentOptionsType` interface
    const paymentOptions = {
      amountToCharge: body.amount, // Use actual order amount
      customerName: body.customerName.trim(),
      customerEmail: body.customerEmail || DEFAULT_EMAIL,
      customerPhoneNumber: body.phoneNumber, // Already formatted in the dialog
      callbackURL: callbackURL, // Add the required callbackURL
    };

    console.log("Creating payment:", paymentOptions);

    const result = await createPayment(paymentOptions);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "An error occurred while creating the payment"
      },
      { status: 500 }
    );
  }
} 