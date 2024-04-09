import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) 
            return "Couldn't find the specified path."
        // Upload the file on the Cloudinary :
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })
        // File has been Uploaded Successfully.
        fs.unlinkSync(localFilePath)
        return response
    }  
    catch (error) {
        fs.unlinkSync(localFilePath) // Remove the Locally saved Temporary Files as the uploaded operation got failed.
        return null;
    }
}

export { uploadOnCloudinary };
