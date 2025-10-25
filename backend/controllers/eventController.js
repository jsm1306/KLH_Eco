import Event from "../models/Event.js";
import Club from "../models/Club.js";

// Create event (club member)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, clubId, createdBy } = req.body;

    const event = new Event({
      title,
      description,
      date,
      location,
      club: clubId,
      createdBy,
    });

    await event.save();

    // Link event to club
    const club = await Club.findById(clubId);
    if (club) {
      club.events.push(event._id);
      await club.save();
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("club", "name")
      .populate("createdBy", "name role");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get events by club
export const getEventsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const events = await Event.find({ club: clubId }).populate("createdBy", "name role");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete event (only before it starts)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    // If event not found
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event has already started or completed
    const currentTime = new Date();
    const eventStartTime = new Date(event.startDate);

    if (currentTime >= eventStartTime) {
      return res.status(400).json({
        message: "Event cannot be deleted after it has started or completed",
      });
    }

    // Delete the event if condition passes
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
