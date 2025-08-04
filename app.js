const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const chatRoute = require("./routes/chat");
const connectToMongoDB = require("./services/dbConnect");
const initSocket = require("./socket/index");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Kết nối MongoDB
connectToMongoDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/v1", chatRoute);

initSocket(io);

server.listen(5000, () => {
  console.log("Server is running");
});
