import mongoose from "mongoose";

const CastSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profile_path: { type: String, required: true }
});

const MovieSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  title: { type: String, required: true },
  overview: String,
  poster_path: String,
  backdrop_path: String,
  genres: [
    {
      id: Number,
      name: String
    }
  ],
  casts: [CastSchema],
  release_date: String,
  original_language: String,
  tagline: String,
  vote_average: Number,
  vote_count: Number,
  runtime: Number
});

const ShowSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },

  showDateTime: { type: Date, required: true },
  showPrice: { type: Number, required: true },

  occupiedSeats: {
    type: Map,
    of: String, 
    default: {}
  }
});

const BookingSchema = new mongoose.Schema({
  user: {
    name: String,
    userId: String  
  },

  show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },

  seats: [String],

  totalPrice: Number,
  bookingDate: { type: Date, default: Date.now }
});



const DateTimeSlotSchema = new mongoose.Schema({
  date: { type: String, required: true }, 

  slots: [
    {
      time: { type: Date, required: true },
      showId: { type: String, required: true }
    }
  ]
});

export const Cast = mongoose.model("Cast", CastSchema);
export const Movie = mongoose.model("Movie", MovieSchema);
export const Show = mongoose.model("Show", ShowSchema);
export const Booking = mongoose.model("Booking", BookingSchema);
export const DateTimeSlot = mongoose.model("DateTimeSlot", DateTimeSlotSchema);