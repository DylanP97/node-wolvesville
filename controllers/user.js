const crypto = require("crypto");
const { UserModel, GuestUserModel } = require("../models/user");
const { signUpErrors, signInErrors } = require("../middleware/errors");
const {
  generateAccessToken,
  verifyAccessToken,
  defaultAvatar,
} = require("../lib/utils");
const { connectedUsers, rooms } = require("../serverStore");
const { shortName } = require("../lib/randomUsername");

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
      avatar: defaultAvatar,
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
  console.log("Login request received");
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const accessToken = await generateAccessToken(user);
    // res.cookie("accessToken", accessToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    // });
    res.status(200).json({
      message: "User logged in",
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      token: accessToken,
      isGuest: false,
    });
  } catch (err) {
    console.error(err.message);
    if (
      err.message === "incorrect password" ||
      err.message === "incorrect email"
    ) {
      return res.status(401).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.guestLogin = async (req, res) => {
  try {
    const user = await GuestUserModel.create({
      username: shortName(),
      avatar: defaultAvatar,
    });
    const accessToken = await generateAccessToken(user);
    // res.cookie("accessToken", accessToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    // });
    res.status(200).json({
      message: "User logged in",
      userId: user.id,
      username: user.username,
      avatar: defaultAvatar,
      token: accessToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

exports.logout = async (req, res) => {
  const { username, isGuest } = req.body; // Retrieve the username from the request body

  // res.clearCookie("accessToken");
  // res.cookie("accessToken", "logout", {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "None",
  //   maxAge: -1,
  // });

  if (username) {
    const user = await GuestUserModel.findOne({ username }); // Find user by username
    if (user && isGuest) {
      console.log("Guest user deleted");
      await GuestUserModel.deleteOne({ _id: user.id });
    }
  }
  res.status(200).json({ message: "Logout success" });
};

exports.checkAuth = async (req, res) => {
  console.log("checkAuth request received");

  try {
    // Ensure the Authorization header is present
    const accessToken = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <token>"

    if (!accessToken) {
      return res.status(401).json({ message: "No access token provided" });
    }
    const user = await verifyAccessToken(accessToken);
    if (!user) {
      return res.status(401).json({ message: "Invalid access token" });
    } else {
      if (connectedUsers.some((usr) => usr.token === accessToken)) {
        let userOnServer = connectedUsers.find(
          (usr) => usr.token === accessToken
        );

        let gameOnServer = null;
        if (userOnServer.isInRoom) {
          gameOnServer = rooms.find(
            (room) => room.id === userOnServer.isInRoom
          );
        }

        res.status(200).json({
          message: "Token successfully checked",
          username: user.username,
          avatar: user.avatar,
          token: accessToken,
          socketId: userOnServer.socketId,
          isGuest: userOnServer.isGuest,
          isInRoom: userOnServer.isInRoom,
          isPlaying: userOnServer.isPlaying,
          game: gameOnServer,
        });
      }
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
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await UserModel.updateOne(filter, update);

    res.status(200).json({
      message: "Modifications sauvegardées",
      username: req.body.username,
      avatar: req.body.avatar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
