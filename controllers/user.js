const UserModel = require("../models/user");
const { signUpErrors, signInErrors } = require("../middleware/errors");

exports.signup = async (req, res) => {
  console.log(req.body)
  const username = req.body.username.trim();
  const email = req.body.email.trim();
  const { password } = req.body;

  try {
    await UserModel.create({ username, email, password });
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
    res.status(200).json({ message: "Utilisateur log", username: user.username });
  } catch (err) {
    console.log(err)
    const errors = signInErrors(err);
    res.status(500).json({ errors });
  }
};
