const express = require("express");
const router = express.Router();

const {signUp, login, changePassword, sendOTP} = require("../controllers/Auth");

const {requestPasswordReset, resetPassword} = require("../controllers/ResetPassword");

const {auth} = require("../middlewares/authMid");


// Routes for Login, SignUp, Authentication
// Route for user Login
router.post("/login", login);

// Route for user SignUp
router.post("/signup", signUp);

// Route for Sending OTP 
router.post("/sendotp", sendOTP);

// route for changing the password 
router.post("/changepassword", changePassword);


// Reset Password

// route for generating a reset password token
router.post("/request-password-reset", requestPasswordReset);

// route for resetting password (after verification)
router.post("/reset-password", resetPassword);




module.exports = router;