const mongoose = require("mongoose");
const { mailSender } = require("../utils/mailSender");
const emailTemplate = require("../mail/emailVerificationTemplate")

const otpSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        trim: true,
    },
    otp:{
        type: String,
        required: true,
        trim: true,
    },
    createdAt:{
        type: Date,
        // This specifies that the createdAt field will store a date value. In MongoDB, dates are stored as ISODate objects, which include both date and time.

        default: Date.now,
        // This sets the default value for the createdAt field to the current date and time when the document is created.
        expires: 5*60,
    }

})

// function to send email
async function sendVerificationEmail(email, otp){
    try{
        const mailResponse = await mailSender(email, "Verification Email from StudyNotion",emailTemplate(otp));
        console.log("Email sent successfully: ", mailResponse.response);
        }
    catch(error)
    {
        console.log("error occured while sending mails: ", error);
        throw error;
    }
}

// The next function is a part of Mongoose middleware and is used to control the flow of middleware execution. When you define a middleware function, such as pre hooks for Mongoose models, you need to call next() to proceed to the next middleware or the actual operation (e.g., saving the document).
otpSchema.pre("save", async function(next) {
    // OTPSchema.pre("save", async function(next) { ... }):
    // This line sets up a pre-save middleware on the OTP schema. A "pre-save" hook means this function will run before the document is saved to the database.

    // Only send an email when a new document is created
    if(this.isNew){
    await sendVerificationEmail(this.email, this.otp);
    }
    next();
    // Calling next() signals Mongoose to proceed with the next middleware or to complete the save operation.
    //  The next() function is essential for controlling the flow within middleware. Without it, Mongoose would not know when to continue, causing the operation to hang.
})



module.exports = mongoose.model("OTP", otpSchema);