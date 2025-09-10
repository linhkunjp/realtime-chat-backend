const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      ref: "AuthDB",
      required: true,
    },
    receiverId: {
      type: String,
      ref: "AuthDB",
      required: true,
    },
    text: { type: String },
    images: [{ type: String }],
    reactions: [
      {
        userId: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    isReaded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
