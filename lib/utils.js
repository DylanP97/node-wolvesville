
exports.getCurrentTime = (gameStartTime) => {
  if (!gameStartTime) {
    return "00:00";
  }
  
  const currentTime = Date.now();
  const elapsedMs = currentTime - gameStartTime;
  
  // Convert to seconds
  const totalSeconds = Math.floor(elapsedMs / 1000);
  
  // Calculate minutes and seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Format as MM:SS
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

const jwt = require("jsonwebtoken");
const { GuestUserModel, UserModel } = require("../models/user");

exports.generateAccessToken = async (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });
};

exports.verifyAccessToken = async (
  token
) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    let user = null;
    user = await UserModel.findById(decoded.userId);
    if (!user) {
      console.log("User not found in UserModel");
      user = await GuestUserModel.findById(decoded.userId);
      if (!user) {
        console.log("User not found also in GuestUserModel");
        return null;
      }
    }

    return user;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null; // Return null if token verification fails
  }
};

exports.defaultAvatar = {
  accessories: [null],
  accessoriesColor: [null],
  accessoriesProbability: 100,
  backgroundColor: ["65c9ff"],
  backgroundType: ["solid"],
  clothesColor: ["262e33"],
  clothing: ["graphicShirt"],
  clothingGraphic: [null],
  eyebrows: ["default"],
  eyes: ["default"],
  facialHair: [null],
  facialHairColor: [null],
  facialHairProbability: 100,
  hairColor: ["4a312c"],
  hatColor: [null],
  mouth: ["default"],
  size: 64,
  skinColor: ["ffdbb4"],
  top: ["shortRound"],
  topProbability: 100,
};
