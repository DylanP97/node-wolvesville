const UserModel = require("../models/user");
const { signUpErrors, signInErrors } = require("../middleware/errors");

exports.signup = async (req, res) => {
  console.log(req.body)
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
  console.log(req.body);

  try {
    const filter = { username: req.body.username };
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

    const user = await UserModel.findOne(filter);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await UserModel.updateOne(filter, update);

    if (updatedUser.nModified > 0) {
      res.status(200).json({
        message: "Utilisateur modifié !",
        username: user.username,
        avatar: update.$set.avatar,
      });
    } else {
      res.status(200).json({
        message: "Aucune modification nécessaire",
        username: user.username,
        avatar: user.avatar,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: err.message });
  }
};
