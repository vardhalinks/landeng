import React, { useState, useEffect, useCallback, useRef } from "react";
import Loader from "./components/Loader";

const CALENDLY_URL = "https://calendly.com/linksvardha/60min";
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

function loadCalendlyScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${CALENDLY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = CALENDLY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Calendly script failed to load"));
    document.head.appendChild(script);
  });
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.head.appendChild(script);
  });
}

export default function ConfirmSlotPage({ amount = 99 }) {
  const [loading, setLoading] = useState(false);
  const [eventSelected, setEventSelected] = useState(false);
  const paymentStartedRef = useRef(false);

  useEffect(() => {
    loadCalendlyScript().then(() => {
      if (window.Calendly) {
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: document.getElementById("calendly-inline"),
        });
      }
    });
  }, []);

  // Calendly event scheduled listener
  useEffect(() => {
    const onMessage = (event) => {
      if (!event?.data?.event) return;
      if (event.data.event === "calendly.event_scheduled") {
        console.log("✅ Event scheduled!");
        setEventSelected(true);
        paymentStartedRef.current = false;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const openPayment = useCallback(async () => {
    try {
      if (paymentStartedRef.current) return;
      paymentStartedRef.current = true;
      setLoading(true);

      await loadRazorpayScript();
      const res = await fetch("https://landeng.onrender.com/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const order = await res.json();

      const options = {
        key: "rzp_live_SGpnetdYlJs9OI",
        amount: order.amount,
        currency: "INR",
        name: "Arunn Guptaa",
        description: "1-on-1 Guidance Session",
        order_id: order.id,
        handler: async function () {
          try {
            alert("Payment Successful! Your session is confirmed.");
          } finally {
            paymentStartedRef.current = false;
            setLoading(false);
          }
        },
        modal: {
          onClose: function () {
            paymentStartedRef.current = false;
            setLoading(false);
          }
        },
        theme: { color: "#F6C84C" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      paymentStartedRef.current = false;
      setLoading(false);
      alert("Payment failed: " + err.message);
    }
  }, [amount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-yellow-700 mb-2">
          Confirm Your Slot
        </h1>
        <p className="text-center text-zinc-600 mb-12">
          Select your preferred time to begin your 1-on-1 guidance session
        </p>

        {/* Calendly Inline Widget */}
        <div 
          id="calendly-inline" 
          className="mb-12 rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-300"
        >
          <div className="flex items-center justify-center h-96 bg-yellow-50">
            <Loader />
          </div>
        </div>

        {/* Pay Now Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={openPayment}
            disabled={!eventSelected || loading}
            className={`
              px-12 py-5 text-xl font-extrabold rounded-3xl transition-all duration-300 shadow-lg
              ${eventSelected && !loading
                ? "bg-gradient-to-r from-[#FFD700] to-[#FFB300] text-black hover:shadow-2xl hover:scale-105 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader />
                <span>Processing Payment...</span>
              </div>
            ) : eventSelected ? (
              `💳 Pay Now @ ₹${amount}`
            ) : (
              "⏳ Select a time slot above"
            )}
          </button>
        </div>

        <p className="text-center text-zinc-500 text-sm">
          After you schedule your session, click the button above to proceed with payment.
        </p>
      </div>
    </div>
  );
}
