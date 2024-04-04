import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: CLOUDINARY_CLOUD_NAME, 
  api_key: CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) 
            return "Couldn't find the specified path."
        // Upload the file on the Cloudinary :
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "video"
        })
        // File has been Uploaded Successfully.
        console.log("File has been Uploaded on Cloudinary" , response.url);
        return response
    }  
    catch (error) {
        fs.unlinkSync(localFilePath) // Remove the Locally saved Temporary Files as the uploaded operation got failed.
        return null;
    }
}

export {uploadOnCloudinary};
