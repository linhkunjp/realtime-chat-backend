const Message = require("../model/message");
const AuthDB = require("../model/auth");
const onlineUsers = new Map();

const resolveUsername = async (userId) => {
  const info = onlineUsers.get(userId);
  if (info && info.username) return info.username;
  const user = await AuthDB.findOne({ userId }).select("username").lean();
  return user?.username || "";
};

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("join", (payload) => {
      try {
        let userId, username;
        if (payload && typeof payload === "object" && payload.userId) {
          userId = payload.userId;
          username = payload.username;
        } else {
          userId = payload;
        }
        if (!userId) return;

        const entry = onlineUsers.get(userId);
        if (entry) {
          entry.sockets.add(socket.id);
          if (username) entry.username = username;
        } else {
          onlineUsers.set(userId, {
            sockets: new Set([socket.id]),
            username: username || undefined,
          });
        }

        socket.join(userId);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      } catch (err) {
        console.error("join error", err);
      }
    });

    socket.on("sendMessage", async (msg) => {
      try {
        const { tempId, senderId, receiverId, text, images } = msg;

        const newMessage = new Message({
          senderId,
          receiverId,
          text,
          images,
          isReaded: false,
        });
        await newMessage.save();

        const emitMsg = { ...newMessage.toObject(), tempId };

        // Gửi cho receiver và sender
        io.to(receiverId).emit("receiveMessage", emitMsg);
        io.to(senderId).emit("receiveMessage", emitMsg);

        const reactorName = await resolveUsername(senderId);

        const lastMessage = {
          messageId: newMessage._id,
          text: newMessage.text,
          images: newMessage.images,
          senderId,
          receiverId,
          senderName: reactorName,
          createdAt: newMessage.createdAt,
          type:
            newMessage.images.length > 0
              ? "image"
              : newMessage.text
              ? "text"
              : "reaction",
          isReaded: false,
        };
        io.to(senderId).emit("lastMessageUpdate", lastMessage);
        io.to(receiverId).emit("lastMessageUpdate", lastMessage);
      } catch (err) {
        console.error("sendMessage error", err);
      }
    });

    // Đánh dấu đã đọc
    socket.on("markAsRead", async ({ myId, otherId }) => {
      try {
        await Message.updateMany(
          { senderId: otherId, receiverId: myId, isReaded: false },
          { $set: { isReaded: true } }
        );

        // Người đọc
        io.to(myId).emit("messagesRead", {
          readerId: myId,
          conversationWith: otherId,
        });

        // Người gửi
        io.to(otherId).emit("messagesRead", {
          readerId: myId,
          conversationWith: otherId,
        });
      } catch (err) {
        console.error("markAsRead error:", err);
      }
    });

    socket.on("addReaction", async ({ messageId, userId, type }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find((r) => r.userId === userId);
        if (existing) {
          existing.type = type;
        } else {
          message.reactions.push({ userId, type });
        }

        await message.save();

        // Emit update tới cả sender và receiver
        const payload = {
          messageId: message._id,
          reactions: message.reactions,
        };
        io.to(message.senderId).emit("reactionUpdate", payload);
        io.to(message.receiverId).emit("reactionUpdate", payload);

        const reactorName = await resolveUsername(userId);

        // Emit thêm lastMessageUpdate
        const lastMessageInit = {
          messageId: message._id,
          text: message.text,
          images: message.images,
          reactions: message.reactions,
          senderId: userId,
          senderName: reactorName,
          receiverId:
            message.senderId === userId ? message.receiverId : message.senderId,
          createdAt: message.updatedAt || new Date(),
          type: "reaction",
          isReaded: message.isReaded,
        };
        const participants = [message.senderId, message.receiverId];
        for (const pid of participants) {
          const lastMessage = {
            ...lastMessageInit,
            isReaded: pid === userId ? true : false,
          };
          io.to(pid).emit("lastMessageUpdate", lastMessage);
        }
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

        const payload = {
          messageId: message._id,
          reactions: message.reactions,
        };
        io.to(message.senderId).emit("reactionUpdate", payload);
        io.to(message.receiverId).emit("reactionUpdate", payload);
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
      for (const [uid, info] of onlineUsers.entries()) {
        if (info.sockets.has(socket.id)) {
          info.sockets.delete(socket.id);
          if (info.sockets.size === 0) onlineUsers.delete(uid);
          break;
        }
      }
      // Danh sách online mới
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initSocket;
