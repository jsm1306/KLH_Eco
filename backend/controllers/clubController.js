import Club from "../models/Club.js";
import User from "../models/User.js";

// Create a new club
export const createClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = new Club({ name, description });
    await club.save();
    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add member to club
export const addMemberToClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId, role } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    club.members.push({ user: userId, role });
    await club.save();

    res.json({ message: "Member added successfully", club });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete member from club
export const deleteMemberFromClub = async (req, res) => {
  try {
    const { clubId, userId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const memberIndex = club.members.findIndex(
      (m) => m.user.toString() === userId
    );
    if (memberIndex === -1)
      return res.status(404).json({ message: "Member not found in this club" });

    // Remove member
    club.members.splice(memberIndex, 1);
    await club.save();

    res.json({ message: "Member removed successfully", club });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all clubs
export const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find().populate("members.user", "name email role");
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single club with events
export const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("members.user", "name role")
      .populate("events");
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
