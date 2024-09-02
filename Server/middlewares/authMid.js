// creating three middleware for auth isStudent isInstructor, isAdmin
const jwt = require("jsonwebtoken");
require("dotenv").config();
const user = require("../models/User");

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
    try{
        if(req.user.accountType !== "Student")
        {
            return res.status(401).json({
                success: false,
                message: "This is Protected routes for Srudents"
            })
        }
        next();
    }
    catch(error)
    {
        return res.status(500).json({
            success: false,
            message: "User Role is not matching",
        })
    }
}


// isInstructor
exports.isInstructor = (req, res, next)=>{
    try{
        if(req.user.accountType !== "Instructor")
        {
            return res.status(401).json({
                success: false,
                message: "This is Protected routes for Instructors"
            })
        }
        next();
    }
    catch(error)
    {
        return res.status(500).json({
            success: false,
            message: "User Role is not matching",
        })
    }
}


// isAdmin
exports.isAdmin = (req, res, next)=>{
    try{
        if(req.user.accountType !== "Admin")
        {
            return res.status(401).json({
                success: false,
                message: "This is Protected routes for Admin"
            })
        }
        next();
    }
    catch(error)
    {
        return res.status(500).json({
            success: false,
            message: "User Role is not matching",
        })
    }
}