import Event from "../models/Event.js";
import Club from "../models/Club.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Create event (club member)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, clubId, createdBy } = req.body;
    // Support file uploads (multer) or image path in request body
    const imagePath = req.file ? req.file.path : (req.body.image || null);

    const event = new Event({
      title,
      description,
      date,
      location,
      image: imagePath,
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
      .populate("createdBy", "name role")
      .populate('registeredUsers', 'name mail');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get events by club
export const getEventsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const events = await Event.find({ club: clubId }).populate("createdBy", "name role").populate('registeredUsers', 'name mail');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Subscribe (register) to an event
export const subscribeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
  const event = await Event.findById(eventId).populate('club', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const already = event.registeredUsers && event.registeredUsers.find(u => String(u) === String(userId));
    if (already) return res.status(400).json({ message: 'Already subscribed' });

    event.registeredUsers = event.registeredUsers || [];
    event.registeredUsers.push(userId);
    await event.save();

    // create an in-app notification for the user
    const user = await User.findById(userId);
  const clubName = event.club && event.club.name ? event.club.name : 'Unknown Club';
  await Notification.create({ user: userId, title: 'Subscription confirmed', message: `You have subscribed to ${event.title} (${clubName})`, link: `/events` });

    // send back updated count and a simple acknowledgement
    res.json({ message: 'Subscribed', registeredCount: event.registeredUsers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unsubscribe from an event
export const unsubscribeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.registeredUsers = (event.registeredUsers || []).filter(u => String(u) !== String(userId));
    await event.save();

    await Notification.create({ user: userId, title: 'Unsubscribed', message: `You have unsubscribed from ${event.title}`, link: `/events` });

    res.json({ message: 'Unsubscribed', registeredCount: event.registeredUsers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    // If an image file was uploaded use its path, otherwise allow image in body
    if (req.file) {
      req.body.image = req.file.path;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // fetch populated event to get club name
    const populatedEvent = await Event.findById(event._id).populate('club', 'name');

    // if event has registered users, notify them in-app and send emails
    if (populatedEvent && populatedEvent.registeredUsers && populatedEvent.registeredUsers.length > 0) {
      const users = await User.find({ _id: { $in: populatedEvent.registeredUsers } });
      const clubName = populatedEvent.club && populatedEvent.club.name ? populatedEvent.club.name : 'Unknown Club';
      const notifications = users.map((u) => ({ user: u._id, title: 'Event updated', message: `${populatedEvent.title} (${clubName}) has been updated`, link: `/events/${populatedEvent._id}` }));
      await Notification.insertMany(notifications);

      // prepare emails to all registered users (only those with an email)
      const recipientEmails = users.map((u) => u.mail).filter(Boolean);
      if (recipientEmails.length > 0) {
        try {
          // Prefer a specific admin user's email as the sender if they exist
          const preferredAdminEmail = '2310030002@klh.edu.in';
          let adminSender = null;
          if (preferredAdminEmail) {
            adminSender = await User.findOne({ role: 'admin', mail: preferredAdminEmail });
          }
          if (!adminSender) {
            adminSender = await User.findOne({ role: 'admin', mail: { $exists: true, $ne: null } });
          }
          const fromAddr = (adminSender && adminSender.mail) ? adminSender.mail : (process.env.MAIL_FROM || undefined);

          const subj = `Update: ${populatedEvent.title} - ${clubName}`;
          const text = `Hello,\n\nThe event "${populatedEvent.title}" from ${clubName} you are registered for has been updated. Please check the event details here: ${process.env.FRONTEND_URL || ''}/events/${populatedEvent._id}\n\nRegards,\n${clubName}`;
          // send per-user emails
          await sendBulkEmails(recipientEmails, subj, text, `<p>${text.replace(/\n/g, '<br/>')}</p>`, fromAddr);
        } catch (mailErr) {
          console.error('Failed to send update emails to registered users:', mailErr);
        }
      }
    }

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
