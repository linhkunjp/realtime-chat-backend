const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // Mã hóa mật khẩu

const AuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: false },
});

// Xử lý mã hóa mật khẩu
AuthSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//  So sánh mật khẩu khi đăng nhập
AuthSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const AuthDB = mongoose.model("Auth", AuthSchema);

module.exports = AuthDB;
