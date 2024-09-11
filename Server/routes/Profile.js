const express = require("express");
const router = express.Router();

// middleware
const {auth, isIntructor, isAdmin, isStudent, isInstructor} = require("../middlewares/authMid");

// controller mounting
const {updateProfile, deleteAccount, getUserDetails, updateDisplayPicture, getEnrolledCourses, instructorDashboard} = require("../controllers/Profile");


// Profile Routes
router.delete("/deleteProfile", auth, deleteAccount);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getUserDetails);

router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateDisplayPictures", auth, updateDisplayPicture);
router.get("/instructorDashboard", auth, isIntructor, instructorDashboard);

module.exports = router;
