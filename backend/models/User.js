import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["Student", "Faculty", "Admin", "President", "Vice President", "Treasurer", "Technical Lead", "Drafting"],
    // default: "Student",
  },
});

const User = mongoose.model("User", userSchema);
export default User;
