const nodemailer = require("nodemailer");
const OTP = require("./models/OTP")
require("dotenv").config();

 exports.mailSender = async(email, title, body)=> {
    try{
        // transporter
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })

        // send mail function
        let info = await transporter.sendMail({
            from: `"StudyNotion" - by Zubair`,
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,

        })
        console.log("info", info);
        return info;

    }
    catch(error)
    {
        console.log(error.message);
    }
}
