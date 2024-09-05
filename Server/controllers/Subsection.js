const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// Create a new SubSection
exports.createSubSection = async (req, res) => {
  try {
    const { title, timeDuration, description, sectionId } = req.body;

    const video = req.files.videoFiles;

    // Validate input fields
    if (!title || !video || !sectionId || !timeDuration || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, video URL, and section ID are required.",
      });
    }

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

    // create new SubSection
    const newSubSection = await SubSection.create({
      title,
      timeDuration,
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
    );

    // return successfull response
    return res.status(201).json({
      success: true,
      message: "SubSection created successfully",
      data: newSubSection,
    });
  } catch (error) {
    console.error("Error creating SubSection: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating SubSection",
    });
  }
};

// Get All SubSections for a Specific Section
exports.getAllSubSections = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Check if the section exists
    const section = await Section.findById(sectionId).populate("subSection");
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

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
    const { subSectionId, title, timeDuration, description, video } = req.body;

    // validate input
    if (!subSectionId || !title || !video || !description) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID, title, and video URL are required.",
      });
    }

    // Upload new video if provided
    let videoUrl = video;
    if (req.files && req.files.videoFiles) {
      const videoDetail = await uploadImageToCloudinary(
        req.files.videoFiles,
        process.env.FOLDER_NAME
      );
      videoUrl = videoDetail.secure_url;
    }

    // Find SubSection by ID and update
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subSectionId,
      {
        title,
        timeDuration,
        description,
        videoUrl,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: updatedSubSection,
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
    const { subSectionId } = req.params;

    // find SubSection  by Id and delete
    const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

    if (!deletedSubSection) {
      return res.status(404).json({
        success: true,
        message: "SubSection not Found",
      });
    }

    // Remove subsection reference from the section
    await Section.findByIdAndUpdate(deletedSubSection.section, {
      $pull: { subSection: subSectionId },
    });

    return res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting SubSection:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting SubSection",
    });
  }
};
