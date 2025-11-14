import express from "express";
import { createEvent, getAllEvents, getEventsByClub, updateEvent, deleteEvent, subscribeEvent, unsubscribeEvent } from "../controllers/eventController.js";
import { verifyToken } from "../utils/passportConfig.js";

const router = express.Router();

router.post("/", createEvent);
router.get("/", getAllEvents);
router.get("/club/:clubId", getEventsByClub);
router.post("/:id/subscribe", verifyToken, subscribeEvent);
router.post("/:id/unsubscribe", verifyToken, unsubscribeEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent); 

export default router;
