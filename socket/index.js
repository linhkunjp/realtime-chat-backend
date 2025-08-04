const Message = require("../model/message");

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected: ", socket.id);

    socket.on("join", (userId) => {
      // Thêm socket vào room theo userId
      socket.join(userId);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
      // Lưu vào mongodb
      const newMessage = new Message({ senderId, receiverId, text });
      await newMessage.save();

      // Gửi tin nhắn cho người nhận
      io.to(receiverId).emit("receiveMessage", newMessage);

      // Cập nhật lại lastMessage
      const lastMessage = {
        text: newMessage.text,
        senderId,
        receiverId,
        createdAt: newMessage.createdAt,
      };

      io.to(senderId).emit("lastMessageUpdate", lastMessage);
      io.to(receiverId).emit("lastMessageUpdate", lastMessage);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected: ", socket.id);
    });
  });
};

module.exports = initSocket;
