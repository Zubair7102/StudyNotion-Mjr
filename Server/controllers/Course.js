const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Category = require("../models/Category");
const RatingAndReview = require("../models/RatingAndReview");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();
const CourseProgress = require("../models/CourseProgress");

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
    const thumbnail = req.files?.thumbnailImage;

    // Validate required fields
    if (
      !courseName ||
      !courseDescription ||
      // !instructorId ||
      // !courseContentId ||
      !price ||
      !categoryId ||
      !whatYouWillLearn | !thumbnail
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
    console.log("Instructor Details: ", instructorDetails);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Intructor not found",
      });
    }

    // check given category is valid or not
    const categoryDetails = await Category.findById(categoryId);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    // Upload thumbnail image to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    if (!thumbnailImage || !thumbnailImage.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload thumbnail",
      });
    }

    // create a new Course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      price,
      thumbnail: thumbnailImage.secure_url,
      category: categoryId,
      whatYouWillLearn,
    });

    // add the new course to the courses array of the User Schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // update the category schema
    await Category.findByIdAndUpdate(
      { _id: categoryDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    // return successfull response
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating course",
    });
  }
};

// Get All Courses
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor", "firstName lastName")
      .exec();
    //   .populate("courseContent", "title")
    //   .populate("category", "name");

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      courses: allCourses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
    });
  }
};

// Get Single Course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID format.",
      });
    }

    // Find course by ID
    const course = await Course.findById(courseId)
      .populate("instructor", "firstName lastName")
      .populate("category", "name description")
      .populate("ratingAndReviews");

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
  } catch (error) {
    console.error("Error retrieving course:", error.message);
    res.status(500).json({
      success: false,
      message: "Error retrieving course",
    });
  }
};


// Delete Course by Its ID
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID format.",
      });
    }

    // Find and delete the course by ID
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    // Check if course exists
    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove the Course from the instructor's courses list
    await User.findByIdAndUpdate(deletedCourse.instructor, {
      $pull: { courses: deletedCourse._id },
    });

    // Remove the Course from the category's courses list
    await Category.findByIdAndUpdate(deletedCourse.category, {
      $pull: { courses: deletedCourse._id },
    });

    // Return response
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
    });
  }
};

// edit course details
exports.editCourse = async (req, res) => {
  try {
    // Get courseId
    const { courseId } = req.body;
    const updates = req.body;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID format.",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // If thumbnail image is found, update it
    if (req.files && req.files.thumbnailImage) {
      console.log("Thumbnail update");
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
      course.thumbnail = thumbnailImage.secure_url;
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key) && key !== "courseId") {
        if (key === "tag" || key === "instructions") {
          course[key] = JSON.parse(updates[key]);
        } else {
          course[key] = updates[key];
        }
      }
    }

    await course.save();
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      });

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user
    const instructorId = req.user.userId;

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 });

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    // Find course details
    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with ID: ${courseId}`,
      });
    }

    // Find course progress for the user
    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    console.log("courseProgressCount :", courseProgressCount);

    // Calculate total duration of the course in seconds
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving full course details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error retrieving full course details",
    });
  }
};


// Get Course Details
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID format.",
      });
    }

    // Find the course details by ID
    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl", // Exclude video URL from subSection
        },
      })
      .exec();

    // Check if the course exists
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: `Could not find course with ID: ${courseId}`,
      });
    }

    // Calculate total duration in seconds
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0; // Safe parse with default 0
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    // Convert total duration to a readable format
    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    // Return successful response with course details and total duration
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    });
  } catch (error) {
    console.error("Error retrieving course details:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
