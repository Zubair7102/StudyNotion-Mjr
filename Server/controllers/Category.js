const Category = require("../models/Category");

// create Category handler function

exports.createCategory = async (req, res) =>{
    try{
        // fetching data from the req body
        const {name, description} = req.body;
        // validate
        if(!name || !description)
        {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }

        // create entry in db
        const categoryDetails = await Category.create({
            name: name,
            description: description,
        })
        console.log(categoryDetails);
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            Category: categoryDetails,
        })
    }
    catch(error)
    {
        console.log("Error creating Category: ", error.message);
        res.status(500).json({
            success: false,
            message: "Error creating Category",
        })
    }
}

// Get all Category
exports.getAllCategory = async (req, res) => {
    try{
        const category = await Category.find({}, {name: trye, description: true});

        console.log(category);

        // returning successfull response
        return res.status(200).json({
            success: true,
            message: "All category returned successfully",
            category,
        })
    }
    catch(error)
    {
        console.log("Error creating category: ", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching category",
        })
    }
}


// ****************************************************************************************************************************** TO BE CHECKED
// Category Page Details
exports.categoryPageDetails = async (req, res) =>{
    try{
        const {categoryId} = req.body;

        // Get course for the specified category
        const selectedCategory = await Category.findById(categoryId)
        .populate("course")
        .exec();

        console.log(selectedCategory);

        // Handle the case when the category is not found 
        if(!selectedCategory)
        {
            return res.status(404).json({
                success: true,
                message: "Category not found",
            })
        }

        // Handle the case when there are no courses
        if(selectedCategory.course.length === 0)
        {
            return res.status(404).json({
                success: true,
                message: "No course found for the selected category",
            })
        }
        const selectedCourses = selectedCategory.course;

        // Get course for other categories
        const categoriesExpectedSelected = await Category.find({_id: categoryId
        }).populate("courses");

        let differentCourses = [];
        for(const category of categoriesExpectedSelected)
        {
            differentCourses.push(...category.course);
        }

        // Get top Selling courses across all categories
        const allCategories = await Category.find().populate("course");
        const allCourses = allCategories.flatMap(Category) = Category.course;

        const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10);

        res.status(200).json({
            selectedCourses: selectedCourses,
            differentCourses: differentCourses,
            mostSellingCourses: mostSellingCourses,
        })
    }catch(error)
    {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}