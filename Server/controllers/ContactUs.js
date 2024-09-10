const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

// Contact Us Controller
exports.contactUsController = async (req, res) => {
  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body;

  // Input validation
  if (!email || !firstname || !lastname || !message) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided.",
    });
  }

  console.log("Contact Us Form Data:", req.body);

  try {
    // Send contact us email
    const emailRes = await mailSender(
      email,
      "Your Data Sent Successfully",
      contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
    );
    console.log("Email Response:", emailRes);

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    // Return error response
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};
