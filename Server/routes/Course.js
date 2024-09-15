const express = require("express")
const router = express.Router();

// import controllers
// course controller import
const {createCourse, getAllCourses, getCourseDetails, editCourse, getFullCourseDetails, getInstructorCourses, deleteCourse} = require("../controllers/Course");

// Categories controller import
const {createCategory, getAllCategory, categoryPageDetails} = require("../controllers/Category");

// Section controller import
const {createSection, updateSection, deleteSection} = require("../controllers/Section")

// Subsection Controller import
const {createSubSection, getAllSubSections, updateSubSection, deletedSubSection} = require("../controllers/Subsection");

// Rating and Review controller imporrt
const {createRatingAndReview, getAverageRating, getAllRating, getAllReviewsForCourse} = require("../controllers/RatingAndReview");

// courseProgress controller import
const {updateCourseProgress, getProgressPercentage} = require("../controllers/CourseProgress");

// import middlewares
const {auth, isAdmin, isInstructor, isStudent} = require("../middlewares/authMid");

// Course Router 
// course created by intructors
router.post("/createCourse", auth, isInstructor, createCourse);

// add section to Course
router.post("/addSection", auth, isInstructor, createSection);

// update the section
router.post("/updateSection", auth, isInstructor, updateSection);

// Delete section
router.delete("/deleteSection", auth, isInstructor, deleteSection)


// edit sub section 
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
// delete subSection
router.delete("/deleteSubSection", auth, isInstructor, deletedSubSection);
// add subSection to a section
router.post("/addSubSection", auth, isInstructor, createSubSection);
router.get("/getAllSubSections", getAllSubSections);


// get all registered courses
router.get("/getAllCourses", getAllCourses);

// get details about particular course
router.get("/getCourseDetails", getCourseDetails);

// get full detail about the course
router.post("/getFullCourseDetails", auth, getFullCourseDetails);

// edit course
router.post("/editCourse", auth, isInstructor, editCourse);

// get all course for specific intructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);

// delete a course
router.delete("/deleteCourse", deleteCourse);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);



// Category Router by Admin

// category is created by Admin
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategory", getAllCategory);
router.get("/getCategoryPageDetails", categoryPageDetails);


// Rating And Review Route

router.post("/createRating", auth, isStudent, createRatingAndReview);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRating);

module.exports = router;