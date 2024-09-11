const express = require("express")
const router = express.Router();

const {createOrder, verifyPayment, sendPaymentSuccessEmail} = require("../controllers/Payments");
const {auth, isInstructor, isStudent, isAdmin} = require("../middlewares/authMid");

// Router
router.post("/createOrder", auth, createOrder);
router.post("/verifyPayment", auth, isStudent, verifyPayment);
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);

module.exports = router;

