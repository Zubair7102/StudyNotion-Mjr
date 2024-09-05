const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Course = require("../models/Course");

// create a new Section
exports.createSection = async (req, res) => {
  try {
    // fetch data from the then req body
    const { sectionName, courseId } = req.body;

    // validate inputs
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // check if the course exits
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not Found",
        updatedCourse,
      });
    }

    // create new Section
    const newSection = await Section.create({
      sectionName,
    });

    // Add the Section the course
    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
            $push:{
                courseContent: newSection._id,
            }
        },
        {new: true},
    )

    // return successfull reponse
    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Error creating section:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating section",
    });
  }
};

// Update a Section by its ID
exports.updateSection = async (req, res) => {
  try {

    const { sectionName, sectionId  } = req.body;
    // data validation
    if(!sectionName || !sectionId)
    {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
          });
    }

    // find section bt ID and update
    const updatedSection = await Section.findByIdAndUpdate(
      { sectionId },
      { sectionName},
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } 
  catch (error) {
    console.error("Error updating section:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating section",
    });
  }
};

// Delete a Section by ID
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // find section by id and delete
    const deletedSection = await Section.findByIdAndDelete(sectionId);

    if (!deletedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    // also remove the Section reference from the course
    await Course.findByIdAndUpdate(deletedSection.course, {
      $pull: { courseContent: sectionId },
    });

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } 
  
  catch (error) {
    console.error("Error deleting section:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting section",
    });
  }
};
