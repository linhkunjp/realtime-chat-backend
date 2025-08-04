const mongoose = require("mongoose");
const AuthDB = require("../model/auth");

const userController = {
  // Lấy ra danh sách tất cả người dùng từ AuthDB
  getUser: async (req, res) => {
    try {
      // Chuyển param từ string sang ObjectId để so sánh
      const myId = new mongoose.Types.ObjectId(req.params.myId);

      const users = await AuthDB.aggregate([
        // Lọc ra tất cả người dùng khác myId
        {
          $match: { _id: { $ne: myId } },
        },

        // Lookup vào bảng messages để lấy tin nhắn cuối cùng giữa myId và otherId
        {
          $lookup: {
            from: "messages",
            let: { otherId: "$_id" }, // Id của người khác
            pipeline: [
              {
                // Lọc message liên quan đến myId và otherId
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: [{ $toObjectId: "$senderId" }, "$$otherId"],
                          },
                          { $eq: [{ $toObjectId: "$receiverId" }, myId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: [{ $toObjectId: "$senderId" }, myId] },
                          {
                            $eq: [{ $toObjectId: "$receiverId" }, "$$otherId"],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } }, // Sắp xếp theo thời gian giảm dần
              { $limit: 1 }, // Lấy 1 tin nhắn mới nhất
            ],
            as: "lastMessage",
          },
        },
        // Unwind để biến mảng lastMessage thành object
        {
          $unwind: {
            path: "$lastMessage",
            preserveNullAndEmptyArrays: true, // Cho phép hiển thị khi chưa có message
          },
        },
        {
          $project: {
            userId: "$_id",
            username: "$username",
            email: "$email",
            lastMessage: "$lastMessage.text",
            lastMessageTime: "$lastMessage.createdAt",
          },
        },
        { $sort: { lastMessageTime: -1 } },
      ]);

      res.status(200).json({
        isSuccess: true,
        results: users,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      res.status(500).json({
        isSuccess: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
      });
    }
  },
};

module.exports = userController;
