const mongoose = require("mongoose");
const AuthDB = require("../model/auth");

const userController = {
  // Lấy ra danh sách tất cả người dùng từ AuthDB
  getUser: async (req, res) => {
    try {
      const myId = req.params.myId;

      const users = await AuthDB.aggregate([
        // Lọc ra tất cả người dùng khác myId
        {
          $match: { userId: { $ne: myId } },
        },

        // Lookup vào bảng messages để lấy tin nhắn cuối cùng giữa myId và otherId
        {
          $lookup: {
            from: "messages",
            let: { otherId: "$userId" }, // Id của người khác
            pipeline: [
              {
                // Lọc message liên quan đến myId và otherId
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$senderId", "$$otherId"] },
                          { $eq: ["$receiverId", myId] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$senderId", myId] },
                          { $eq: ["$receiverId", "$$otherId"] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
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
          $lookup: {
            from: "auths",
            localField: "lastMessage.senderId",
            foreignField: "userId",
            as: "lastSenderUser",
          },
        },
        {
          $unwind: {
            path: "$lastSenderUser",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Thêm field xác định lastmessage
        {
          $addFields: {
            lastMessageType: {
              $switch: {
                branches: [
                  {
                    case: {
                      $gt: [
                        { $size: { $ifNull: ["$lastMessage.images", []] } },
                        0,
                      ],
                    },
                    then: "image",
                  },
                  {
                    case: {
                      $gt: [
                        { $size: { $ifNull: ["$lastMessage.reactions", []] } },
                        0,
                      ],
                    },
                    then: "reaction",
                  },
                  {
                    case: { $ne: ["$lastMessage.text", ""] },
                    then: "text",
                  },
                ],
                default: "none",
              },
            },
          },
        },

        // Chỉ lấy thông tin cần thiết
        {
          $project: {
            userId: "$userId",
            username: "$username",
            email: "$email",
            image: "$image",
            lastMessage: "$lastMessage.text",
            lastMessageTime: "$lastMessage.createdAt",
            lastSenderId: "$lastMessage.senderId",
            lastMessageId: "$lastMessage._id",
            lastMessageImgFile: "$lastMessage.images",
            lastMessageReactions: "$lastMessage.reactions",
            lastSenderName: "$lastSenderUser.username",
            lastMessageType: 1,
            isReaded: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$lastMessage.receiverId", myId] },
                    { $eq: ["$lastMessage.isReaded", false] },
                  ],
                },
                then: false,
                else: true,
              },
            },
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
