const Profile = require("../models/Profile");
const User = require("../models/User");

// create a new Profile
exports.updateProfile= async (req, res) =>{
    try{
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;

        // get user id
        const userId = req.user.userId;

        // validation
        if(!contactNumber || !gender || !userId)
        {
            return req.status(400).json({
                success: false,
                message:"All fields are required"
            })
        }

    
        // find profile
        const userDetails = await User.findById(id);const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        // update  profile
        
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile,
          });
    }
    catch(error)
    {
        console.error("Error updating profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
    }
}

// Delete Account 
exports.deleteAccount = async (req, res) =>{
    try{
        const userId = req.user.userId;

        // find user details
        const userDetails = await User.findById(userId);
        if (!userDetails) {
            return res.status(404).json({
              success: false,
              message: "User not found.",
            });
        }

        // find profile details
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        if (!profileDetails) {
            return res.status(404).json({
              success: false,
              message: "Profile not found.",
            });
          }
      
        // Delete profile
    await Profile.findByIdAndDelete(profileId);

    // Delete user
    await User.findByIdAndDelete(userId);
    return res.status(200).json({
        success: true,
        message: "Account and profile deleted successfully.",
      });
    
    }
    catch(error)
    {
        console.error("Error deleting account/profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting account/profile.",
    });
    }
}

// Get All Details of a User
exports.getUserDetails = async (req, res) => {
    try {
      // Get user ID from the authenticated request
      const userId = req.user.userId;
  
      // Find user and populate associated profile details
      const userDetails = await User.findById(userId)
        .populate("additionalDetails").exec()// Populating the profile details
        .populate("courses").exec() // Populating associated courses if needed
        .select("-password").exec() // Exclude the password from the response for security reasons
  
      // Check if user exists
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
  
      // Return user details
      return res.status(200).json({
        success: true,
        message: "User details retrieved successfully.",
        data: userDetails,
      });
    } catch (error) {
      console.error("Error retrieving user details:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error retrieving user details.",
      });
    }
  };