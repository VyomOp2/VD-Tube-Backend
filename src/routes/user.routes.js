import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js"
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
router.route("/logout").post( verifyJWT , logoutUser)

export default router
