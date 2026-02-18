import React, { useState, useEffect, useCallback, useRef } from "react";
import Loader from "./Loader";

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

export default function BookingForm({ amount = 99 }) {
  const [loading, setLoading] = useState(false);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const [eventSelected, setEventSelected] = useState(false);
  const paymentStartedRef = useRef(false);

  useEffect(() => {
    // Calendly script load karo but widget init nahi karo
    // Popup open hoga handleBooking se
    loadCalendlyScript().then(() => {
      setCalendlyLoaded(true);
    });
  }, []);

  // Calendly event scheduled listener
  useEffect(() => {
    const onMessage = (event) => {
      if (!event?.data?.event) return;
      if (event.data.event === "calendly.event_scheduled") {
        console.log("✅ Event scheduled - enabling Pay Now button");
        setEventSelected(true);
        // Reset payment ref when new event scheduled
        paymentStartedRef.current = false;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const openPayment = useCallback(async () => {
    try {
      console.log("💳 Opening payment... paymentStarted:", paymentStartedRef.current);
      
      if (paymentStartedRef.current) {
        console.warn("⚠️ Payment already in progress");
        return;
      }
      paymentStartedRef.current = true;
      setLoading(true);

      await loadRazorpayScript();
      console.log("✅ Razorpay script loaded");

      const res = await fetch("https://landeng.onrender.com/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      console.log("📡 Order creation response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Order failed: ${res.status} - ${errorText}`);
      }
      const order = await res.json();
      console.log("✅ Order created:", order.id);

      const options = {
        key: "rzp_live_SGpnetdYlJs9OI",
        amount: order.amount,
        currency: "INR",
        name: "Arunn Guptaa",
        description: "1-on-1 Guidance Session",
        order_id: order.id,
        handler: async function () {
          try {
            console.log("✅ Payment successful!");
            alert("Payment Successful! Your session is confirmed.");
          } finally {
            paymentStartedRef.current = false;
            setLoading(false);
          }
        },
        modal: {
          onClose: function () {
            console.log("❌ Razorpay modal closed");
            paymentStartedRef.current = false;
            setLoading(false);
          }
        },
        theme: { color: "#F6C84C" },
      };

      console.log("🔓 Opening Razorpay...");
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("❌ Payment error:", err);
      paymentStartedRef.current = false;
      setLoading(false);
      alert("Payment failed: " + err.message + "\n\nCheck console for details.");
    }
  }, [amount]);

  const handleSelectTime = async () => {
    try {
      console.log("📅 Opening Calendly...");
      await loadCalendlyScript();
      if (window.Calendly) {
        window.Calendly.initPopupWidget({
          url: CALENDLY_URL,
        });
      }
    } catch (err) {
      console.error("❌ Calendly error:", err);
      alert("Failed to load Calendly: " + err.message);
    }
  };

  const handleReset = () => {
    console.log("🔄 Resetting component state...");
    paymentStartedRef.current = false;
    setEventSelected(false);
    setLoading(false);
    alert("State reset! You can try again.");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-2 text-yellow-700">
        Book Your Session
      </h2>
      <p className="text-center text-zinc-600 mb-8">
        Select your preferred time slot below, then proceed to payment.
      </p>

      {/* Select Time Button */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={handleSelectTime}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          📅 Select Your Time Slot
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-4 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-3xl shadow-lg transition-all duration-300 text-sm"
        >
          🔄 Reset
        </button>
      </div>

      {/* Pay Now Button */}
      <div className="flex justify-center">
        <button
          onClick={openPayment}
          disabled={!eventSelected || loading}
          className={`
            px-10 py-4 text-lg font-bold rounded-3xl transition-all duration-300
            ${eventSelected && !loading
              ? "bg-gradient-to-r from-[#FFD700] to-[#FFB300] text-black shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
            }
          `}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader />
              Processing...
            </div>
          ) : eventSelected ? (
            `Pay Now @ ₹${amount}`
          ) : (
            "Select a time slot first"
          )}
        </button>
      </div>

      <p className="text-center text-zinc-500 text-sm mt-6">
        💡 Click "Select Your Time Slot" to schedule your session, then click "Pay Now" to complete your booking.
      </p>
    </div>
  );
}
