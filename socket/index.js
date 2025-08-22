const Message = require("../model/message");

const onlineUsers = new Map();

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("join", (userId) => {
      // Thêm vào danh sách online
      onlineUsers.set(userId, socket.id);
      socket.join(userId);

      // Gửi danh sách online mới
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
      const newMessage = new Message({ senderId, receiverId, text });
      await newMessage.save();

      io.to(receiverId).emit("receiveMessage", newMessage);

      const lastMessage = {
        text: newMessage.text,
        senderId,
        receiverId,
        createdAt: newMessage.createdAt,
      };

      io.to(senderId).emit("lastMessageUpdate", lastMessage);
      io.to(receiverId).emit("lastMessageUpdate", lastMessage);
    });

    socket.on("addReaction", async ({ messageId, userId, type }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Update nếu đã reaction trước đó
        const existing = message.reactions.find((r) => r.userId === userId);
        if (existing) {
          existing.type = type;
        } else {
          message.reactions.push({ userId, type });
        }

        await message.save();

        // Emit update tới cả sender và receiver
        io.to(message.senderId).emit("reactionUpdate", {
          messageId: message._id,
          reactions: message.reactions,
        });
        io.to(message.receiverId).emit("reactionUpdate", {
          messageId: message._id,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error("❌ Error in addReaction:", err);
      }
    });

    socket.on("removeReaction", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.reactions = message.reactions.filter(
          (r) => r.userId !== userId
        );
        await message.save();

        io.to(message.senderId).emit("reactionUpdate", {
          messageId: message._id,
          reactions: message.reactions,
        });
        io.to(message.receiverId).emit("reactionUpdate", {
          messageId: message._id,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error("❌ Error in removeReaction:", err);
      }
    });

    socket.on("reactionUpdate", ({ messageId, reactions }) => {
      const msg = this.messages.find((m) => m._id === messageId);
      if (msg) {
        msg.reactions = reactions;
      }
    });

    socket.on("disconnect", () => {
      // Xóa user khỏi danh sách online
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      // Danh sách online mới
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initSocket;
