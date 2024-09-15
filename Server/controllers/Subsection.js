const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const uploadImageToCloudinary = require("../utils/imageUploader");
require("dotenv").config();

// Create a new SubSection
exports.createSubSection = async (req, res) => {
  try {
    const { title, description, sectionId } = req.body;

    const video = req.files.video;

    // Validate input fields
    if (!title || !video || !sectionId || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, video URL, and section ID are required.",
      });
    }
    console.log(video);

    // check if the section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    const videoDetail = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    console.log(videoDetail);

    // create new SubSection
    const newSubSection = await SubSection.create({
      title,
      timeDuration:`${videoDetail.duration}`,
      description,
      videoUrl: videoDetail.secure_url,
    });

    // add the SubSection to the Section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: { subSection: newSubSection._id },
      },
      { new: true }
    ).populate("subSection").exec();

    // return successfull response
    return res.status(201).json({
      success: true,
      message: "SubSection created successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error creating SubSection: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating SubSection",
      error: error.message
    });
  }
};

// Get All SubSections for a Specific Section
exports.getAllSubSections = async (req, res) => {
  try {
    const { sectionId } = req.body;

    // Check if the section exists
    const section = await Section.findById(sectionId).populate("subSection");
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }
    console.log(section.subSection);

    // Return all subsections
    return res.status(200).json({
      success: true,
      message: "SubSections retrieved successfully",
      data: section.subSection,
    });
  } catch (error) {
    console.error("Error retrieving SubSections:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error retrieving SubSections",
    });
  }
};

//  Update a SubSection by its ID
exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId ,subSectionId, title, description,} = req.body;
    const subSection = await SubSection.findById(subSectionId)

    // validate input
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      })
    }

    if (title !== undefined) {
      subSection.title = title
    }

    if (description !== undefined) {
      subSection.description = description
    }

    // Upload new video if provided
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      )
      subSection.videoUrl = uploadDetails.secure_url
      subSection.timeDuration = `${uploadDetails.duration}`
    }
    await subSection.save();
    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    console.log("updated section", updatedSection)

    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error updating SubSection:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating SubSection",
    });
  }
};

// Deleting a SubSection by its ID
exports.deletedSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
  }
};
