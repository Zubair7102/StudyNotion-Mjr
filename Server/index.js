const express = require("express");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 4000;

app.use(express.json());
require("./config/database").dbConnect();

// here route is yet to be defined 
const route = require("./routes/");
app.use('/api/v1/route', route);

// activate the server
app.listen(PORT, ()=>{
    console.log(`APP is listening at the port ${PORT}`)
})