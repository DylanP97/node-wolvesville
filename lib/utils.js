exports.getCurrentTime = () => {
  const currentDate = new Date();

  const options = {
    // year: '2-digit',
    // month: '2-digit',
    // day: '2-digit',
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formattedDateTime = currentDate.toLocaleString("en-US", options);
  return formattedDateTime;
};

const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

exports.generateAccessToken = async (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET);
};

exports.verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null; // Return null if token verification fails
  }
};
