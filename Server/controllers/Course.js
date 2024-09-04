const Course = require("../models/Course");
const User = require("../models/User");
const Section = require("../models/Section");
const Tag = require("../models/Tag");
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
      tagId,
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
      !tagId ||
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
    const instructorDetails = await User.findById(userId);
    console.log("Instructor Details: ",instructorDetails);

    if(!instructorDetails)
    {
      return res.status(404).json({
        success: false,
        message: "Intructor not found",
      });
    }

    // check given tag is valid or not 
    const tagDetails = await Tag.findById(tagId);
    if(!tagDetails)
    {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
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
      tag: tagId,
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

    // update the Tag schema 
    await Tag.findByIdAndUpdate(
      {_id: tagDetails._id},
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
    //   .populate("tag", "name");

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
