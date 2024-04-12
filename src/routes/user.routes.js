import { Router } from "express";
import { 
    loginUser,
    logoutUser,
    registerUser , 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
}
from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/authentication.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        } 
    ]),  // multer middleware
    registerUser
)

router.route("/login").post(loginUser)

// Secured Routes :
router.route("/logout").post( verifyJWT , logoutUser )
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT , changeCurrentPassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , updateAccountDetails)
router.route("/avatar-update").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)
router.route("/cover-image-update").patch(verifyJWT , upload.single("coverImage") , updateUserCoverImage)

// User Channel Routes :
router.route("/channel/:username").get(verifyJWT , getUserChannelProfile)
router.route("/history").get(verifyJWT , getWatchHistory)

export default router
