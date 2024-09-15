const Category = require("../models/Category");

// create Category handler function

exports.createCategory = async (req, res) => {
  try {
    // fetching data from the req body
    const { name, description } = req.body;
    // validate
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // create entry in db
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(categoryDetails);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      Category: categoryDetails,
    });
  } catch (error) {
    console.log("Error creating Category: ", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating Category",
    });
  }
};

// Get all Category
exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find(
      {},
      { name: true, description: true }
    );

    console.log(categories);

    // returning successfull response
    return res.status(200).json({
      success: true,
      message: "All category returned successfully",
      categories,
    });
  } catch (error) {
    console.log("Error creating category: ", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching category",
    });
  }
};

// ******************************************************************************************************************************
// Category Page Details
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log("CategoryId is: ", categoryId);

    // Get course for the specified category
    const selectedCategory = await Category.findById(categoryId)
    .populate({
      path: "courses",
      match: { status: "Published" },
      populate: "ratingAndReviews",
    })
    .exec()

    console.log(selectedCategory);

    // Handle the case when the category is not found
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Handle the case when there are no courses
    if (selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No course found for the selected category",
      });
    }
    const selectedCourses = selectedCategory.courses;

    // Get course for other categories
    const differentCategories = await Category.find({
      _id: { $ne: categoryId },
    })
      .populate("courses")
      .exec();

    // Flatten all courses from other categories
    const differentCourses = differentCategories.flatMap(
      (category) => category.courses
    );

    // Get top-selling courses across all categories
    const allCategories = await Category.find().populate("courses");
    const allCourses = allCategories.flatMap((category) => category.courses);

    // Sorting courses based on sold count and slicing the top 10
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    res.status(200).json({
      success: true,
        data: {
          selectedCourses,
          differentCourses,
          mostSellingCourses,
        },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
