"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

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

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center min-h-[50vh]">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal mb-4">Your Cart is Empty</h1>
        <p className="text-brand-charcoal/70 mb-6 text-sm sm:text-base">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/category/all" className="inline-block bg-brand-gold text-brand-darkgreen px-8 py-3 rounded-sm font-bold tracking-wider uppercase text-sm hover:bg-[#d4982e] transition-colors shadow-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 pb-8 sm:pt-4 sm:pb-10 w-full min-h-[60vh]">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal mb-6">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item, index) => (
            <div key={item.cartItemId || `${item.id}-${item.size || index}`} className="flex gap-6 p-4 border border-brand-charcoal/10 rounded-sm bg-white">
              <Link href={`/product/${item.slug}`} className="relative w-24 h-32 flex-shrink-0 bg-brand-offwhite">
                <Image src={item.imageSrc} alt={item.name} fill className="object-cover" />
              </Link>
              
              <div className="flex-grow flex flex-col justify-between py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-bold text-base sm:text-lg text-brand-charcoal hover:text-[#D99B26] transition-colors block mb-1"
                      style={{
                        fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 700,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {toTitleCase(item.name)}
                    </Link>
                    {item.size && <p className="text-sm text-brand-charcoal/70 mb-1">Size: {item.size}</p>}
                    <p className="font-sans font-bold text-brand-charcoal">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-sm text-red-500 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-brand-charcoal/70">Quantity:</span>
                  <div className="flex items-center border border-brand-charcoal/20 rounded-sm">
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="px-3 py-1 text-brand-charcoal hover:bg-brand-offwhite"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="px-3 py-1 text-brand-charcoal hover:bg-brand-offwhite"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-brand-offwhite p-6 rounded-sm border border-brand-charcoal/5 sticky top-24">
            <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-brand-charcoal">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-brand-charcoal/70">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-brand-charcoal/10 pt-4 mb-8">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total</span>
                <span className="font-serif text-2xl font-bold text-brand-charcoal">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/checkout')}
              className="w-full bg-brand-forest text-brand-cream py-4 rounded-sm font-bold tracking-wider uppercase text-sm hover:bg-brand-darkgreen transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
