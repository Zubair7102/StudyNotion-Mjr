const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Category = require("../models/Category");
const  uploadImageToCloudinary = require("../utils/imageUploader");
require("dotenv").config();
const CourseProgress = require("../models/CourseProgress");
const convertSecondsToDuration = require("../utils/secToDuration");

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
      // tag: _tag,
      // instructions: _instructions,
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
      !whatYouWillLearn | !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    // check if the instructor exists
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    })
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
      category: categoryDetails._id,
      whatYouWillLearn,
      // instructions,
      // tag,
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
      categoryId,
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
      error: error.message
    });
  }
};

// **************************************************************************************************************************************************
// Get All Courses
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
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
      error: error.message,
    });
  }
};

// ***********************************************************************************************************************************************************************************************************
// Get Single Course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.body;
    // Find course by ID
    const course = await Course.findOne(courseId)
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
        select: "-videoUrl",
      },
    })
    .exec()


    // Check if course exists
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0
    course.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: {
        courseDetails,
        totalDuration,
      },
    });
  } catch (error) {
    console.error("Error retrieving course:", error.message);
    res.status(500).json({
      success: false,
      message: "Error retrieving course",
    });
  }
};


// ******************************************************************************************************************************************************************************

// Delete the Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnroled
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      })
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId)
      if (section) {
        const subSections = section.subSection
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId)
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// ****************************************************************************************************************************************************************

// edit course details
exports.editCourse = async (req, res) => {
  try {
    // Get courseId
    const { courseId } = req.body;
    const updates = req.body;

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
      }).exec();

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
// ****************************************************************************************************************************************************************
// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user
    const instructorId = req.user.id;

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

// ****************************************************************************************************************************************************************

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Find course details
    const courseDetails = await Course.findOne(courseId)
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
    })
    .exec()

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
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
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

// ****************************************************************************************************************************************************************

// Get Course Details
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Find the course details by ID
    const courseDetails = await Course.findOne({ _id: courseId })
    .populate({
      path: "instructor",
      populate: {
        path: "additionalDetails",
      },
    })
    .populate("category")
    // .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec()
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
        const timeDurationInSeconds = parseInt(subSection.timeDuration, 10);
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

// ****************************************************************************************************************************************************************