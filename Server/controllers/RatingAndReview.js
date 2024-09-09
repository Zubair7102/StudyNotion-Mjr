const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const User = require("../models/User");
// const { Mongoose } = require("mongoose");

// created a new Rating and Review
exports.createRatingAndReview = async (req, res) => {
  try {
    // fetch the courseId rating and review from the body
    const { courseId, rating, review } = req.body;
    const userId = req.user.userId;

    // validate the input
    if (!courseId || !rating || !review) {
      return res.status(400).json({
        success: false,
        message: "Course ID, rating and review are required",
      });
    }

    // Check if the user is enrolled in the course
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }

    // check if the user has already submitted a review for the course
    const existingReview = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    // create new Rating and Review
    const newRatingAndReview = await RatingAndReview.create({
      user: userId,
      course: courseId,
      rating,
      review,
    });

    // update the course with the new review
    await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { ratingAndReviews: newRatingAndReview._id },
      },
      { new: true }
    );

    // Return successful response
    return res.status(201).json({
      success: true,
      message: "Rating and review submitted successfully",
      data: newRatingAndReview,
    });
  } catch (error) {
    console.error("Error creating rating and review:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating rating and review",
    });
  }
};

// Get all the rating and Reviews for the course
exports.getAllReviewsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // validate input
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Find all reviews for the Course
    const reviews = await RatingAndReview.find({ course: courseId }).populate(
      "user",
      "firstName LastName"
    );

    // Return reviews
    return res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Error retrieving reviews:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error retrieving reviews",
    });
  }
};

// Get Average Rating for a Course
exports.getAverageRating = async (req, res) => {
  try {
    const { courseId } = req.body.courseId;

    // validate input
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required.",
      });
    }
    // find all rating for the specified course
    // const reviews = await RatingAndReview.find({ course: courseId });

    // console.log(reviews);

    // // check if there are any reviews
    // if (reviews.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No reviews found for this course",
    //   });
    // }
    // calculate the average rating
    // const totalRating = reviews.reduce((acc, review) => acc+ review.rating, 0);
    // const averageRating = totalRating/reviews.length;
    // console.log(averageRating);

    // // Return average rating
    // return res.status(200).json({
    //     success: true,
    //     message: "Average rating calculates successfully",
    //     averageRating: averageRating.toFixed(2), // Optional: format to 2 decimal places
    // })

    // method 2:
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId), // Ensure correct ObjectId format
        },
      },
      {
        $group: {
          _id: null, // Group all documents together
          averageRating: { $avg: "$rating" }, // Calculate average of ratings
        },
      },
    ]);

    console.log(result);
    // Return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating, // Access the calculated average
      });
    }
    /// If no ratings/reviews exist
    return res.status(200).json({
      success: true,
      message: "No ratings have been given for this course yet.",
      averageRating: 0, // Default value when no ratings
    });
  } catch (error) {
    console.error("Error calculating average rating:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error calculating average rating",
    });
  }
};

// getAllRatingAndReview

exports.getAllRating = async(req, res)=>{
    try{
        const allReviews = await RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate({
            path: "user",
            select: "firstName lastName email image",
        })
        .populate({
            path: "course",
            select: "name",
        }).exec();

        // Return successful response
    return res.status(200).json({
        success: true,
        message: "All reviews fetched successfully",
        data: allReviews,
      });
    }
    catch(error)
    {
        console.error("Error while fetching rating and reviews:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error while fetching rating and reviews",
    });
    }
}
