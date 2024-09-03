const Course = require("../models/Course");
const User = require("../models/User");
const Section = require("../models/Section");
const Tag = require("../models/Tag");
const RatingAndReview = require("../models/RatingAndReview");

// create a new Course
exports.createCourse = async (req, res) => {
  try {
    const {
      name,
      courseDescription,
      instructorId,
      whatYouWillLearn,
      courseContentId,
      price,
      thumbnail,
      tagId,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !courseDescription ||
      !instructorId ||
      !courseContentId ||
      !price ||
      !thumbnail ||
      !tagId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }
  } catch (error) {}
};
