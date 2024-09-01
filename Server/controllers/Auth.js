const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const User = require("../models/User");
require("dotenv").config();
const otpGenerator = require("otp-generator");
const { mailSender } = require("../utils/mailSender");

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
    const otpBody = await OTP.create({email, otp, expiresAt});

    console.log(otpBody);

    // send OTP to the user's email (using mailsender function)
    await mailSender(email, "Your OTP code", `<p>Your OTP is ${otp}</p>`);

    // return the response 
    res.status(200).json({
        success: true,
        message: "Otp sent successfully",
    })

  } 
  
  catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({
        success: false,
        message: "Error sending OTP"
    })
  }
};

// signUp
exports.signUp = async (req, res) =>{
    try{
        // getting the data from the request
        const {firstName, lastName, email, password, accountType} = req.body;

        // validate the OTP
        const otpRecord = await OTP.findOne({email, otpBody});

        // checking if the OTP is Valid and not expired
        if(!otpRecord || otpRecord.expiresAt < new Date())
        {
            return res.status(400).json({
                success: true, 
                message: "Invalid or Expired OTP"
            })
        }

        // check if the user already exists or not 
        const existingUser = await User.findOne({email});

        if(existingUser)
        {
            return res.status(400).json({
                success: false,
                message: "User Already exists ",
            })
        }

        // securing the password
        let hashedPassword;
        try{
            hashedPassword = await bcrypt.hash(password, 10);
        }
        catch(error)
        {
            return res.status(500).json({
                success: false,
                message: 'Error in encrypting(hashing)'
            });
        }

        // creating the entry for the new User
        const user = User.create({
            firstName, lastName, email, password:hashedPassword, accountType
        })

        // Delete the OTP after successfully verification
        await OTP.deleteOne({email, otpBody})

        res.status(200).json({
            success: true,
            message: "User Registered successfully",
            user: user,
        })

    }
    catch(error)
    {
        console.error("Error signing Up: ", error.message);
        res.status(500).json({
            success: false,
            message: "Error registering user",
        })
    }
}
// Login

// changePassword
