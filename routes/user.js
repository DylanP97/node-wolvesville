const express = require("express");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const router = express.Router();
const userCtrl = require("../controllers/user");
const { generateAccessToken } = require("../lib/utils");

// Rate limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for guest login (more lenient)
const guestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 guest logins per minute
  message: { error: "Too many guest logins. Please wait a moment." },
});

router.post("/signup", authLimiter, userCtrl.signup);
router.post("/login", authLimiter, userCtrl.login);
router.post("/guestLogin", guestLimiter, userCtrl.guestLogin);
router.post("/logout", userCtrl.logout);
router.get("/getAllUsers", userCtrl.getAllUsers);
router.put("/editProfile", userCtrl.editProfile);
router.get("/checkAuth", userCtrl.checkAuth);

// ==================== GOOGLE OAUTH ROUTES ====================

// Initiate Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.CLIENT_URL + "/connexion?error=oauth_failed"
  }),
  async (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const accessToken = await generateAccessToken(req.user);

      // Redirect to frontend with token
      res.redirect(
        `${process.env.CLIENT_URL}/connexion?token=${accessToken}&username=${encodeURIComponent(req.user.username)}&userId=${req.user.id}`
      );
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(process.env.CLIENT_URL + "/connexion?error=token_generation_failed");
    }
  }
);

module.exports = router;
