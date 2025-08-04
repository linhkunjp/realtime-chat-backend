const router = require("express").Router();
const authController = require("../controllers/authController");
const chatController = require("../controllers/chatController");
const userController = require("../controllers/userController");

// Register
router.post("/auth/register", authController.registerUser);

// Login
router.post("/auth/login", authController.loginUser);

// Get chat detail
router.get("/chat/detail/:senderId/:receiverId", chatController.getChatDetail);

// Create conversation
router.post("/chat", chatController.createConversation);

// Get chat list
router.get("/chat/list/:myId", userController.getUser);

module.exports = router;
