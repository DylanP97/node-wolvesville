const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.post("/guestLogin", userCtrl.guestLogin);
router.get("/logout", userCtrl.logout);
router.get("/getAllUsers", userCtrl.getAllUsers);
router.put("/editProfile", userCtrl.editProfile);
router.get("/checkAuth", userCtrl.checkAuth);

module.exports = router;
