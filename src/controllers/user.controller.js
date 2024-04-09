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

    // Saving the user in the Database and checking the user is saved in the Database by getting it back from the Database in the Response from and removing the password and the refreshtoken from the Resposnse
    const checkUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if(!checkUser) 
        throw new ApiError(500 , "Something went wrong while registering the User")
    
    // Sending the response to the User (Frontend) from the Server in the form of the JSON format
    return res.status(201).json(
        new ApiResponse(200 , checkUser , "User Registered Successfully")
    )
})



// We are Generating both the Access and Refresh Tokens here.We are also sending the cookies to the User in the Response :
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const AccessToken = user.generateACCESS_TOKEN()
        const RefreshToken = user.generateREFRESH_TOKEN()

        user.RefreshToken = RefreshToken
        await user.save({ ValidateBeforeSave: false })

        return { AccessToken , RefreshToken }

    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating the Access and Refresh Tokens")
    }
} 



// request body -> data
// username or email
// find the user
// check password
// access and refresh token generate
// send cookies to the user
const loginUser = asyncHandler(async (req , res ) => {
    
    const { email , username , password } = req.body
    if (!email || !username) {
        throw new ApiError(400 , "Email or Username is required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user) {
        throw new ApiError(400 , "User not found")
    }

    const isPassworCorrect = await user.isPassworCorrect(password)

    if (!isPassworCorrect) {
        throw new ApiError(401 , "Invalid User Credentials")
    }

    const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser ,
                accessToken ,
                refreshToken 
            },
            "User Logged in Successfully"
        )
    )
})



// Creating the Logout Function :
const logoutUser = asyncHandler(async ( req , res ) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {}
        }
    )
})

export { registerUser , loginUser , logoutUser }
