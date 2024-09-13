const express = require("express");
const app = express();
require("dotenv").config();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const cookieParser = require("cookie-parser");
const cors = require("cors");
// connect with cloud
const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();
const fileupload = require("express-fileupload");
require("./config/database").dbConnect();

const PORT = process.env.PORT || 4000;


// add middleware
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        // this function is used to respond to all the request recieved from frontend
    })
)

// cloudinary ***
app.use(fileupload(
    {
        useTempFiles : true,
        tempFileDir : '/tmp/'
    }
));


// routes
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/course', courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

// default route 
app.get("/", (req, res)=>{
    return res.json({
    success: true,
    message: 'Your Server is Up and running.....'
})
}) 

// activate the server
app.listen(PORT, ()=>{
    console.log(`App is listening at the port ${PORT}...`)
})