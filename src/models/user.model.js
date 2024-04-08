import mongoose  , { Schema }from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String, // Cloudinary URL
            required: true,
        },
        coverimage: {
            type: String , // Cloudinary URL
        },
        watchhistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, 'Password is Required']
        },
        refreshtoken: {
            type: String,
        },
    },
    {
        timestamps: true
    },
);

// This method will hash the user's password before saving.
userSchema.pre("save", async function (next) {
    if(!this.isModified('password')) 
        return next();
    this.password = await bcrypt.hash(this.password, 5)
    next()
    }
)

// This Method will check if a provided password is correct by comparing it to the Plaintext version of the stored password.
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

// This Method will be used to generate ACCESS TOKENS --> Access JWT 
userSchema.methods.generateACCESS_TOKEN = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// This Method will be used to generate REFRESH TOKENS --> Refresh JWT 
userSchema.methods.generateREFRESH_TOKEN = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User" , userSchema);
