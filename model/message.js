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
    text: { type: String, required: true },
    reactions: [
      {
        userId: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
