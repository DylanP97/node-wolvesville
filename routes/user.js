const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.get("/logout", userCtrl.logout);
router.put("/editProfile", userCtrl.editProfile);
router.get("/users", userCtrl.getUsers);
router.get("/checkAuth", userCtrl.checkAuth);

module.exports = router;
