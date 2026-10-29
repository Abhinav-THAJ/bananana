"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";

function toTitleCase(str: string): string {
  if (!str) return "";
  const isAllUpper = str === str.toUpperCase();
  if (!isAllUpper) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word, idx) => {
      if (idx > 0 && ["with", "and", "or", "in", "of", "to", "for", "a", "an", "the"].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-fetch City and State based on PIN Code (India only)
    if (name === "pincode" && value.length === 6 && /^\d+$/.test(value)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
          const po = data[0].PostOffice[0];
          setFormData((prev) => ({
            ...prev,
            city: po.District || po.Block,
            state: po.State,
          }));
          toast.success(`Location auto-filled: ${po.District}, ${po.State}`);
        } else {
          toast.error("Invalid PIN Code");
        }
      } catch (err) {
        console.error("PIN Code fetch failed", err);
      }
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Your cart is empty");

    const shippingFee = 50;
    const finalTotal = cartTotal + shippingFee;

    setLoading(true);

    try {
      // 1. Load Script
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Failed to load Razorpay SDK. Please check your connection.");
        setLoading(false);
        return;
      }

      // 2. Create Order on our Next.js backend
      const orderResponse = await fetch("/api/razorpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalTotal }),
      });

      const orderData = await orderResponse.json();
      if (!orderData || orderData.error) {
        throw new Error(orderData.error || "Order creation failed");
      }

      // 3. Initialize Razorpay Modal
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TtKNDpc5rejEGy",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Bananana",
        description: "Premium Kerala Heritage Menswear",
        order_id: orderData.id,
        handler: async function (response: any) {
          setLoading(true);
          const syncToastId = toast.loading("Payment successful! Syncing order...");
          
          try {
            // 4. Send successful payment to WooCommerce
            const syncResponse = await fetch("/api/woocommerce/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...formData,
                items: cart,
                shippingFee,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const syncData = await syncResponse.json();
            if (syncData.success) {
              clearCart();
              toast.success("Order confirmed successfully!", { id: syncToastId });
              router.push("/");
            } else {
              toast.error(syncData.error || "Payment received, but order sync failed. Contact support.", { id: syncToastId });
            }
          } catch (syncErr: any) {
            console.error(syncErr);
            toast.error("Payment received, but order sync failed. Contact support.", { id: syncToastId });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#b0891d", // brand-gold
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        toast.error(response?.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });
      paymentObject.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center min-h-[50vh]">
        <h1 className="font-serif text-3xl mb-4">Nothing to checkout</h1>
        <Link href="/category/all" className="text-brand-gold underline">Go back to shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 w-full min-h-[70vh]">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal mb-6">Checkout</h1>
      
      <div className="grid lg:grid-cols-2 gap-12">
        
        {/* Shipping Form */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-6">Shipping Details</h2>
          <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">First Name</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">Last Name</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">Phone (for shipping)</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-brand-charcoal/70">Full Address</label>
              <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">PIN Code</label>
                <input required type="text" maxLength={6} name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2 focus:ring-2 focus:ring-brand-gold focus:outline-none" placeholder="6-digit PIN" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">City / District</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2 bg-brand-offwhite" readOnly={!!formData.city} placeholder="Auto-filled by PIN" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-brand-charcoal/70">State</label>
                <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-brand-charcoal/20 rounded-sm px-4 py-2 bg-brand-offwhite" readOnly={!!formData.state} placeholder="Auto-filled by PIN" />
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary & Pay */}
        <div>
          <div className="bg-brand-offwhite p-8 rounded-sm border border-brand-charcoal/5 sticky top-24">
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-6">Your Order</h2>
            
            <div className="space-y-4 mb-6">
              {cart.map((item, index) => (
                <div key={item.cartItemId || `${item.id}-${item.size || index}`} className="flex gap-4 items-center border-b border-brand-charcoal/10 pb-4">
                  <div className="relative w-16 h-20 bg-white rounded-sm overflow-hidden flex-shrink-0">
                     <Image src={item.imageSrc} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-grow">
                    <p
                      className="font-bold text-brand-charcoal"
                      style={{
                        fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 700,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {toTitleCase(item.name)}
                    </p>
                    {item.size && <p className="text-xs text-brand-charcoal/70">Size: {item.size}</p>}
                    <p className="text-sm text-brand-charcoal/70">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">₹{parseFloat(item.price) * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-brand-charcoal/70">Subtotal</span>
              <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm border-b border-brand-charcoal/10 pb-4 mb-4">
              <span className="text-brand-charcoal/70">Shipping</span>
              <span className="font-bold">₹50.00</span>
            </div>

            <div className="flex justify-between items-center text-xl mb-8">
              <span className="font-bold">Total to Pay</span>
              <span className="font-serif text-3xl font-bold text-brand-charcoal">₹{(cartTotal + 50).toFixed(2)}</span>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full bg-brand-gold text-brand-darkgreen py-4 rounded-sm font-bold tracking-wider uppercase text-sm hover:bg-[#d4982e] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Processing..." : "Pay Securely with Razorpay"}
            </button>
            <p className="text-center text-xs text-brand-charcoal/50 mt-4">
              By proceeding, you agree to our Terms of Service. Secure payments powered by Razorpay.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
