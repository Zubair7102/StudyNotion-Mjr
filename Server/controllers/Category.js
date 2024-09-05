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