import { asyncHandler } from ".././utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.file_upload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// get user details from frontend
// validation :-> not empty
// check if user already exists :-> username , email
// check for images , check for avatar
// upload them to cloudinary
// create user object :-> create entry in db
// remove password and refresh token field from the resposne
// check for user creation
// return response

const registerUser = asyncHandler( async (req , res ) => {
    const {fullname , email , username , password } = req.body

    // Basic field validation
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are Required");
    }

    // Password length validation
    if (password.length < 8) {
        throw new ApiError(400, "Password should be minimum 8 characters in length");
    }

    // Email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Checking if user with same email or username is present in Database
    const existedUser = await User.findOne(
        { 
            $or: [{ username }, { email }]
        },
    )

    if(existedUser) {
        throw new ApiError( 409, "Username or Email Already Exists");
    }

    // Saving the Image and the Avater path to the Server
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // Creating a New User using the Model and saving it into MongoDB
    const user =  await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // we will check that the coverImage url is present or not if not present then return ""(empty string) , as have not forced the user to upload the coverImage 
        email,
        password,
        username: username.toLowerCase(),
    })
    console.log(user);

    // Saving the user in the Database and checking the user is saved in the Database by getting it back from the Database in the Response from and removing the password and the refreshtoken from the Resposnse
    const checkUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )
    console.log(checkUser);
    if(!checkUser) 
        throw new ApiError(500 , "Something went wrong while registering the User")
    
    // Sending the response to the User (Frontend) from the Server in the form of the JSON format
    return res.status(201).json(
        new ApiResponse(200 , checkUser , "User Registered Successfully")
    )
})


export { registerUser }
