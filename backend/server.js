import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

import eventRoutes from "./routes/eventRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("listening on port", process.env.PORT);
      console.log("Mongodb connection established");
    });
  })
  .catch((error) => {
    console.log(error);
  });


// Default route (for sanity check)
app.get("/", (req, res) => {
  res.send("KLH Smart Campus API is running...");
});

// Use routes
app.use("/api/events", eventRoutes);
app.use("/api/clubs", clubRoutes);