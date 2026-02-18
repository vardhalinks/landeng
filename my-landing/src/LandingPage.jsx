// Refactor: structured into reusable components, unified buttons, custom hooks, and clearer layout

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Target, Layers, TrendingUp, Users, Lightbulb, CheckCircle } from "lucide-react";
import RegisterButton from "./RegisterButton";
import Loader from "./components/Loader";
import AppLoader from "./components/AppLoader";
import SoldOutBar from "./components/SoldOutBar";
import FeaturedCarousel from "./components/FeaturedCarousel";
import StickySoldTimer from "./components/StickySoldTimer";
import LiveBanner from "./components/LiveBanner";
import HeroSection from "./components/HeroSection";
import useSoldOutProgress from "./hooks/useSoldOutProgress";
import GuaranteePopup from "./components/GuaranteePopup";

// Shared random names list used for 'just joined' popups across the site
const names = [
  "Amit", "Neha", "Rahul", "Priya", "Karan",
  "Ritika", "Saurabh", "Divya", "Manish", "Sneha",
  "Harsh", "Anjali", "Siddharth", "Varun", "Moksha","Amit Sharma", "Rohit Mehta", "Priya Nair", "Karan Ahuja","Sneha Kapoor", "Vikas Jain", "Deepak Rao", "Megha Singh",
  "Arjun Patel", "Nisha Verma", "Rahul Gupta", "Tina Joseph", "Amit Sharma", "Rohit Mehta", "Priya Nair", "Karan Ahuja",
  "Sneha Kapoor", "Vikas Jain", "Deepak Rao", "Megha Singh",
  "Arjun Patel", "Nisha Verma", "Rahul Gupta", "Tina Joseph"
];

/*********************************
 * Shared UI
 *********************************/
function PrimaryButton({ label = "Book Now At ₹99/- Only", className = "", ...props }) {
  const classes =
    "px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold " +
    "text-sm md:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 animate-buttonGlow " +
    className;

  // If an explicit onClick is provided, render a normal button that uses that handler.
  if (props.onClick) {
    return (
      <button className={classes} {...props}>
        {label}
      </button>
    );
  }

  // Otherwise, render the RegisterButton so the default CTA initiates the payment flow.
  return <RegisterButton amount={props.amount ?? 99} className={classes} label={label} />;
}

/*********************************
 * Utilities & Hooks
 *********************************/
const safeStorage = {
  get(key) {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
};

function useOfferTimer() {
  const DURATION = 15 * 60 * 1000; // 15 minutes in ms
  const [timeLeft, setTimeLeft] = useState(DURATION);

  useEffect(() => {
    // initialize stored end time if missing
    const now = Date.now();
    const stored = safeStorage.get("offerTimerEnd");
    if (!stored) safeStorage.set("offerTimerEnd", String(now + DURATION));

    const id = setInterval(() => {
      try {
        const storedNow = safeStorage.get("offerTimerEnd");
        const endTime = storedNow ? parseInt(storedNow, 10) : Date.now() + DURATION;
        const diff = endTime - Date.now();

        if (diff <= 0) {
          // timer ended — restart it by setting a new end time
          const newEnd = Date.now() + DURATION;
          safeStorage.set("offerTimerEnd", String(newEnd));
          setTimeLeft(DURATION);
        } else {
          setTimeLeft(diff);
        }
      } catch (e) {
        // fallback: just set remaining to DURATION
        setTimeLeft(DURATION);
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const format = useCallback((ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const miniMinutes = String(Math.floor(timeLeft / 1000 / 60)).padStart(2, "0");
  const miniSeconds = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, "0");

  return { timeLeft, format, miniMinutes, miniSeconds };
}

function useProgressBar() {
  useEffect(() => {
    const bar = document.getElementById("progressBar");
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const scrolled = total > 0 ? (window.scrollY / total) * 100 : 0;
      if (bar) bar.style.width = scrolled + "%";
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

function useLiveViewers(elementId) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(elementId);
    if (!el) return;

    const id = setInterval(() => {
      const num = Math.floor(Math.random() * (120 - 40 + 1)) + 40;
      el.textContent = String(num);
    }, 4000);

    return () => clearInterval(id);
  }, [elementId]);
}

// Welcome popup shown on first visit or when desired
function WelcomePopup({ onContinue }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[999999]">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto text-center border border-yellow-400">
        
        <h2 className="text-2xl font-bold text-yellow-700 mb-4">
          Welcome Entrepreneur 🚀
        </h2>

        <p className="text-zinc-700 mb-6 text-lg font-medium">
          "Innovate constantly. Quality is the promise, 
          <br /> but growth is the journey powered by relentless improvement."
        </p>

        <button
          onClick={onContinue}
          className="bg-gradient-to-r from-yellow-300 to-yellow-500 px-8 py-3 rounded-xl font-semibold text-black shadow-lg hover:scale-105 transition-all animate-buttonGlow"
        >
          Continue
        </button>

      </div>
    </div>
  );
}

/*********************************
 * Small Components
 *********************************/
function ProgressBar() {
  useProgressBar();
  return (
    <div
      id="progressBar"
      className="fixed top-0 left-0 h-1 bg-yellow-500 z-50 transition-all duration-300"
    />
  );
}

function ExitPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Don't show again if the user already dismissed it once.
    try {
      if (localStorage.getItem("exitPopupDismissed")) return;
    } catch (e) {}

    const handler = (e) => {
      try {
        if (localStorage.getItem("exitPopupDismissed")) return;
      } catch (e) {}

      if (e.clientY < 10) setOpen(true);
    };

    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-yellow-300">
        <h3 className="text-2xl font-bold mb-4 text-yellow-700">Wait! Before You Leave</h3>
        <p className="text-zinc-700 mb-6">
          Your ₹99 Guidance session is still available. Don't miss this chance!
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <PrimaryButton
            label="Continue"
            onClick={() => {
              try {
                localStorage.setItem("exitPopupDismissed", "1");
              } catch (e) {}
              setOpen(false);
            }}
          />
          <RegisterButton
            amount={99}
            label="Book Now"
            className="px-6 py-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold rounded-2xl shadow-lg hover:shadow-xl"
          />
        </div>
      </div>
    </div>
  );
}

// LiveTodayBanner replaced with dynamic LiveBanner component from API
// Use <LiveBanner /> component instead in the main render

/*********************************
 * Stats Strip
 *********************************/
function StatsStrip() {
  // animate values when the strip is in view (runs each time it enters viewport)
  const containerRef = useRef(null);
  const [inViewCount, setInViewCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // incrementing forces useCountUp to restart via restartKey
            setInViewCount((c) => c + 1);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Animate to requested targets so the numbers remain animated
  const valA = useCountUp(2400, { duration: 1400, decimals: 0, start: inViewCount > 0, restartKey: inViewCount });
  const valB = useCountUp(4.96, { duration: 1400, decimals: 2, start: inViewCount > 0, restartKey: inViewCount });
  const valC = useCountUp(100, { duration: 1400, decimals: 0, start: inViewCount > 0, restartKey: inViewCount });
  const valD = useCountUp(100, { duration: 1400, decimals: 0, start: inViewCount > 0, restartKey: inViewCount });

  const displayA = `${Math.round(valA).toLocaleString()}+`;
  const displayB = `${Number(valB).toFixed(2)}★`;
  const displayC = `${Math.round(valC)}s`;
  const displayD = `₹${Math.round(valD)}Cr+`;

  return (
    <div ref={containerRef} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-zinc-600 text-sm">
      <div className="p-6 rounded-2xl bg-white shadow-lg border border-yellow-200 text-black font-semibold">
        {displayA} Founders Trained
      </div>
      <div className="p-6 rounded-2xl bg-white shadow-lg border border-yellow-200 text-black font-semibold">
        {displayB} Avg Rating
      </div>
      <div className="p-6 rounded-2xl bg-white shadow-lg border border-yellow-200 text-black font-semibold">
        {displayC} Case Studies
      </div>
      <div className="p-6 rounded-2xl bg-white shadow-lg border border-yellow-200 text-black font-semibold">
        {displayD} Results
      </div>
    </div>
  );
}

/*********************************
 * HERO SECTION
 *********************************/
const JoinPopup = ({ name, isMobile }) => (
  <div
    className={`
      fixed z-[9999] px-4 py-3 bg-white shadow-2xl border border-yellow-400 
      rounded-xl text-black font-semibold flex items-center gap-3 
      animate-fade-in-out 
      ${isMobile ? "top-4 left-1/2 -translate-x-1/2" : "bottom-6 right-6"}
    `}
  >
    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
    <p>{name} just joined!</p>
  </div>
);

function Hero({ parallaxY }) {
  return (
    <section
      id="hero"
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 bg-white relative overflow-hidden"
      data-testid="hero"
    >
      {/* Soft glow backgrounds */}
      <motion.div
        style={{ y: parallaxY }}
        className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full 
        bg-[radial-gradient(circle_at_center,rgba(255,221,87,0.35),transparent_60%)]"
      />
      <motion.div
        style={{ y: parallaxY }}
        className="pointer-events-none absolute -bottom-32 left-[-10%] h-[380px] w-[380px] rounded-full 
        bg-[radial-gradient(circle_at_center,rgba(255,187,0,0.18),transparent_60%)]"
      />

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-yellow-700 max-w-4xl leading-tight"
      >
        Transform Your Business With Personal 1-on-1 Guidance
      </motion.h1>

      {/* Subline */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-lg md:text-2xl text-zinc-700 mt-4 max-w-2xl"
      >
        Get clarity, strategy & direction tailored exactly for YOUR business.
      </motion.p>

      {/* Stats */}
      <StatsStrip />

      {/* CTA Button */}
      <PrimaryButton className="mt-12" />
    </section>
  );
}

// Old Hero function kept for fallback - HeroSection (dynamic from API) is used instead in render

/*********************************
 * SUCCESS MARQUEE
 *********************************/
// ---------- AUTO-INCREASING JOIN COUNT -----------

function useJoinCounter() {
  const [count, setCount] = React.useState(50); // starting number

  React.useEffect(() => {
    // Step 1: check stored value
    const saved = localStorage.getItem("joinedCount");

    let current = saved ? parseInt(saved, 10) : 50;
    setCount(current);

    // Step 2: increase every 1 hour (3600000ms)
    const interval = setInterval(() => {
      current = current + Math.floor(Math.random() * 3) + 1; // increase 1–3 users
      localStorage.setItem("joinedCount", current);
      setCount(current);
    }, 3600 * 1000);

    // extra: update once on page load after few seconds
    setTimeout(() => {
      current = current + Math.floor(Math.random() * 2) + 1;
      localStorage.setItem("joinedCount", current);
      setCount(current);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return count;
}

// Small hook: animate numbers from 0 -> end over `duration` ms
function useCountUp(end, { duration = 1400, decimals = 0, start = true, restartKey = 0 } = {}) {
  const [value, setValue] = React.useState(0);
  const rafRef = React.useRef(null);
  const startRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!start) {
      setValue(0);
      return;
    }

    // reset and start animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    function step(now) {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad-ish
      const current = end * eased;
      setValue(Number(current.toFixed(decimals)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // restartKey allows re-triggering the animation when it changes (e.g. on intersection)
  }, [end, duration, decimals, start, restartKey]);

  return value;
}

const SuccessMarquee = () => {
  const joined = useJoinCounter();

  return (
    <div className="w-full bg-transparent py-6 mt-6 text-yellow-800 font-semibold text-sm md:text-base border-t border-yellow-300 overflow-hidden text-center">
      <span className="inline-block animate-marquee2">
        🚀 {joined} Entrepreneurs Joined • 98% Satisfaction • Last Registration 3 Minutes Ago
      </span>
    </div>
  );
};

/*********************************
 * SESSION EXPLAINER
 *********************************/
function SessionExplainer({ miniMinutes, miniSeconds }) {
  return (
    <section className="py-20 px-6 bg-white text-black" data-testid="coach-intro">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        
        {/* Bullet Points */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
          <h2 className="text-2xl font-bold mb-4">What Happens In Your 1-on-1 Session?</h2>

          <ul className="space-y-3 text-zinc-600 text-lg">
            <li>● You Get <span className="font-semibold text-yellow-800">Personal Attention</span> on your exact business challenges</li>
            <li>● You Receive a <span className="font-semibold text-yellow-800">Custom Growth Plan</span> designed only for your business</li>
            <li>● You Discover <span className="font-semibold text-yellow-800">specific action steps</span> for revenue, team & systems</li>
            <li>● You Walk Away With a <span className="font-semibold text-yellow-800">clear Action roadmap</span></li>
            <li>● <span className="font-semibold text-yellow-800">1 Hour</span> That Can Change the Way You Run Your Business</li>
          </ul>
        </div>

        {/* Coach Image */}
        <div className="flex justify-center bg-white p-4 rounded-2xl shadow-lg">
          <img src="./coach.png" alt="Coach" className="rounded-2xl w-full max-w-sm shadow-2xl" />
        </div>
      </div>

      {/* Coach Info */}
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <p className="text-zinc-600 mb-2">This is a Private 1-on-1 Guidance Session</p>

        <h2 className="text-4xl font-bold">Arunn Guptaa</h2>
        <p className="text-lg text-zinc-600 mt-2">India's Emerging Business Growth Coach</p>
        <p className="mt-4 text-zinc-600">Guided and Mentored Business Owners to Build Profitable & Scalable Enterprises</p>

        {/* Rating Block + Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-fit mb-8 mx-auto">
          <div className="flex items-center gap-4 bg-zinc-900 px-5 py-4 rounded-xl border border-zinc-800 shadow-lg w-full sm:w-auto">
            <span className="text-yellow-400 text-2xl sm:text-xl">★★★★★</span>
            <p className="text-zinc-300 text-base sm:text-sm text-center sm:text-left">
              2,400+ People Rated
              <br className="block sm:hidden" />
              <span className="block">My Programs with 4.96 Star</span>
            </p>
          </div>

          <PrimaryButton className="sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0" />
        </div>

        {/* Timer */}
        <div className="mt-10">
          <p className="text-lg mb-4">Register in next</p>

          <div className="flex justify-center gap-6">
            <div className="bg-black text-white px-6 py-4 rounded-xl border border-white/40 shadow-xl text-center">
              <p className="text-4xl font-bold">{miniMinutes}</p>
              <span className="block text-sm mt-1">Minutes</span>
            </div>

            <div className="bg-black text-white px-6 py-4 rounded-xl border border-white/40 shadow-xl text-center">
              <p className="text-4xl font-bold">{miniSeconds}</p>
              <span className="block text-sm mt-1">Seconds</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { StatsStrip };
/*********************************
 * FEATURED LOGOS – PREMIUM CAROUSEL
*********************************/
function FeaturedLogos() {
  // Apni 8 images yahan add karo (file names tum apne hisaab se rakh sakte ho)
  const images = [
    "/featured1.jpg",
    "/featured2.jpg",
    "/featured3.jpg",
    "/featured4.jpg",
    "/featured5.jpg",
    "/featured6.jpg",
    "/featured7.jpg",
    "/featured8.jpg",
  ];

  const [current, setCurrent] = React.useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrent((prev) => (prev - 1 + images.length) % images.length);

  // Auto-slide
  React.useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="py-16 bg-black border-t border-yellow-200"
      data-testid="featured"
    >
      <div className="max-w-5xl mx-auto relative px-6">
        {/* Floating heading placed above the carousel (centered) */}
        <h2 className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg md:text-3xl font-bold text-yellow-400 z-20">
          Featured In
        </h2>
        {/* Outer Glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,215,80,0.28),transparent_70%)]" />

        {/* Slider */}
        <div className="overflow-hidden rounded-3xl border border-yellow-500/40 bg-zinc-950/70 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {images.map((src, idx) => (
              <div
                key={idx}
                className="min-w-full flex justify-center items-center py-10 px-6"
              >
                <div className="w-full max-w-3xl aspect-[16/7] bg-zinc-900/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.7)]">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Left / Right controls */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition"
          >
            ◀
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition"
          >
            ▶
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4 mb-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 w-6 rounded-full ${
                  i === current ? "bg-yellow-400" : "bg-zinc-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/*********************************
 * BUSINESS TRANSFORMATION GRAPH
 *********************************/
function TransformGraph() {
  return (
    <section
      className="py-24 bg-white text-black text-center relative overflow-hidden border-t border-yellow-200"
      data-testid="business-transform"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.18 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,80,0.35),transparent_75%)]"
      />

      <h2 className="text-3xl md:text-4xl font-extrabold mb-14 relative z-10 text-yellow-700 drop-shadow">
        How Your Business Will Transform With 1-on-1 Guidance
      </h2>

      <div className="relative flex justify-center items-center w-full max-w-3xl mx-auto h-[380px] md:h-[420px] z-10">

        {/* Center bubble */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute w-44 h-44 bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-full 
          flex items-center justify-center shadow-2xl border-4 border-yellow-600 text-black font-bold text-lg"
        >
          Business<br />Breakthrough
        </motion.div>

        {/* Top */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute -top-4 bg-white p-4 rounded-xl shadow-lg border border-yellow-300 font-semibold text-yellow-700"
        >
          Right Mindset
        </motion.div>

        {/* Left */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute left-0 md:-left-10 bg-white p-4 rounded-xl shadow-lg border border-yellow-300 font-semibold text-yellow-700"
        >
          <>Improved<br/>Systems</>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute right-0 md:-right-10 bg-white p-4 rounded-xl shadow-lg border border-yellow-300 font-semibold text-yellow-700"
        >
          <>Better<br/>Strategies</>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="absolute -bottom-4 bg-white p-4 rounded-xl shadow-lg border border-yellow-300 font-semibold text-yellow-700"
        >
          High Team Performance
        </motion.div>

      </div>
      {/* Register button removed from this section per request */}
    </section>
  );
}

/*********************************
 * WHAT YOU WILL LEARN (1 Hr)
 *********************************/
function LearnSection() {
  const list = [
    "How To Build A Growth-Focused, High-Performance Business.",
    "The Difference Between Growth Businesses & Survival Businesses.",
    "Why Most Business Owners Get Stuck — And How To Break Through.",
    "The Focus Areas Required To Build A Scalable Growth Machine.",
  ];

  return (
    <section
      className="py-20 bg-white text-black px-6 border-t border-yellow-200"
      data-testid="learn-1hr"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-yellow-700">
        What You Will Learn In<br />1 Hr
      </h2>

      <div className="w-20 h-1 bg-yellow-400 mx-auto mb-12 rounded-full" />

      <div className="space-y-6 max-w-3xl mx-auto">
        {list.map((text, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl shadow-lg border border-yellow-200 flex flex-col items-start"
          >
            <div className="bg-yellow-100 text-yellow-700 font-bold px-4 py-2 rounded-lg mr-4 text-lg shadow-sm">
              {String(idx + 1).padStart(2, "0")}.
            </div>

            <p className="text-lg font-medium text-zinc-700">{text}</p>

            {idx === 3 && (
              <p className="text-zinc-600 text-base mt-3 ml-16">
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/*********************************
 * FEATURES GRID
 *********************************/
function FeaturesGrid() {
  const items = [
    { title: "Clarity", desc: "Get crystal-clear direction on what to focus on to grow faster.", icon: <Lightbulb className="h-6 w-6 text-yellow-700" /> },
    { title: "Systems", desc: "Build structured processes that make your business run smoothly.", icon: <Layers className="h-6 w-6 text-yellow-700" /> },
    { title: "Growth", desc: "Unlock strategies that help you scale without chaos or confusion.", icon: <TrendingUp className="h-6 w-6 text-yellow-700" /> },
    { title: "Leadership", desc: "Develop mindset & skills to lead your team with confidence.", icon: <Users className="h-6 w-6 text-yellow-700" /> },
    { title: "Strategy", desc: "Learn proven business strategies that actually move the needle.", icon: <Target className="h-6 w-6 text-yellow-700" /> },
    { title: "Execution", desc: "Implement action-driven plans that generate real business results.", icon: <CheckCircle className="h-6 w-6 text-yellow-700" /> },
  ];

  return (
    <section
      id="features"
      className="py-20 px-6 md:px-10 grid md:grid-cols-3 gap-10 bg-white border-t border-yellow-200"
      data-testid="features"
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
          className="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="mb-4 p-3 rounded-xl bg-yellow-100 border border-yellow-300 w-fit">{item.icon}</div>

          <h3 className="text-3xl font-semibold mb-4 text-yellow-700">{item.title}</h3>

          <p className="text-zinc-600 text-lg">{item.desc}</p>
        </motion.div>
      ))}
    </section>
  );
}

/*********************************
 * REVIEW MARQUEE
 *********************************/
function ReviewMarquee() {
  return (
    <section className="py-12 bg-transparent text-black px-6 border-t border-yellow-200">
      <h2 className="text-3xl font-bold text-center mb-6 text-yellow-700">Real Strategies. Real Clarity. Real Business Growth.</h2>

      <div className="max-w-4xl mx-auto overflow-hidden">
        <div className="flex gap-10 whitespace-normal text-lg text-zinc-700">
          <div className="w-full text-center">“Entrepreneurs gain clarity within the first 15 minutes — guaranteed.”</div>
        </div>
      </div>
    </section>
  );
}

/*********************************
 * BONUSES
 *********************************/
function Bonuses() {
  return (
    <section
      className="py-20 bg-white px-6 border-t border-yellow-200"
      data-testid="bonuses"
    >
      <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-yellow-700">
        Additional Support You'll Receive
      </h2>

      <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {(
          [
            {
              id: 1,
              img: "/bonus1.png",
              title: "Employee Retention PowerKit",
              subtitle: "A proven toolkit to keep your best employees loyal, motivated & long-term.",
            },
            {
              id: 2,
              img: "/bonus2.png",
              title: "Branch / Franchise Expansion PowerKit",
              subtitle: "Your strategic blueprint to scale confidently into new locations.",
            },
            {
              id: 3,
              img: "/bonus3.png",
              title: "Business Automation PowerKit",
              subtitle: " Systematize your operations and reduce manual workload effortlessly.",
            },
            {
              id: 4,
              img: "/bonus4.png",
              title: "Fund Raising PowerKit",
              subtitle: "A step-by-step playbook to prepare, pitch & secure business funding.",
            },
            {
              id: 5,
              img: "/bonus5.png",
              title: "Export–Import Launch PowerKit",
              subtitle: "A practical guide to start, manage & grow your export–import journey.",
            },
            {
              id: 6,
              img: "/bonus6.png",
              title: "Growth Diagnosis PowerKit",
              subtitle: "Identify bottlenecks, fix hidden gaps & unlock fast business growth.",
            },
          ]
        ).map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.2 }}
            className="bg-white p-6 md:p-8 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex justify-center">
              <img
                src={item.img}
                alt={item.title}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-full max-w-[320px] md:max-w-[420px] lg:max-w-[480px] h-auto object-contain mb-2"
                style={{ maxHeight: '300px' }}
              />
            </div>

            <h3 className="text-sm md:text-2xl font-semibold mb-1 text-yellow-700">{item.title}</h3>

            <p className="text-zinc-600 text-sm md:text-base">{item.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/*********************************
 * TRUST BADGES
 *********************************/
function TrustBadges() {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 py-6 sm:py-8 bg-white border-t border-yellow-200">
      <div className="px-4 py-2 sm:px-6 sm:py-4 bg-white border border-yellow-300 rounded-lg shadow text-yellow-800 font-semibold text-sm sm:text-base text-center">
        ✅ Secure Payment
      </div>

      <div className="px-4 py-2 sm:px-6 sm:py-4 bg-white border border-yellow-300 rounded-lg shadow text-yellow-800 font-semibold text-sm sm:text-base text-center">
        ✅ 100% Privacy Safe
      </div>

      <div className="px-4 py-2 sm:px-6 sm:py-4 bg-white border border-yellow-300 rounded-lg shadow text-yellow-800 font-semibold text-sm sm:text-base text-center">
        ✅ Money-Back Guarantee
      </div>
    </div>
  );
}

/*********************************
 * CTA SECTION
 *********************************/
function CTA() {
  return (
    <section className="py-12 text-center bg-white border-t border-yellow-200 px-6" data-testid="cta">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-bold mb-6 text-yellow-700"
      >
        Start Your 1-on-1 Guidance Journey
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-lg md:text-2xl text-zinc-700 max-w-3xl mx-auto"
      >
        Book your 1-on-1 session and get personalized Guidance built only for your business.
      </motion.p>
    </section>
  );
}
/*********************************
 * OFFER SHOWCASE
 *********************************/
function OfferShowcase({ miniMinutes, miniSeconds }) {
  return (
    <section className="py-8 bg-white text-black px-6 text-center" id="pricing">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-yellow-300 p-6 relative">
        
        {/* Soft glow background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,235,130,0.35),transparent_70%)] rounded-3xl" />

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-700 mb-3">
          1-on-1 Coaching Session (Today Only)
        </h2>

        {/* Pricing Row */}
        <div className="flex justify-center items-end gap-4 mt-6">
          <span className="diag-strike text-2xl text-zinc-500">₹9999</span>
          <span className="text-6xl font-extrabold text-yellow-600">₹99</span>
        </div>

        {/* Smart Explanation – short & classy */}
        <p className="mt-4 text-zinc-700 text-lg font-medium max-w-lg mx-auto">
          Start your session for <span className="font-bold text-yellow-700">just ₹99, Today.</span> If the session genuinely helps you, you pay the remaining <span className="font-bold text-yellow-700">₹900 after the session.</span>
        </p>

        {/* Short clarity line */}
        <p className="text-sm text-zinc-600 mt-4">
          If not satisfied, request a refund within 1 Hour of session — no questions asked.
        </p>

        {/* CTA */}
        <div className="mt-8">
          <PrimaryButton
            amount={99}
            label={"Book Your Slot for ₹99"}
            className={"relative px-8 py-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold text-base rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 animate-buttonGlow"}
          />
        </div>

      </div>
    </section>
  );
}

/*********************************
 * COACH STATS
 *********************************/
function CoachStats() {
  const stats = [
    ["16", "Years of Experience"],
    ["1M", "Entrepreneurs Reached"],
    ["500+", "Seminars Conducted"],
    ["600K", "Followers"],
    ["2,400", "Paid Customers"],
    ["2400+", "Entrepreneur Community"],
    ["2,400", "Guidance Clients"],
    ["210+", "Industries Worked With"],
  ];

  return (
    <section
      className="py-20 bg-white text-black px-6 text-center border-t border-yellow-200"
      data-testid="coach-stats"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-2">Meet Your Coach</h2>
      <div className="w-16 h-1 bg-orange-400 mx-auto mb-10" />

      <div className="flex flex-col items-center mb-10">
        <img
          src="./photo2.png"
          className="w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover"
        />
        <h3 className="text-2xl font-bold mt-4">Arunn Guptaa</h3>
        <p className="text-zinc-600 text-base mt-1">
          India's Leading Business Success Coach
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {stats.map(([num, label], i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-zinc-200">
            <p className="text-3xl font-bold text-orange-600">{num}</p>
            <p className="text-sm mt-1 text-zinc-600">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/*********************************
 * GUARANTEE SECTION
 *********************************/
function Guarantee() {
  return (
    <section
      id="guarantee-section"
      className="py-20 px-6 bg-white text-black border-t border-yellow-200"
      data-testid="guarantee"
    >
      <div className="relative max-w-4xl mx-auto bg-white p-10 rounded-3xl border border-yellow-200 shadow-xl pt-20">

        {/* Floating Logo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <img
            src="/money-back.png"
            alt="Money Back Guarantee"
            className="w-44 h-auto drop-shadow-xl"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-orange-500">
          Our Guarantee
        </h2>

        <p className="text-center text-zinc-600 max-w-2xl mx-auto mb-8">
          Join today for just ₹99 and experience a powerful business-growth
          session. If you feel it did not deliver value, we will give your
          money back — no questions asked. 100% satisfaction or full refund!
        </p>

        <h3 className="text-2xl font-bold text-center text-orange-400 mb-2">
          A Promise
        </h3>

        <div className="w-16 h-1 bg-orange-400 mx-auto mb-6" />

        <h4 className="text-xl font-bold text-center text-yellow-600 mb-6">
          No Questions Asked Money Back Guarantee
        </h4>

        <p className="text-zinc-600 leading-relaxed mb-4">Dear Participant,</p>

        <p className="text-zinc-600 leading-relaxed mb-4">
          I am here to guide you personally and share powerful business
          insights that can help you take your business to the next level.
        </p>

        <p className="text-zinc-600 leading-relaxed mb-6">
          If not satisfied, request a refund within 1 Hour of session — no questions asked. Simply email <span className="text-orange-300">refund@arunlive.com</span>.
        </p>

        <p className="text-zinc-600 mb-6">
          Yours, <br />
          <span
            className="text-3xl text-yellow-600 italic font-semibold tracking-wide"
            style={{ fontFamily: "cursive" }}
          >
            Arunn Guptaa
          </span>
        </p>

        <div className="text-center mt-8">
          <RegisterButton className={
            "px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold text-sm md:text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition"
          } />
        </div>
      </div>
    </section>
  );
}

/*********************************
 * VIDEO TESTIMONIALS CAROUSEL
 *********************************/
function VideoTestimonials() {
  // Carousel: show 3 videos at once on md+ and 1 on mobile.
  // Play videos sequentially: when one finishes, the next starts; when group ends, advance to next group.
  const [isMdUp, setIsMdUp] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const baseVideos = [
    "test3.mp4",
    "test6.mp4",
    "test4.mp4",
    "test5.mp4",
    "test1.mp4",
    "test2.mp4",
  ];

  const slidesCount = baseVideos.length;
  const slidesPerView = isMdUp ? 3 : 1;
  const groupCount = Math.max(1, Math.ceil(slidesCount / slidesPerView));

  const [groupIndex, setGroupIndex] = useState(0); // which group/page is visible
  const [playingIndex, setPlayingIndex] = useState(0); // absolute index of video currently playing
  const videoRefs = useRef([]);

  // helper: play a specific video index (muted) and pause others
  const playVideoAt = (idx) => {
    videoRefs.current.forEach((v, i) => {
      try {
        if (!v) return;
        if (i === idx) {
          // try to play; modern browsers return a promise
          v.muted = true;
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
        }
      } catch (e) {}
    });
  };

  // whenever groupIndex changes, set playingIndex to group's first item and start it after layout
  useEffect(() => {
    const start = groupIndex * slidesPerView;
    setPlayingIndex((_) => start);
    // give browser a tick to layout and then play
    const t = setTimeout(() => {
      playVideoAt(start);
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, slidesPerView]);

  // when playingIndex changes, play that video
  useEffect(() => {
    if (playingIndex == null) return;
    playVideoAt(playingIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingIndex]);

  const onEnded = (idx) => {
    const groupStart = groupIndex * slidesPerView;
    const groupEnd = Math.min(groupStart + slidesPerView - 1, slidesCount - 1);

    if (idx < groupEnd) {
      // play next within group
      setPlayingIndex(idx + 1);
    } else {
      // move to next group and play its first video
      const nextGroup = (groupIndex + 1) % groupCount;
      setGroupIndex(nextGroup);
      // playingIndex will be set by the groupIndex effect
    }
  };

  const nextGroup = () => setGroupIndex((g) => (g + 1) % groupCount);
  const prevGroup = () => setGroupIndex((g) => (g - 1 + groupCount) % groupCount);

  return (
    <section id="testimonials" className="py-20 bg-black text-white px-6" data-testid="video-testimonials">
      <h2 className="text-3xl md:text-5xl font-bold text-center mb-10">Client Video Feedback</h2>

      <div className="relative max-w-5xl mx-auto overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${groupIndex * 100}%)` }}
        >
          {baseVideos.map((src, i) => (
            <div key={i} style={{ minWidth: `${100 / slidesPerView}%` }} className="px-2">
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                src={src}
                className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover rounded-xl shadow-xl"
                muted
                playsInline
                preload="metadata"
                controls
                onEnded={() => onEnded(i)}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={prevGroup}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-2 rounded-full shadow-xl z-30"
        >
          ◀
        </button>
        <button
          onClick={nextGroup}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-2 rounded-full shadow-xl z-30"
        >
          ▶
        </button>
      </div>

      {/* Dots for groups */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: groupCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => setGroupIndex(i)}
            className={`h-2 w-6 rounded-full ${i === groupIndex ? "bg-white" : "bg-zinc-600"}`}
          />
        ))}
      </div>
    </section>
  );
}

/*********************************
 * FAQ
 *********************************/
function FAQ() {
  const list = [
    { q: "Is this a 1-on-1 session?", a: "Yes. This is a personalized Guidance session where only you & the coach are present." },
    { q: "What happens in the session?", a: "You get personalized clarity, custom strategies, and a Roadmap." },
    { q: "Do I need to prepare?", a: "Yes. After registration, you'll receive a short form for details." },
    { q: "Can I reschedule?", a: "Yes, once if informed 24 hours in advance." },
    { q: "Will you help with exact problems?", a: "Absolutely. Everything is business-specific." },
    { q: "Refund policy?", a: "If not satisfied, request a refund within 1 Hour of session — no questions asked." },
    { q: "Is ₹99 the final price?", a: "Yes, limited-time offer for new clients only. However you can pay Rs 900 if you are 100% satisfied with the consultancy, just after the session." },
    { q: "Will I get notes?", a: "Yes, you'll receive a written action roadmap after session." },
  ];

  return (
    <section id="faq" className="py-20 bg-white px-6 text-black border-t border-yellow-200">
      <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Frequently Asked Questions</h2>

      <div className="max-w-3xl mx-auto space-y-6">
        {list.map((item, i) => (
          <details key={i} className="bg-white border border-yellow-200 p-6 rounded-xl shadow-md">
            <summary className="text-xl font-semibold cursor-pointer">{item.q}</summary>
            <p className="text-zinc-600 mt-3">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/*********************************
 * PRIVACY FOOTER
 *********************************/
function PrivacyFooter() {
  return (
    <section
      className="pt-12 pb-24 bg-white text-zinc-600 px-6 text-center border-t border-yellow-200"
      data-testid="privacy-footer"
    >
      <div className="flex flex-col items-center gap-3">
        <img src="./logo.png" alt="Company Logo" className="h-16 md:h-20 mb-1" />

        <p className="text-sm text-zinc-600 mt-2">© 2025 Arunn Guptaa. All rights reserved.</p>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-3">
          <a href="/terms.html" className="underline text-zinc-600 hover:text-black transition text-sm">Terms and Conditions</a>
          <span className="hidden sm:inline">•</span>
          <a href="/privacy.html" className="underline text-zinc-600 hover:text-black transition text-sm">Privacy Policy</a>
          <span className="hidden sm:inline">•</span>
          <a href="/refund.html" className="underline text-zinc-600 hover:text-black transition text-sm">Refund Policy</a>
        </div>
      </div>
    </section>
  );
}

/*********************************
 * STICKY OFFER BAR
 *********************************/
function StickyOfferBar({ timeLeft, format }) {
  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md text-black py-2 px-4 flex flex-col 
      sm:flex-row gap-2 sm:gap-6 sm:justify-between sm:items-center z-50 shadow-[0_0_20px_rgba(0,0,0,0.1)] border-t border-yellow-300"
    >
      <div className="flex items-center gap-3">
        <span className="text-base sm:text-lg font-bold text-yellow-700">Today's Price:</span>
        <div className="flex items-end gap-3">
          <span className="diag-strike text-lg text-zinc-500">₹9999</span>
          <span className="text-2xl font-extrabold text-yellow-600">₹99</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-yellow-700 font-semibold">
        <span>Ends In:</span>
        <span className="text-xl font-bold">{format(timeLeft)}</span>
      </div>

      <RegisterButton className={
        "px-6 py-2 sm:px-8 sm:py-3 text-sm sm:text-sm bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition"
      } />
    </div>
  );
}

/*********************************
 * SCROLL END POPUP
 *********************************/
function ScrollEndPopup() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem("scrollEndDismissed")) return;
    } catch (e) {}

      const handleScroll = () => {
      try {
        if (localStorage.getItem("scrollEndDismissed")) return;
      } catch (e) {}

      const scrollPos = window.innerHeight + window.scrollY;
      const pageHeight = document.body.offsetHeight;

      // Only trigger when user reaches the very end of the page (within 50px)
      // Avoid triggering on short pages where pageHeight <= window.innerHeight
      if (pageHeight <= window.innerHeight) return;

      const remaining = pageHeight - scrollPos;
      if (remaining <= 50) {
        setShow(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex justify-center items-center">
      <div className="bg-white p-6 md:p-10 w-[90%] max-w-md rounded-2xl shadow-2xl border border-yellow-300 text-center animate-fade-in-up">
        
        <h2 className="text-2xl font-bold text-yellow-700 mb-3">
          You're Almost There!
        </h2>

        <p className="text-zinc-700 text-base mb-6 font-medium leading-relaxed">
          Successful entrepreneurs take action.  
          Today, your business deserves <span className="text-yellow-600 font-semibold">clarity & transformation.</span>
        </p>

        <RegisterButton
          amount={99}
          label={"Start Your Journey @ ₹99"}
          className="px-8 py-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold text-base rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 animate-buttonGlow"
        />

        <button
          onClick={() => {
            try {
              localStorage.setItem("scrollEndDismissed", "1");
            } catch (e) {}
            setShow(false);
          }}
          className="block mt-4 mx-auto text-sm text-zinc-500 hover:text-black"
        >
          ✕ Close
        </button>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/*********************************
 * MAIN LANDING PAGE
 *********************************/
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  const { timeLeft, format, miniMinutes, miniSeconds } = useOfferTimer();

  // (removed useStickyTimerBar) StickySoldTimer uses its own scroll logic

  // use shared hook for sold percentage (reads/writes localStorage 'soldOutPercent')
  const soldOutPercent = useSoldOutProgress();

  // global loading overlay state (listens to window.globalLoading events)
  const [globalLoading, setGlobalLoading] = React.useState(false);
  React.useEffect(() => {
    const handler = (e) => {
      try {
        setGlobalLoading(!!e.detail);
      } catch {
        setGlobalLoading(false);
      }
    };
    window.addEventListener("globalLoading", handler);
    return () => window.removeEventListener("globalLoading", handler);
  }, []);

  // Popup logic: show a random unused name periodically with sound
  const joinNames = names;
  const [popupName, setPopupName] = React.useState(null);
  const [usedNames, setUsedNames] = React.useState([]);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 600 : false;
  const audioRef = React.useRef(null);
  // Welcome popup state (shows before all sections)
  const [showWelcome, setShowWelcome] = React.useState(true);

  // Guarantee popup state (opens once when guarantee section enters view)
  const [showGuaranteePopup, setShowGuaranteePopup] = React.useState(false);

  const handleWelcomeContinue = () => {
    setShowWelcome(false);
  };
  // Initialize audio once and unlock on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    audioRef.current = new Audio('/ding.mp3');
    audioRef.current.volume = 0.6;

    // Unlock audio on any first user action (touch, click, scroll, keypress)
    const unlockAudio = () => {
      if (!audioRef.current) return;
      try {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }).catch(() => {});
      } catch {}
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('scroll', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('scroll', unlockAudio, { once: true });

    // 🔥 Fake user interaction hack to unlock audio (mousemove/touchstart)
    const simulateClick = () => {
      try {
        const evt = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        window.dispatchEvent(evt);

        // Try playing then pausing to unlock audio
        const p = audioRef.current && audioRef.current.play && audioRef.current.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch (e) {}

      // Remove listener after first fake trigger
      window.removeEventListener('mousemove', simulateClick);
      window.removeEventListener('touchstart', simulateClick);
    };

    // 🔥 Trigger automatically (first movement is enough)
    window.addEventListener('mousemove', simulateClick);
    window.addEventListener('touchstart', simulateClick);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('scroll', unlockAudio);
      window.removeEventListener('mousemove', simulateClick);
      window.removeEventListener('touchstart', simulateClick);
    };
  }, []);

  // Show guarantee popup once when the Guarantee section is in view
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const target = document.getElementById("guarantee-section");
      if (!target) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!localStorage.getItem("popup_triggered")) {
                setShowGuaranteePopup(true);
                try { localStorage.setItem("popup_triggered", "yes"); } catch (e) {}
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(target);
      return () => observer.disconnect();
    } catch (e) {
      return undefined;
    }
  }, []);

  // Interval to show popups and play the audioRef when available
  React.useEffect(() => {
    const showPopup = () => {
      const available = joinNames.filter((n) => !usedNames.includes(n));
      if (available.length === 0) return;

      const randomName = available[Math.floor(Math.random() * available.length)];
      setUsedNames((prev) => [...prev, randomName]);
      setPopupName(randomName);
      // 🔥 SOLD % bump for joined popup
      window.dispatchEvent(new Event("joinedPopup"));

      // play sound if audio is available
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          const p = audioRef.current.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } catch (e) {}

      setTimeout(() => setPopupName(null), 4000);
    };

    // Start popups regardless; sound will only play when unlocked. Keep interval.
    const interval = setInterval(showPopup, 9000);
    return () => clearInterval(interval);
  }, [usedNames]);

  return (
    <>
        <ProgressBar />
        <ExitPopup />
        <AppLoader loading={globalLoading} />

        {showWelcome && <WelcomePopup onContinue={handleWelcomeContinue} />}

      {/* top sticky sold timer — shows when user scrolls (component has internal scroll listener) */}
      <StickySoldTimer timeLeft={timeLeft} format={format} sold={soldOutPercent} />

      <div className="min-h-screen w-full bg-white text-black font-sans relative pt-6 pb-28 sm:pb-12 md:pb-12">
        <h1 className="sr-only">Arunn Guptaa — Business Growth Coach</h1>
        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)] animate-pulse" />

        {/* Header Image */}
        <div className="w-full flex justify-center mt-4 mb-6 bg-transparent">
          <img
            src="./logo.png"
            alt="Session Banner"
            className="w-full max-w-md rounded-2xl bg-transparent"
            style={{ backgroundColor: 'transparent', objectFit: 'contain', maxHeight: '200px' }}
          />
        </div>

        {/* Dynamic Components from API */}
        <LiveBanner />
        <HeroSection />
        <SuccessMarquee />

        {/* Sold out progress bar (dynamic) */}
        <SoldOutBar />
        
        <section id="timerSection">
          <SessionExplainer miniMinutes={miniMinutes} miniSeconds={miniSeconds} />
        </section>
        <FeaturedCarousel />
        <TransformGraph />
        <LearnSection />
        <FeaturesGrid />
        <ReviewMarquee />
        <Bonuses />
        <TrustBadges />
        <CTA />
        <OfferShowcase miniMinutes={miniMinutes} miniSeconds={miniSeconds} />
        <CoachStats />
        <Guarantee />
        <VideoTestimonials />
        <FAQ />

        {/* Register CTA under FAQ */}
        <section className="py-12 bg-yellow-50 px-6 border-t border-yellow-200 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-yellow-700 mb-3">Ready For Personal 1-on-1 Guidance?</h3>
            <p className="text-zinc-700 mb-6">Reserve your private session now — limited seats available.</p>
            <RegisterButton
              amount={99}
              label={"Book Now @ ₹99"}
              className={"px-10 py-4 text-black font-extrabold text-lg rounded-3xl bg-gradient-to-r from-[#FFD700] to-[#FFB300] shadow-[0_0_18px_rgba(255,200,0,0.7)] hover:shadow-[0_0_30px_rgba(255,200,0,1)] transition-all duration-300"}
            />
          </div>
        </section>
        <ScrollEndPopup />
        <PrivacyFooter />
        <StickyOfferBar timeLeft={timeLeft} format={format} />
      </div>

      {showGuaranteePopup && (
        <GuaranteePopup onClose={() => setShowGuaranteePopup(false)} />
      )}

      {popupName && (
        <div className={`fixed ${isMobile ? "top-4 left-1/2 -translate-x-1/2" : "bottom-24 right-4"} z-[9999] bg-white px-4 py-2 rounded-xl shadow-lg border border-yellow-300 text-sm text-black animate-fade-in-out`}>
          {popupName} just joined now!
        </div>
      )}

      {/* Inline styles */}
      <style>{`
        @keyframes marqueeMove {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marqueeMove 18s linear infinite;
          white-space: nowrap;
        }
        .animate-marquee2 {
          display: inline-block;
          animation: marqueeMove 22s linear infinite;
          white-space: nowrap;
          will-change: transform;
          transform: translateZ(0);
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(8px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(8px); }
        }
        .animate-fade {
          animation: fadeInOut 4s ease-in-out forwards;
        }

        /* Button glow animation requested */
        @keyframes buttonGlow {
          0% { box-shadow: 0 0 12px rgba(255, 200, 0, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 22px rgba(255, 200, 0, 0.7); transform: scale(1.03); }
          100% { box-shadow: 0 0 12px rgba(255, 200, 0, 0.4); transform: scale(1); }
        }

        /* Diagonal strike for old price */
        .diag-strike {
          position: relative;
          display: inline-block;
        }

        .diag-strike::after {
          content: '';
          position: absolute;
          left: -8%;
          right: -8%;
          top: 50%;
          height: 2px;
          background: currentColor;
          opacity: 0.8;
          transform: rotate(-18deg);
          transform-origin: center;
          border-radius: 2px;
        }

        .animate-buttonGlow {
          animation: buttonGlow 2s ease-in-out infinite;
        }

        /* Apply glow to all native buttons unless explicitly opted out */
        button:not(.no-glow) {
          animation: buttonGlow 2s ease-in-out infinite;
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
      `}</style>
    </>
  );
}
