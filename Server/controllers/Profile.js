const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    // Get user id from the authenticated request
    const userId = req.user.userId;

    // Validation
    if (!contactNumber || !gender || !userId) {
      return res.status(400).json({
        success: false,
        message: "Contact number, gender, and user ID are required",
      });
    }

    // Find the user and profile details
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);
    if (!profileDetails) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    // Update profile details
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profileDetails,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find user details
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find profile details
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);
    if (!profileDetails) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    // Delete profile and user
    await Profile.findByIdAndDelete(profileId);
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account and profile deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting account/profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting account/profile.",
    });
  }
};

// Get All Details of a User
exports.getUserDetails = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.userId;

    // Find user and populate associated profile details
    const userDetails = await User.findById(userId)
      .populate("additionalDetails") // Populating the profile details
      .populate("courses") // Populating associated courses if needed
      .select("-password") // Exclude the password from the response for security reasons
      .exec();

    // Check if user exists
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Return user details
    return res.status(200).json({
      success: true,
      message: "User details retrieved successfully.",
      data: userDetails,
    });
  } catch (error) {
    console.error("Error retrieving user details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user details.",
    });
  }
};

// Update Display Picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "Display picture is required.",
      });
    }

    const displayPicture = req.files.displayPicture;
    const userId = req.user.userId;

    // Upload the image to Cloudinary
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    // Update user's display picture
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating display picture:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating display picture.",
    });
  }
};

// Get Enrolled Courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    let userDetails = await User.findById(userId)
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: `Could not find user with id: ${userId}`,
      });
    }

    userDetails = userDetails.toObject();

    // Calculate progress and total duration for each enrolled course
    userDetails.courses.forEach(async (course) => {
      let totalDurationInSeconds = 0;
      let subSectionLength = 0;

      course.courseContent.forEach((section) => {
        section.subSection.forEach((subSection) => {
          totalDurationInSeconds += parseInt(subSection.timeDuration) || 0;
        });

        subSectionLength += section.subSection.length;
      });

      course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

      const courseProgress = await CourseProgress.findOne({
        courseId: course._id,
        userId: userId,
      });

      const completedVideosCount = courseProgress?.completedVideos.length || 0;
      course.progressPercentage =
        subSectionLength === 0
          ? 100
          : Math.round((completedVideosCount / subSectionLength) * 100 * 100) /
            100; // Round to 2 decimal places
    });

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Instructor Dashboard
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.userId });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      return {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
    });

    return res.status(200).json({
      success: true,
      courses: courseData,
    });
  } catch (error) {
    console.error("Error in instructor dashboard:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
