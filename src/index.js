// require('dotenv').config({path : './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is Running at PORT : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MONGO DB connection Failed" , error);
})








// First Approach : Write all the code in the same file .
/* 
import express from "express";
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("Error", (error) => {
            console.log("Error: ",error);
            throw error
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is Listening on PORT ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("Error : ",error);
        throw error
    }
}) ()
*/
