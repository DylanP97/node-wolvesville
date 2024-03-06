const UserModel = require("../models/user");
const { signUpErrors, signInErrors } = require("../middleware/errors");

exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

exports.signup = async (req, res) => {
  const username = req.body.username.trim();
  const email = req.body.email.trim();
  const { password } = req.body;
  const defaultAvatar = req.body.defaultAvatar;

  try {
    await UserModel.create({ username, email, password, avatar: defaultAvatar });
    res.status(201).json({ message: "Utilisateur créé !" });
  } catch (err) {
    console.log(err)
    const errors = signUpErrors(err);
    res.status(500).json({ errors });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    res.status(200).json({ message: "Utilisateur log", username: user.username, avatar: user.avatar });
  } catch (err) {
    console.log(err)
    const errors = signInErrors(err);
    res.status(500).json({ errors });
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
