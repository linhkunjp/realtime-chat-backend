const AuthDB = require("../model/auth");

const authController = {
  // Lưu tài khoản vào mongo
  saveUserToMongo: async (req, res) => {
    const { username, email, image, userId } = req.body;

    try {
      const existingUser = await AuthDB.findOne({ userId: req.params.id });
      if (existingUser) {
        return res.status(400).json({
          isSuccess: false,
          message: "Tài khoản đã tồn tại",
        });
      }

      // Tạo user mới
      const user = new AuthDB({ username, email, userId, image });
      await user.save();

      res.status(200).json({
        isSuccess: true,
        results: user,
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({
        isSuccess: false,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
      });
    }
  },
};

module.exports = authController;
