// resetPasswordToken
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const {mailSender} = require("../utils/mailSender");

// request password Reset
exports.requestPasswordReset = async (req, res)=>{
    try{
        const {email} = req.body;

        // check if the user exits
        const user = await User.findOne({email});
        if(!user)
        {
            return res.status(404).json({
                success: false,
                message: "User not Found",
            });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // set token expiration time (eg 1hr)
        const resetTokenExpires = Date.now() + 3600000;

        // store the token and expiration in the user's record
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;

        await user.save();

        // create reset password URL
        
    }
    catch(error)
    {

    }
}

// resetPassword