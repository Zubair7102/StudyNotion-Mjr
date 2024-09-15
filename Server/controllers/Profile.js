const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration")

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      phoneNo = "",
      gender = "" } = req.body;

    // Get user id from the authenticated request
    const userId = req.user.id;

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

    const user = await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
    })
    await user.save();

    // Update profile details
    profileDetails.firstName = firstName
    profileDetails.lastName = lastName 
    profileDetails.dateOfBirth = dateOfBirth
    profileDetails.about = about
    profileDetails.gender = gender
    profileDetails.phoneNo = phoneNo
    await profileDetails.save();

    const updatedUserDetails = await User.findById(userId)
      .populate("additionalDetails")
      .exec()

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
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
    const userId = req.user.id;
    console.log("User ID to delete:", userId);

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated profile
    console.log("Profile to be deleted",user.additionalDetails)
    await Profile.findByIdAndDelete(user.additionalDetails);

    // Update each course to remove the user from enrolled students
    for (const courseId of user.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } },
        { new: true }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Delete related course progress records
    await CourseProgress.deleteMany({ userId: userId });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({
      success: false,
      message: "User cannot be deleted successfully",
    });
  }
};

// Get All Details of a User
exports.getUserDetails = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;

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
    
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;

    // Upload the image to Cloudinary
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image)
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
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Instructor Dashboard
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

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
