import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) // Using the express.json and setting the limit of the json packet that can be sent to the SERVER --> 16KB
app.use(express.urlencoded({extended: true , limit: "16kb"})) // We are Enconding the URL that we search or passes the Paramenter and setting the Limit of 16KB 
app.use(express.static("public")) // Setting the public folder as static for serving assets that can be publicaly accesed by the user --> {img} {favicon} {thumnails} ..etc  
app.use(cookieParser()) // We are setting so that we can send and access the cookies from the user's browser and from the SERVER --> we can do crud operations on the cookies


// Routes
import userRouter from "./routes/user.routes.js";

// Routes Declaration
app.use("/api/v1/users", userRouter); // --> http://localhost:PORT/api/v1/users/register

export { app }
