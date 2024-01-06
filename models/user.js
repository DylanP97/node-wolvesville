const { isEmail } = require("validator");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: 2,
    maxLength: 55,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    validate: isEmail,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
  let hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      console.log("log with correct password");
      return user;
    } else {
      throw Error("incorrect password");
    }
  } else {
    throw Error("incorrect email");
  }
};

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
