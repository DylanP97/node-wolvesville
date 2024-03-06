const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.put("/editProfile", userCtrl.editProfile);
router.get("/users", userCtrl.getUsers);

module.exports = router;
