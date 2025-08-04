const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const uri = process.env.MONGODB_URI;

// Hàm kết nối MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(uri, {
      dbName: "RealtimeChat",
    });
    console.log("Kết nối thành công tới MongoDB");
  } catch (error) {
    console.error("Lỗi khi kết nối tới MongoDB:", error);
  }
}

module.exports = connectToMongoDB;
