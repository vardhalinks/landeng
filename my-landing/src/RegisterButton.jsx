import React, { useState, useEffect, useCallback, useRef } from "react";
import Loader from "./components/Loader";

// expose a global helper that dispatches a CustomEvent used for a full-page loader
window.globalLoading = (status) => {
  const event = new CustomEvent("globalLoading", { detail: status });
  window.dispatchEvent(event);
};

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

const RegisterButton = ({ amount = 99, className = "btn", label = "Book Now At ₹99/- Only" }) => {
  const [loading, setLoading] = useState(false);
  const paymentStartedRef = useRef(false);

  const openPayment = useCallback(async () => {
    try {
      if (paymentStartedRef.current) return;
      paymentStartedRef.current = true;

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
            window.globalLoading(false);
          }
        },
        modal: {
          onClose: function () {
            paymentStartedRef.current = false;
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
      window.globalLoading(false);
    }
  }, [amount]);

  useEffect(() => {
    const onMessage = (event) => {
      if (!event?.data?.event) return;
      if (event.data.event === "calendly.event_scheduled") {
        openPayment();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [openPayment]);

  const handleBooking = async () => {
    setLoading(true);
    window.globalLoading(true);
    try {
      await loadCalendlyScript();
      if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
        window.Calendly.initPopupWidget({ url: CALENDLY_URL });
        // Calendly close hone ke 2 seconds baad Razorpay open karo
        setTimeout(() => {
          openPayment();
        }, 2000);
      } else {
        window.open(CALENDLY_URL, "_blank");
        // External link case me bhi 3 seconds baad try karo
        setTimeout(() => {
          openPayment();
        }, 3000);
      }
      // Calendly popup open ho gaya, loading ko immediately clear kar do
      setTimeout(() => {
        setLoading(false);
        window.globalLoading(false);
      }, 300);
    } catch (err) {
      console.error(err);
      setLoading(false);
      window.globalLoading(false);
    }
  };

  const disabledAttr = loading ? { disabled: true } : {};

  const baseBtnClasses = `relative text-black font-extrabold rounded-3xl bg-gradient-to-r from-[#FFD700] to-[#FFB300] shadow-[0_0_15px_rgba(255,200,0,0.8)] hover:shadow-[0_0_30px_rgba(255,200,0,1)] transition-all duration-300 hover:scale-105 animate-pulseGlow overflow-hidden`;
  const mergedClass = `${className ? className + ' ' : ''}${baseBtnClasses} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`;

  return (
    <>
      <button
        onClick={handleBooking}
        className={mergedClass}
        {...disabledAttr}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 rotate-12 animate-shine" />

            <span className="flex items-center gap-2 relative z-10">
              {label ?? `Book Now @ ₹${amount}`}
              <span className="text-sm font-semibold px-2 py-0.5 bg-red-600 text-yellow-300 rounded-md animate-priceBlink">Limited</span>
              <span className="text-xl animate-arrowMove">👈</span>
            </span>
          </>
        )}
      </button>

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 12px rgba(255,200,0,0.35); }
          50% { box-shadow: 0 0 22px rgba(255,200,0,0.6); }
          100% { box-shadow: 0 0 12px rgba(255,200,0,0.35); }
        }
        .animate-pulseGlow { animation: pulseGlow 2.2s ease-in-out infinite; }

        @keyframes shine {
          0% { transform: translateX(-120%) rotate(12deg); opacity: 0; }
          50% { transform: translateX(120%) rotate(12deg); opacity: 0.7; }
          100% { transform: translateX(240%) rotate(12deg); opacity: 0; }
        }
        .animate-shine { animation: shine 1.8s linear infinite; }

        @keyframes priceBlink {
          0% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-priceBlink { animation: priceBlink 1.6s ease-in-out infinite; }

        @keyframes arrowMove {
          0% { transform: translateX(0); }
          50% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
        .animate-arrowMove { display: inline-block; animation: arrowMove 1s ease-in-out infinite; }
      `}</style>
    </>
  );
};

export default RegisterButton;