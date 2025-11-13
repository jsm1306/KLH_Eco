import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    required: true,
  },
  location: String,
  // optional poster or image for the event (stored as a path or URL)
  image: {
    type: String,
    default: null,
  },
  // users who subscribed / registered for this event
  registeredUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed"],
    default: "Upcoming",
  },
});

const Event = mongoose.model("Event", eventSchema);
export default Event;
