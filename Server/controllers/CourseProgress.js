const mongoose = require("mongoose");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");

// Update Course Progress
exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId } = req.body;
  const userId = req.user.userId; // Ensure this matches your authentication setup

  try {
    // Check if the subsection is valid
    const subsection = await SubSection.findById(subsectionId);
    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Invalid subsection",
      });
    }

    // Find the course progress document for the user and course
    let courseProgress = await CourseProgress.findOne({
      courseId: courseId,
      userId: userId,
    });

    if (!courseProgress) {
      // If course progress doesn't exist, create a new one
      courseProgress = new CourseProgress({
        courseId,
        userId,
        completedVideos: [subsectionId],
      });
    } else {
      // If course progress exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subsectionId)) {
        return res.status(400).json({
          success: false,
          message: "Subsection already completed",
        });
      }

      // Push the subsection into the completedVideos array
      courseProgress.completedVideos.push(subsectionId);
    }

    // Save the updated course progress
    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course progress updated successfully",
    });
  } catch (error) {
    console.error("Error updating course progress:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Progress Percentage
exports.getProgressPercentage = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.userId;

  // Validate input
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: "Course ID not provided.",
    });
  }

  try {
    // Find the course progress document for the user and course
    const courseProgress = await CourseProgress.findOne({
      courseId: courseId,
      userId: userId,
    })
      .populate({
        path: "courseId",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    // Check if course progress exists
    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found for the given IDs.",
      });
    }

    // Calculate total lectures
    let totalLectures = 0;
    courseProgress.courseId.courseContent?.forEach((section) => {
      totalLectures += section.subSection.length || 0;
    });

    // Calculate progress percentage
    let progressPercentage = (courseProgress.completedVideos.length / totalLectures) * 100;

    // Round to 2 decimal places
    progressPercentage = Math.round(progressPercentage * 100) / 100;

    return res.status(200).json({
      success: true,
      data: progressPercentage,
      message: "Successfully fetched course progress",
    });
  } catch (error) {
    console.error("Error fetching progress percentage:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
