// resetPasswordToken
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");

// request password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const email = req.body.email;

    // Check if the user exists
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Update user by adding token and expiration time
    const updateDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: resetToken,
        resetPasswordExpires: Date.now() + 3600000, // 1 hour
      },
      { new: true }
    );
    console.log("DETAILS", updateDetails);

    // Create reset password URL
    const resetUrl = `http://localhost:3000/update-password/${resetToken}`;

    // Send mail
    await mailSender(
      email,
      "Password Reset",
      `<p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } 
  catch (error) {
    console.error("Error in password reset request:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in sending password reset link",
    });
  }
};

// resetPassword
exports.resetPassword = async (req, res)=>{
    try{
        const {token, newPassword, confirmPassword} = req.body;

        // check if the new password and confirm password match
        if(newPassword !== confirmPassword)
        {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
              });
        }

        // get user detail from db using token
        const userDetails = await User.findOne({token: token});
        // if no entry - invalid token
        if(!userDetails)
        {
            return res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        }

        // token time check
        if(userDetails.resetPasswordExpires < Date.now())
        {
            return res.status(403).json({
                success: false,
                message: "Token is expired",
            });
        }

        // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // password update
    await User.findOneAndUpdate({token: token},
        {password: hashedPassword},
        {new:true},
        // Without { new: true }:// The function would return the user's document as it was before the password was updated.
        // With { new: true }:
        // The function returns the user's document with the updated password. This can be useful if you want to confirm that the update has been applied correctly or if you need the updated state for further processing.

    );
    // Return success response
    res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    }
    catch(error)
    {
        console.error("Error resetting password:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
    }
}