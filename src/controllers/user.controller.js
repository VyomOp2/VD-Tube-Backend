import { asyncHandler } from ".././utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.file_upload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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
        const accessToken = user.generateACCESS_TOKEN()
        const refreshToken = user.generateREFRESH_TOKEN()

        user.refreshToken = refreshToken
        await user.save({ ValidateBeforeSave: false })

        return { accessToken , refreshToken }

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
    if (!(email || username)) {
        throw new ApiError(400 , "Email or Username is required")
    }

    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user) {
        throw new ApiError(400 , "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
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
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse (200 , {} , "User logged out"))
})


// Refresh and Access Tokens :
const refreshAccessToken = asyncHandler( async ( req , res ) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401 , "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401 , "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401 , "Refresh Token is Expired or Used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options )
        .cookie("refreshToken" , newrefreshToken , options )
        .json(
            new ApiResponse(
                200,
                {
                    accessToken , refreshToken : newrefreshToken
                },
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
})


// Changing Current Password :
const changeCurrentPassword = asyncHandler( async( req , res ) => {
    const { oldPassword , newPassword  , cnfPassword } = req.body

    if ( !( newPassword === cnfPassword )) {
        throw new ApiError(200 , "Password doesn't Match")
    }

    const user = await User.findById(req.user._id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400 , "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ValidateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200) , {} , "Password Changed Successfully")
})


// Getting Current User who is Logged in :
const getCurrentUser = asyncHandler( async ( req , res ) => {
    return res
    .status(200)
    .json(new ApiResponse(200 , req.user , "Current user fetched Successfully")
    )
})


// Updating Account Details :
const updateAccountDetails = asyncHandler( async ( req , res ) => {
    const { email , fullname } = req.body

    if ( !fullname || !email ) {
        throw new ApiError(400 , "All fields are Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id ,
        {
            $set: {
                fullname: fullname ,
                email: email ,
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user , "Account Details Updated Successfully"))
})


// Updating User Avatar :
const updateUserAvatar = asyncHandler( async ( req , res ) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar file is Missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400 , "Error while Uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user , "Avatar Uploaded Successfully")
    )
})


// Updating User Cover Image :
const updateUserCoverImage = asyncHandler( async ( req , res ) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400 , "Cover Image file is Missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400 , "Error while Uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            coverImage: coverImage.url
        }
    },
    { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user , "Cover Image Uploaded Successfully")
    )
})


// Getting user channel Profile :
const getUserChannelProfile = asyncHandler( async ( req , res ) => {
    const { username } = req.params

    if(!username?.trim()) {
        throw new ApiError(400 , "Username is required")
    }

    const channel = await User.aggregate([
        {
            // Matching the Values which are passed to find the user :
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // Lookup : To find the Subscriber :
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        {
            // To count the number of Subscribers User has subscribed :
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // This is used to add all the piplines to the user :
            $addFields: {
                subscriberscount: {
                    $size: "$subscribers"
                },
                channelsubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $condition: {
                        if: {$in: [req.user?._id , "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // Projection kya karta h --> Selected cheezo ko hi Project karta h
            $project: {
                fullname: 1,
                username: 1,
                subscriberscount: 1,
                channelsubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(400 , "Channel does not Exists")
    }
    console.log(channel);

    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0] , "User Channel fetched Successfully")
    )
})


// To get the Watch History of the User :
const getWatchHistory = asyncHandler( async ( req , res ) => {
    const user = await User.aggregate([
        {
            // To match the user id with the MongoDB ObjectId :
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // To get the details of the Videos watched by the User :
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        // To get the user Info of the Watch History videos :
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    // To project the user info :
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // To pass the Array[0] of the user info to the watchHistory , to ease the work for the Frontent :
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetched Successfully"
        )
    )
}) 


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
