import { type NextRequest, NextResponse } from "next/server";
import { checkPaymentStatus } from "@/lib/zenopay";

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");
    
    if (!orderId) {
      return NextResponse.json(
        { 
          success: false,
          message: {
            status: "error",
            message: "Missing orderId parameter"
          }
        },
        { status: 400 }
      );
    }

    console.log("Checking payment status for order:", orderId);
    const result = await checkPaymentStatus(orderId);
    console.log("Status check result:", result);
    
    // Return the response without modification
    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: {
          status: "error",
          message: error instanceof Error ? error.message : "Failed to check payment status"
        }
      },
      { status: 500 }
    );
  }
} 