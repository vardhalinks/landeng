import React, { useEffect, useMemo, useCallback, useRef } from "react";

const BASE_CALENDLY_URL = "https://calendly.com/linksvardha/60min";
const SESSION_AMOUNT = 99;
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

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

export default function SessionBooking() {
  const paymentStartedRef = useRef(false);
  const calendlyContainerRef = useRef(null);

  useEffect(() => {
    // Ensure Calendly script is loaded once for SPA routing.
    const existing = document.querySelector(`script[src="${CALENDLY_SCRIPT_SRC}"]`);
    if (existing) return;

    const s = document.createElement("script");
    s.src = CALENDLY_SCRIPT_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const calendlyUrl = useMemo(() => {
    if (typeof window === "undefined") return BASE_CALENDLY_URL;
    const redirectUrl = `${window.location.origin}/session-booking?booked=1`;
    const params = new URLSearchParams({ redirect_uri: redirectUrl });
    return `${BASE_CALENDLY_URL}?${params.toString()}`;
  }, []);

  const openPayment = useCallback(async () => {
    try {
      if (window.globalLoading) window.globalLoading(true);
      await loadRazorpayScript();

      const res = await fetch("https://landeng.onrender.com/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: SESSION_AMOUNT }),
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
            if (window.globalLoading) window.globalLoading(false);
          }
        },
        theme: { color: "#F6C84C" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      if (window.globalLoading) window.globalLoading(false);
    }
  }, []);

  const initCalendlyInline = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.Calendly || !calendlyContainerRef.current) return;

    // Clear any previous embeds before re-initializing.
    calendlyContainerRef.current.innerHTML = "";

    window.Calendly.initInlineWidget({
      url: calendlyUrl,
      parentElement: calendlyContainerRef.current,
    });
  }, [calendlyUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Calendly) {
      initCalendlyInline();
      return;
    }

    const script = document.querySelector(`script[src="${CALENDLY_SCRIPT_SRC}"]`);
    if (!script) return;

    const onLoad = () => initCalendlyInline();
    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, [initCalendlyInline]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("booked") !== "1") return;
    if (paymentStartedRef.current) return;
    paymentStartedRef.current = true;
    openPayment();
  }, [openPayment]);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-yellow-700">Book Your Session</h1>

        <div
          ref={calendlyContainerRef}
          className="calendly-inline-widget"
          style={{ minWidth: "100%", height: "700px" }}
        ></div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={openPayment}
            className="bg-[#F6C84C] text-black font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition"
          >
            Pay ₹99 to Confirm Session
          </button>
          <p className="text-zinc-600 text-sm">* Fees refundable if you aren't satisfied</p>
        </div>

        <p className="text-center mt-6 text-zinc-600 text-sm">
          If the scheduler above doesn't appear, open the Calendly link directly: {" "}
          <a className="text-yellow-700 underline" href={BASE_CALENDLY_URL} target="_blank" rel="noreferrer">
            Calendly — 60min
          </a>
        </p>
      </div>
    </div>
  );
}
