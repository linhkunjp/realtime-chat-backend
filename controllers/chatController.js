const Message = require("../model/message");
const dotenv = require("dotenv");
dotenv.config();

const chatController = {
  // Get chat detail
  getChatDetail: async (req, res) => {
    const { senderId, receiverId } = req.params;

    try {
      const messages = await Message.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      }).sort({ createdAt: 1 });

      res.json({
        isSuccess: true,
        messages: messages,
      });
    } catch (err) {
      res.status(500).json({
        isSuccess: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
      });
    }
  },
};

module.exports = chatController;
