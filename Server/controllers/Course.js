const Course = require("../models/Course");
const User = require("../models/User");
const Section = require("../models/Section");
const Category = require("../models/Category");
const RatingAndReview = require("../models/RatingAndReview");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
require("dotenv").config();

// create a new Course
exports.createCourse = async (req, res) => {
  try {
    const {
      courseName,
      courseDescription,
      // instructorId,
      whatYouWillLearn,
      // courseContentId,
      price,
      categoryId,
    } = req.body;

    // get thumbnail
    const thumbnail = req.files.thumbnailImage;


    // Validate required fields
    if (
      !courseName ||
      !courseDescription ||
      // !instructorId ||
      // !courseContentId ||
      !price ||
      !categoryId ||
      !whatYouWillLearn |
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    // check if the instructor exists
    const userId = req.user.userId;
    // TODO**** check above line of code
    const instructorDetails = await User.findById(userId);
    console.log("Instructor Details: ",instructorDetails);

    if(!instructorDetails)
    {
      return res.status(404).json({
        success: false,
        message: "Intructor not found",
      });
    }

    // check given category is valid or not 
    const categoryDetails = await Category.findById(categoryId);
    if(!categoryDetails)
    {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    // uploading image to cloudinary 
    const thumbnailImage = await uploadImageToCloudinary(thumbnail, "process.env.FOLDER_NAME");
    if (!thumbnailImage || !thumbnailImage.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload thumbnail",
      });
    }

    // create a new Course 
    const newCourse = await Course.create({
      name: courseName,
      courseDescription,
      instructor: instructorDetails._id,
      price,
      thumbnail: thumbnailImage.secure_url,
      category: categoryId,
      whatYouWillLearn,
    })

    // add the new course to the courses array of the User Schema of instructor 
    await User.findByIdAndUpdate(
      {_id: instructorDetails._id},
      {
        $push:{
          courses: newCourse._id,
        }
      },
      {new: true},
    )

    // update the category schema 
    await Category.findByIdAndUpdate(
      {_id: categoryDetails._id},
      {
        $push:{
          course: newCourse._id,
        }
      },
      {new: true},

    )
    // return successfull response
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
     

  } 
  catch (error) 
  {
    console.error("Error creating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating course",
    });
  }
};

// Get All Courses
exports.getAllCourses = async (req, res)=>{
  try{
    const allCourses = await Course.find({},
      {courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
    .populate("instructor", "name")
    .exec();
    //   .populate("courseContent", "title")
    //   .populate("category", "name");

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      courses,
    });

  }
  catch(error)
  {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
    });
  }
}

// Get Single Course by ID
exports.getCourseById = async (req, res) =>{
  try{
    const {courseId} = req.params;
    // Find course by ID
    const course = await Course.findById(courseId)

    // Check if course exists
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  }
  catch(error)
  {
    console.error("Error retrieving course:", error.message);
    res.status(500).json({
      success: false,
      message: "Error retrieving course",
    });
  }
}


// Delete Course by Its ID
exports.deleteCourse = async(req, res)=>{
  try{
    const {courseId} = req.params;

    const deletedCourse = await Course.findByIdAndDelete({courseId});
    console.log(deleteCourse);

    // Check if course exists
    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // remove the Course from the instructor's courses list
    await User.findByIdAndUpdate(deletedCourse.instructor, {
      $pull:{courses: deletedCourse._id},
    })

    // Remove the course from the category's courses list
    await Category.findByIdAndUpdate(deletedCourse.category, {
      $pull: {course: deletedCourse._id},
    })
    // return response
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  }
  catch(error)
  {
    console.error("Error deleting course:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
    });
  }
}