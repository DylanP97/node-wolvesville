const express = require("express");
const router = express.Router();
const rolesCtrl = require("../controllers/roles");

router.get("/", rolesCtrl.getRoles);
router.get("/:name", rolesCtrl.getRoleByName);

module.exports = router;
