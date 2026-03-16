import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import https from "https";

dotenv.config();

const app = express();

// CORS Allowed
app.use(cors({ origin: "*", methods: "GET,POST" }));
app.use(bodyParser.json());

// Required Root Route
app.get("/", (req, res) => {
  res.send("Backend running OK! 🚀");
});

// Razorpay Setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt#A1",
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Payment
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    return res.redirect("https://arunlive.com/success.html");
  } else {
    return res.redirect("https://arunlive.com/failed.html");
  }
});

// JWT Link Generator (One-Time + IP Lock)
app.post("/generate-link", (req, res) => {
  const { payment_id } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (!payment_id) return res.status(400).json({ error: "payment_id is required" });

  try {
    const token = jwt.sign(
      { payment_id, ip },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // 1 hour validity
    );

    return res.json({
      secure_link: `https://main-backend-dzf5.onrender.com/secure-session?token=${token}`,
    });
  } catch {
    res.status(500).json({ error: "Failed to generate link" });
  }
});

// One-Time Access + IP Verified Access
const usedTokens = new Set();

app.get("/secure-session", (req, res) => {
  const token = req.query.token;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (!token) return res.status(400).send("Token missing!");

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);

    // One time usage
    if (usedTokens.has(token)) {
      return res.status(403).send("⛔ Access Expired!");
    }

    // IP Verified
    if (data.ip !== ip) {
      return res.status(403).send("⛔ Invalid Device or IP!");
    }

    usedTokens.add(token);
    return res.redirect("https://calendly.com/linksvardha/60min");

  } catch {
    return res.status(403).send("⛔ Session Access Denied");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("🚀 Server running on port " + port));

// Keep-alive ping to render backend (every 8 minutes)
const pingUrl = "https://main-backend-dzf5.onrender.com";
setInterval(() => {
  try {
    const req = https.get(pingUrl, (res) => {
      console.log(`pinged ${pingUrl} - status ${res.statusCode}`);
      // Consume response to free socket
      res.on('data', () => {});
    });
    req.on('error', (err) => {
      console.log('ping failed', err.message);
    });
  } catch (e) {
    console.log('ping failed', e.message);
  }
}, 8 * 60 * 1000); // हर 8 मिनट में पिंग