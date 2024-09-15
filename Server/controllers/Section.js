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
    ).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec();

    // return successfull reponse
    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: updatedCourse,
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

    const { sectionName, sectionId, courseId } = req.body;
    
    // data validation
    if(!sectionName || !sectionId)
    {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
          });
    }
    const section = await Section.findByIdAndUpdate(
			sectionId,
			{ sectionName },
			{ new: true }
		);

    const course = await Course.findById(courseId)
    .populate({
      path: "courseContent",
      populate:{
        path:"subSection",
      },
    })
    .exec();

    return res.status(200).json({
      success: true,
      message: ("Section updated successfully", section),
      data: course,
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
    const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      // section: section.sectionName,
      data: course,
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
