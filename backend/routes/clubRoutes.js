import express from "express";
import {
  createClub,
  addMemberToClub,
  deleteMemberFromClub,
  getClubs,
  getClubById,
} from "../controllers/clubController.js";

const router = express.Router();

// Club CRUD routes
router.post("/", createClub); // create new club
router.get("/", getClubs); // get all clubs
router.get("/:id", getClubById); // get single club with details

// Member management routes
router.post("/:clubId/members", addMemberToClub); // add member
router.delete("/:clubId/members/:userId", deleteMemberFromClub); // delete member
// routes/clubRoutes.js
router.post("/:clubId/interest/:userId", express.json(), async (req, res) => {
  try {
    const { clubId, userId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    if (!club.interestedUsers.includes(userId)) {
      club.interestedUsers.push(userId);
      await club.save();
    }

    res.status(200).json({ message: "Interest registered successfully", club });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;
