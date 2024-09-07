const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const crypto = require("crypto");
const mailSender = require("../utils/mailSender");

// create a RazorPay order
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    // find course details
    const course = await Course.findById(courseId);
    // validate
    if (!course) {
      return res.status(404).json({
        success: true,
        message: "Course not Found",
      });
    }

    // // check if the user has already payed for the same course or not
    // const uid = new mongoose.Types.ObjectId(userId);
    // if(course.studentsEnrolled.includes(uid))
    // {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Student is already enrolled"
    //     });
    // }

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
      payment_capture: 1, //auto capture the payment
      notes: {
        courseId: courseId,
        userId,
      },
    };

    // create Order
    const order = await razorpay.orders.create(options);
    console.log(order);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseName: course.name,
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } =
      req.body;

    // create expected signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    // compare signature
    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Payment verified, grant course access to the user
    const user = await findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: true,
        message: "User not found",
      });
    }

    // Add course to user'senrolled course
    user.courses.push(courseId);
    await user.save();

    // Return successfull response
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

// verify Signature of Razorpay and server
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
        // fulfill the action
        // find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentEnrolled: userId } },
          { new: true }
        );

        if (!enrolledCourse) {
          return res.status(404).json({
            success: false,
            message: "course not found",
          });
        }

        console.log(enrolledCourse);

        // find the Student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findOneAndUpdate(
          { _id: userId },
          { $push: { courses: courseId } },
          { new: true }
        );

        console.log(enrolledStudent);

        // send mail for the confirmation
        const emailResponse = await mailSender(
          enrolledStudent.email,
          "Congratulations",
          "Congratulations you are onboarded into new Course"
        );

        console.log(emailResponse);
        // Return successful response
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
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};
