const mongoose = require("mongoose");

require("dotenv").config();

exports.dbConnect = () =>{
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then( ()=>{
        console.log("DB is connected successfully")
    })
    .catch( (error) =>{
        console.log("Db connection issues");
        console.log(error);
        process.exit(1);
    })
}