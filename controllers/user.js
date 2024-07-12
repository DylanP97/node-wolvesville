const UserModel = require("../models/user");
const { signUpErrors, signInErrors } = require("../middleware/errors");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} = require("../lib/utils");
const { avatarCPUSample } = require("../lib/avatarCPUSample");
const { connectedUsers } = require("../serverStore");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.signup = async (req, res) => {
  const username = req.body.username.trim();
  const email = req.body.email.trim();
  const { password } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: "Please Input Username" });
    }
    if (!email) {
      return res.status(400).json({ message: "Please Input Email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Please Input Password" });
    }

    const existingUsername = await UserModel.findOne({ username });

    if (existingUsername) {
      return res
        .status(400)
        .json({ message: "User with this Username Already Exists" });
    }

    const existingEmail = await UserModel.findOne({ email });

    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "User with this Email Already Exists" });
    }

    const newUser = await UserModel.create({
      username,
      email,
      password: password,
      avatar: avatarCPUSample,
    });

    return res
      .status(201)
      .json({ message: "User Created Successfully", newUser });
  } catch (err) {
    console.log(err);
    const errors = signUpErrors(err);
    res.status(500).json({ errors });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const accessToken = await generateAccessToken(user);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.status(200).json({
      message: "User logged in",
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      token: accessToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("accessToken");
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: -1,
  });
  res.status(200).json({ message: "Logout success" });
};

exports.checkAuth = async (req, res) => {
  try {
    if (req.cookies) {
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        return res.status(401).json({ message: "No access token provided" });
      }
      const user = await verifyAccessToken(accessToken);
      if (!user) {
        return res.status(401).json({ message: "Invalid access token" });
      } else {
        let userOnServer = connectedUsers.find(
          (usr) => usr.token === accessToken
        );
        res.status(200).json({
          message: "Token successfully checked",
          username: user.username,
          avatar: user.avatar,
          token: req.cookies.accessToken,
          socketId: userOnServer ? userOnServer.socketId : null,
        });
      }
    } else {
      return res.status(401).json({ message: "No access token provided" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const update = {
      $set: {
        avatar: {
          accessories: req.body.avatar.accessories,
          accessoriesColor: req.body.avatar.accessoriesColor,
          clothesColor: req.body.avatar.clothesColor,
          clothing: req.body.avatar.clothing,
          clothingGraphic: req.body.avatar.clothingGraphic,
          eyebrows: req.body.avatar.eyebrows,
          eyes: req.body.avatar.eyes,
          facialHair: req.body.avatar.facialHair,
          facialHairColor: req.body.avatar.facialHairColor,
          hairColor: req.body.avatar.hairColor,
          hatColor: req.body.avatar.hatColor,
          mouth: req.body.avatar.mouth,
          size: req.body.avatar.size,
          skinColor: req.body.avatar.skinColor,
          top: req.body.avatar.top,
        },
      },
    };

    const filter = { username: req.body.username };
    const user = await UserModel.findOne(filter);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await UserModel.updateOne(filter, update);

    res.status(200).json({
      message: "Modifications effectuées",
      username: user.username,
      avatar: updatedUser.avatar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
