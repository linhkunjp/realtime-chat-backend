const AuthDB = require("../model/auth");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Tạo token
const createToken = (user) => {
  // Mã hóa thông tin user thành token
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const authController = {
  // Đăng kí
  registerUser: async (req, res) => {
    const { username, email, password } = req.body;

    try {
      const existingUser = await AuthDB.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          isSuccess: false,
          message: "Email đã tồn tại",
        });
      }

      // tạo user mưới
      const user = new AuthDB({ username, email, password });
      await user.save();
      const userId = user._id.toString();

      res.json({
        isSuccess: true,
        user_id: userId,
        email: user.email,
        username: user.username,
        message: "Đăng ký thành công",
        token: createToken(user),
      });
    } catch (err) {
      res.status(400).json({
        isSuccess: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
      });
    }
  },

  // Đăng nhập
  loginUser: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await AuthDB.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ isSuccess: false, message: "Tài khoản không tồn tại" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ isSuccess: false, message: "Sai mật khẩu" });
      }

      const userId = user._id.toString();

      res.json({
        isSuccess: true,
        user_id: userId,
        email: user.email,
        username: user.username,
        message: "Đăng nhập thành công",
        token: createToken(user),
      });
    } catch (err) {
      res.status(500).json({
        isSuccess: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
      });
    }
  },
};

module.exports = authController;
