import mongoose from "mongoose";

// Vote schema to store the votes for each option in a poll
const voteSchema = new mongoose.Schema(
  {
    // Explain this line below:
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    _id: false, // Disable the automatic generation of an _id field for the vote subdocument
  },
);
