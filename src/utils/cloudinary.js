import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadClooudinary = async(loacalpath)=>{
    try {
        if(!loacalpath)return null
        //upload the file on clodinary
       const response =  await cloudinary.uploader.upload(loacalpath, {
            resource_type: "auto"//for all file type
        })
        //file uploaded sucessfully
        console.log("upload sucessful",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(loacalpath)// remove the locally saved temproroy fileas operation failed 
        return null;
    }
}

export{uploadClooudinary}