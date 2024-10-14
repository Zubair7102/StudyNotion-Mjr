// creating three middleware for auth isStudent isInstructor, isAdmin
const jwt = require("jsonwebtoken");
require("dotenv").config();
const user = require("../models/User");

// auth
exports.auth = async (req, res, next) =>{
    try {
		// Extracting JWT from request cookies, body or header
		const token =
			req.cookies.token ||
			req.body.token ||
			req.header("Authorization").replace("Bearer ", "");

		// If JWT is missing, return 401 Unauthorized response
		if (!token) {
			return res.status(401).json({ success: false, message: `Token Missing` });
		}

		try {
			// Verifying the JWT using the secret key stored in environment variables
			const decode = jwt.verify(token, process.env.JWT_SECRET);
            // jwt.verify(token, process.env.JWT_SECRET): This line attempts to verify the token using the secret key stored in the environment variable (JWT_SECRET).
			console.log(decode);
            // decode: If the token is valid, the decode variable will store the decoded information (payload) from the JWT. This usually contains user information like id, email, or role.
			// Storing the decoded JWT payload in the request object for further use
			req.user = decode;
            // req.user = decode: The decoded token data (e.g., user ID, email, etc.) is attached to the request object (req.user). This allows the next middleware or route handler to access the user's information.
            // By attaching req.user, we ensure that the decoded data (like the user's ID) can be accessed in future middleware or route handlers without needing to decode the token again.
		} catch (error) {
			// If JWT verification fails, return 401 Unauthorized response
			return res
				.status(401)
				.json({ success: false, message: "token is invalid" });
		}

		// If JWT is valid, move on to the next middleware or request handler
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
}


// isStudent
exports.isStudent = async (req, res, next)=>{
    try{
        // here req.user.accountType can be accessed bcoz of "req.user = decode" as the decoded variable has stored the details of the user that is passed to the token in login function in Auth controller which also includes accountType, email, userId etc 
        if(req.user.accountType !== "Student")
        {
            return res.status(401).json({
                success: false,
                message: "This is Protected routes for Students"
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
exports.isInstructor = async (req, res, next)=>{
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
        console.log("printing accountType", req.user.accountType)
        if(req.user.accountType !== "Admin")
        {
            return res.status(401).json({
                success: false,
                message: "This is Protected routes for Admin",
                
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