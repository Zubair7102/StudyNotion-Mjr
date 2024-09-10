const mongoose = require("mongoose");

const userDataSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        trim: true,
        // When you set trim: true, it automatically removes any leading and trailing whitespace from the value before it gets saved to the database.
    },
    lastName:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        trim: true,
    },
    phoneNo:{
        type: Number,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    accountType:{
        type:String,
        enum: ["Admin", "Student", "Instructor"],
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    approved: {
        type: Boolean,
        default: true,
    },
    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        // This specifies that the additionalDetails field is of type ObjectId, which is a special data type in MongoDB used for referencing other documents.
        // The ref option is used to create a relationship between documents in different collections. It indicates that the additionalDetails field references documents in the "profile" collection.
        // This establishes a foreign key relationship where the additionalDetails field stores an ObjectId that corresponds to the _id of a document in the "profile" collection.
        required: true,
        ref: "Profile",
    },
    courses:{
        type:mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "Course",
    },
    image:{
        type:String,
        // here type of image field is String because we are using URL
        required: true,
    },
    token:{
        type: String,
    },
    resetPasswordExpires: {
        type:Date,
    },
    courseProgress:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "CourseProgress",
        }
    ]
},
// Add timestamps for when the document is created and last modified
{ timestamps: true })

module.exports = mongoose.model("userData", userDataSchema);