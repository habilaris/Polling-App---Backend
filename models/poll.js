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

const pollSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["single", "yesno", "rating", "image", "open"],
      required: true,
    },

    options: [
      {
        text: String,
        image: String,
      },
    ],
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    closed: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    votes: [voteSchema],
  },
  {
    timestamps: true,
  },
);

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);
export default Poll;
