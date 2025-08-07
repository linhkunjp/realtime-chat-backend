const mongoose = require("mongoose");

const AuthSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  image: { type: String, required: true },
});

const AuthDB = mongoose.model("Auth", AuthSchema);

module.exports = AuthDB;
