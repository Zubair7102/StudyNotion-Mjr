const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");

// Create a RazorPay Order
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    // Find course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if the user has already enrolled in the course
    if (course.studentsEnrolled.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled",
      });
    }

    // Order Options
    const options = {
      amount: course.price * 100, // Amount in paisa (multiply by 100 to convert to rupees)
      currency: "INR",
      receipt: Math.random(Date.now()).toString(),
      payment_capture: 1, // Auto capture the payment
      notes: {
        courseId: courseId,
        userId: userId,
      },
    };

    // Create Order
    const order = await razorpay.orders.create(options);
    console.log(order);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};

// Handling Payment Verification
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } = req.body;

    // Create expected signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    // Compare signature
    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Payment verified, grant course access to the user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add course to user's enrolled courses
    user.courses.push(courseId);
    await user.save();

    // Optionally, create course progress entry for the user
    await CourseProgress.create({
      courseId: courseId,
      userId: user._id,
      completedVideos: [],
    });

    // Send payment success email
    await mailSender(
      user.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${user.firstName} ${user.lastName}`,
        amount / 100, // Amount in rupees
        razorpayOrderId,
        razorpayPaymentId
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified and course access granted",
    });
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};

// Verify Signature of Razorpay and Server
exports.verifySignature = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature === digest) {
      console.log("Payment is authorized");

      const { courseId, userId } = req.body.payload.payment.entity.notes;

      try {
        // Find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentsEnrolled: userId } },
          { new: true }
        );

        if (!enrolledCourse) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        console.log("Enrolled Course: ", enrolledCourse);

        // Find the student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findOneAndUpdate(
          { _id: userId },
          { $push: { courses: courseId } },
          { new: true }
        );

        console.log("Enrolled Student: ", enrolledStudent);

        // Send confirmation email
        const emailResponse = await mailSender(
          enrolledStudent.email,
          "Congratulations",
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        );

        console.log("Email Response: ", emailResponse);

        // Return successful response
        return res.status(200).json({
          success: true,
          message: "Payment verified and course access granted",
        });
      } catch (error) {
        console.error("Error during payment verification:", error.message);
        return res.status(500).json({
          success: false,
          message: "Error during payment verification",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Error verifying payment signature:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment signature",
    });
  }
};

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.userId;

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide all the details",
    });
  }

  try {
    const enrolledStudent = await User.findById(userId);
    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
    return res.status(200).json({
      success: true,
      message: "Payment success email sent",
    });
  } catch (error) {
    console.error("Error sending payment success email:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not send payment success email",
    });
  }
};

// Enroll the Student in Courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide course IDs and user ID",
    });
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }
      console.log("Updated course: ", enrolledCourse);

      // Create course progress for the student
      const courseProgress = await CourseProgress.create({
        courseId: courseId,
        userId: userId,
        completedVideos: [],
      });

      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      console.log("Enrolled student: ", enrolledStudent);

      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled in ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      );

      console.log("Email sent successfully: ", emailResponse);
    } catch (error) {
      console.error("Error enrolling student:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error enrolling student",
      });
    }
  }
};
