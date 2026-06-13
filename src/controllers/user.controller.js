import {asyncHandler} from "../utils/asyncHandler.js"
import {Apierror} from "../utils/Apierror.js"
import {user } from "../models/user.model.js"
import {uploadClooudinary} from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js"
const registerUser = asyncHandler(async(req, res)=>{//async handler is like a wrapper which will make sure controlller when through error can be daeled 
    //writing the logicbuliding for registering a user and storing it's data to database
    //step 1 getting data from frontend 
    //validating data provide by user 
    //check if user exist
    //check for images,check for avatar
    // create user obeject - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    //step 1 
    const {fullname,username,email, password} = req.body//input from frontend
    //validation 
    //we check for empty things 
    if(
        [
            fullname,email,username,password
        ].some((field)=>field.trim()==="")
    ){//this code is just for checking if any of the filed are empty 
      throw new Apierror(400 , "all field required")
    }
    //this one is for checking of existance means checking in db
    //we will check using user from model because it has access to mongoose 
    const existuser = user.findOne({//find one will check the first the given value is in the database 
        $or:[{username},{email}]//checking both username and email 
    })
    //finally checking
    if(existuser){
        throw new Apierror(409,"username or email same exist")
    }

    //checking fro image and avatar
    const avatarlocal =  req.files?.avatar[0].path;
    const coverimagelocal  =  req.files?.coverImage[0].path;

    if(!avatarlocal){
        throw new Apierror(400,"Avatar file is required")
    }
    const avatar =  await uploadClooudinary(avatarlocal)//pasing for upload in clodinary 
    const coverImage =  await uploadClooudinary(coverimagelocal)
    

    if (!avatar) {
        throw new Apierror(400,"Avatar file is required")
    }
    // storing the value in database  
    const User =  user.create({
        fullname,
        avatar:avatar.url,
        coverimage:coverImage?.url ||"",
        email,
        password,
        username:username.to_lowerCase()
    })//create is a method that take object as the input 
     //removing password and refresh token from database 
    const creteverifyuser = await user.findById(User._id).select(
        "-password  -refreshtoken"
    )
    // it is fro verifying user reation sucessful 
    if (!creteverifyuser){
       throw new  Apierror(509, "something from our end ")
    }
    // for giving the response to user 
    return res.status(201).json(//we take 201.status for because it accept for it 
        new Apiresponse(200,creteverifyuser,"user registered")
    )
})

export {registerUser}