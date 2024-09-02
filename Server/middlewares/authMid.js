// creating three middleware for auth isStudent isInstructor, isAdmin
const jwt = require("jsonwebtoken");
require("dotenv").config();

// auth
exports.auth = (req, res, next) =>{
    try{
        // extract jw token
        const token = req.body.token;
        // if token is not found 
        if(!token)
        {
            return res.status(401).json({
                success: false,
                message: "Token Missing",
            });
        }

        // verify the token 
        try{
            // verify function takes two parameters one token and the secret key that is JWT_SECRET
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        }
        catch(error)
        {
            return res.status(400).json({
                success: false,
                message: "token is invalid",
            })    
        }

        next();
    }
    catch(error)
    {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while verifying the token'
        })
    }
}


// isStudent
exports.isStudent = (req, res, next)=>{
    
}


// isInstructor


// isAdmin