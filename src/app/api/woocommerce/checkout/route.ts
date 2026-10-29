import { NextResponse } from "next/server";
import crypto from "crypto";
import { createOrder } from "@/lib/woocommerce/api";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Verify Razorpay payment signature for security
    if (data.razorpay_order_id && data.razorpay_payment_id && data.razorpay_signature) {
      const secret = process.env.RAZORPAY_SECRET;
      if (secret) {
        const generatedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
          .digest("hex");

        if (generatedSignature !== data.razorpay_signature) {
          console.error("Invalid Razorpay payment signature verification failed");
          return NextResponse.json(
            { error: "Payment verification failed: invalid signature" },
            { status: 400 }
          );
        }
      }
    }

    // 1. Structure the data for WooCommerce REST API
    const wooCommerceOrder = {
      payment_method: "razorpay",
      payment_method_title: "Razorpay",
      set_paid: true, // We are marking it as paid because Razorpay success happened
      transaction_id: data.razorpay_payment_id,
      billing: {
        first_name: data.firstName,
        last_name: data.lastName,
        address_1: data.address,
        city: data.city,
        state: data.state,
        postcode: data.pincode,
        country: "IN",
        email: data.email,
        phone: data.phone,
      },
      shipping: {
        first_name: data.firstName,
        last_name: data.lastName,
        address_1: data.address,
        city: data.city,
        state: data.state,
        postcode: data.pincode,
        country: "IN",
      },
      line_items: data.items.map((item: any) => ({
        product_id: item.id,
        quantity: item.quantity,
        ...(item.size ? {
          meta_data: [
            {
              key: "Size",
              value: item.size
            }
          ]
        } : {})
      })),
      shipping_lines: [
        {
          method_id: "flat_rate",
          method_title: "Standard Shipping",
          total: data.shippingFee ? data.shippingFee.toString() : "50.00"
        }
      ],
      meta_data: [
        {
          key: "_razorpay_order_id",
          value: data.razorpay_order_id || "",
        },
        {
          key: "_razorpay_payment_id",
          value: data.razorpay_payment_id || "",
        },
        {
          key: "_razorpay_signature",
          value: data.razorpay_signature || "",
        },
      ],
      status: "processing", // Processing means paid and ready for Shiprocket fulfillment
    };

    // 2. Push to WooCommerce
    const response = await createOrder(wooCommerceOrder);
    
    return NextResponse.json({ success: true, orderId: response.id });
  } catch (error: any) {
    console.error("Failed to create WooCommerce order:", error);
    return NextResponse.json(
      { error: error?.message || "Order Sync Failed" },
      { status: 500 }
    );
  }
}
