const Tag = require("../models/Tag");

// create Tag handler function

exports.createTag = async (req, res) =>{
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
        const tagDetails = await Tag.create({
            name: name,
            description: description,
        })
        console.log(tagDetails);
        res.status(201).json({
            success: true,
            message: "Tag created successfully",
            Tag: tagDetails,
        })
    }
    catch(error)
    {
        console.log("Error creating tag: ", error.message);
        res.status(500).json({
            success: false,
            message: "Error creating tag",
        })
    }
}

// Get all Tags
exports.getAllTags = async (req, res) => {
    try{
        const tags = await Tag.find({}, {name: trye, description: true});

        console.log(tags);

        // returning successfull response
        return res.status(200).json({
            success: true,
            message: "All tags returned successfully",
            tags,
        })
    }
    catch(error)
    {
        console.log("Error creating tag: ", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching tag",
        })
    }
}