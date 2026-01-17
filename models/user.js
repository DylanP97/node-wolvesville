const { isEmail } = require("validator");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
    required: function() {
      // Password required only if not using OAuth
      return !this.googleId;
    },
    maxLength: 250,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined values while maintaining uniqueness
  },
  avatar: {
    type: Object,
  },
  isDev: { type: Boolean, default: false },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Number,
  },
});

const guestUserSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: 2,
    maxLength: 55,
    required: true,
  },
  avatar: {
    type: Object,
  },
});

let passwordRegExp = new RegExp(
  "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{6,100}$"
);

userSchema.pre("save", async function (next) {
  // Skip password hashing for Google OAuth users (they don't have passwords)
  if (this.googleId && !this.password) {
    return next();
  }

  // Only hash if password is modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  if (passwordRegExp.test(this.password)) {
    let hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  } else {
    throw Error("incorrect password");
  }
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    } else {
      throw Error("incorrect password");
    }
  } else {
    throw Error("no user found");
  }
};

const UserModel = mongoose.model("user", userSchema);
const GuestUserModel = mongoose.model("guestUser", guestUserSchema);

module.exports = {
  UserModel,
  GuestUserModel
};