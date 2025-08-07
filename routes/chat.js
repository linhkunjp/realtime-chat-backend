const router = require("express").Router();
const authController = require("../controllers/authController");
const chatController = require("../controllers/chatController");
const userController = require("../controllers/userController");

// Save user clerk to mongodb
router.post("/auth/users", authController.saveUserToMongo);

// Get chat detail
router.get("/chat/detail/:senderId/:receiverId", chatController.getChatDetail);

// Create conversation
router.post("/chat", chatController.createConversation);

// Get chat list
router.get("/chat/list/:myId", userController.getUser);

module.exports = router;
