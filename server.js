// server.js

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Stripe from "stripe";

// Import models
import { Cast, Movie, Show, DateTimeSlot, Booking } from "./model/User.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Stripe initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -------------------
// MongoDB Connection Helper for Serverless
// -------------------
let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      dbName: "ticketsystem",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Middleware to ensure MongoDB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// -------------------
// Health Check
// -------------------
app.get("/", (req, res) => {
  res.send("QuickShow backend is running");
});

// -------------------
// GET Routes
// -------------------
app.get("/cast", async (req, res) => {
  const data = await Cast.find();
  res.status(200).json({ data });
});

app.get("/movie", async (req, res) => {
  const data = await Movie.find();
  res.status(200).json({ data });
});

app.get("/show", async (req, res) => {
  const data = await Show.find();
  res.status(200).json({ data });
});

app.get("/time", async (req, res) => {
  const data = await DateTimeSlot.find();
  res.status(200).json({ data });
});

app.get("/booking", async (req, res) => {
  const { userId } = req.query;
  const exist = await Booking.find({ "user.userId": userId })
    .populate({
      path: "show",
      populate: { path: "movie" } // populate movie inside show
    });
  res.status(200).json({ exist });
});

// -------------------
// DELETE Booking
// -------------------
app.delete("/booking", async (req, res) => {
  const { userId } = req.query;
  const exist = await Booking.findOne({ "user.userId": userId });
  if (!exist) return res.status(404).json("No record exists");

  await exist.deleteOne();
  res.status(200).json("Record deleted");
});

// -------------------
// POST Booking
// -------------------
app.post("/booking", async (req, res) => {
  const { user, show: showId, seats, totalPrice, bookingDate } = req.body;

  try {
    const showDoc = await Show.findById(showId);
    if (!showDoc) return res.status(404).json({ error: "Show not found" });

    seats.forEach((seat) => {
      showDoc.occupiedSeats.set(seat, "occupied");
    });

    await showDoc.save();

    const booking = new Booking({
      user,
      show: showId,
      seats,
      totalPrice,
      bookingDate
    });

    await booking.save();
    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// -------------------
// Stripe Checkout Session
// -------------------
app.post("/create-checkout-session", async (req, res) => {
  const { seats, totalPrice } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Movie Tickets: ${seats.join(", ")}`
            },
            unit_amount: Number(totalPrice) * 100
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/success?paid=true`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// -------------------
// Export for Vercel Serverless
// -------------------
export default app;
