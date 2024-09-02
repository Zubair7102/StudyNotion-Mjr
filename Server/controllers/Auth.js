const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const User = require("../models/User");
require("dotenv").config();
const otpGenerator = require("otp-generator");
const { mailSender } = require("../utils/mailSender");
const jwt = require("jsonwebtoken"); // for token based authentication
require("dotenv").config();

// sendOTP

exports.sendOTP = async (req, res) => {
  try {
    // fetch email from request body
    const { email } = req.body;

    // checking if the user already exits or not
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Already exits",
      });
    }

    // function to generate a arandom 6-digit OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log("OTP: ", otp);

    // check if the generated otp is unique or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    // Set expiration time for OTP (e.g., 5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // create an entry for OTP in database
    const otpDb = await OTP.create({ email, otp, expiresAt });

    console.log(otpDb);

    // send OTP to the user's email (using mailsender function)
    await mailSender(email, "Your OTP code", `<p>Your OTP is ${otp}</p>`);

    // return the response
    res.status(200).json({
      success: true,
      message: "Otp sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
    });
  }
};

// signUp
exports.signUp = async (req, res) => {
  try {
    // getting the data from the request
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      phoneNo,
      otp,
    } = req.body;

    // validate that every field is filled correctly or not
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required to filled",
      });
    }

    // match if the password and confirmPassword are same or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and ConfirmPassword does not match, please enter correctly",
      });
    }

    // check if the user already exists or not
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Already exists ",
      });
    }

    // fetch the most recent OTP stored for the user
    const recentOtp = await OTP.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    console.log("recentOtp: ", recentOtp);

    // validate the recentOtp
    if (recentOtp.length == 0) {
      // it means otp is not found
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOtp.otp) {
      // invalid OTP
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // securing the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error in encrypting(hashing)",
      });
    }

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      phoneNo: null,
    });
    // creating the entry for the new User
    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNo,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // Delete the OTP after successfully verification
    await OTP.deleteOne({ email, otpDb });

    return res.status(200).json({
      success: true,
      message: "User Registered successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error signing Up: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Error registering user",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    // extract email and password from the request body
    const { email, password } = req.body;

    // check if the email and password are provided or not
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Passsword are required ",
      });
    }

    // finding the user by the email
    const user = await User.findOne({ email });

    // checking if the user exists or not in the database
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exits please Sign Up",
      });
    }

    // comparing the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    // if the password does not match return error
    if (isMatch) {
      // creating a JWT token for the user
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.accountType },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h", //token expiry time
        }
      );
      user.token = token;
      user.password = undefined;

      const options = {
        expiresIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3 days
        httpOnly: true,
        // htpOnly means that the cookie can not be accessed at the client side
      };

      // create cookie and send response
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "User Logged in Successfully",
      });
    } else {
      // password did not matched
      return res.status(401).json({
        success: false,
        message: "Password did not matched the given email",
      });
    }
  } catch (error) {
    console.error("Error logging in: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
};

// changePassword
exports.changePassword = async (req, res) => {
  try {
    // extract user ID, current password, new password, and confirm password from the request body
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;

    // validate that all are provided or not
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // fetch the user by ID
    const user = await User.findById(userId);

    // checking if the user exists or not
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // compare the current password with the stored hashed password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    // if the current password does not match, return error
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    // Send an email notification about password change
    try {
      await mailSender(
        user.email,
        "Password Updated Successfully",
        `<p>Hello ${user.firstName},</p>
           <p>Your password has been updated successfully. If you did not initiate this change, please contact our support team immediately.</p>
           <p>Best regards,<br/>StudyNotion Team</p>`
      );
    } catch (error) {
      console.error("Error changing password: ", error.message);
      res.status(500).json({
        success: false,
        message: "Error changing password",
      });
    }

    // responding with the success message
    res.status(200).json({
      success: true,
      message: "Password change successfully",
    });
  } catch (error) {
    console.error("Error changing password: ", error.message);
    res.status(500).json({
      success: false,
      message: "Error changing password",
    });
  }
};
