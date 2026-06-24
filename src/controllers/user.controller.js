
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { user } from "../models/user.model.js";
import { uploadClooudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //async handler is like a wrapper which will make sure controlller when through error can be daeled
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
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);
  const { fullname, username, email, password } = req.body; //input from frontend
  //validation
  //we check for empty things
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    
    throw new ApiError(400, "All fields are required");
  }
  //this one is for checking of existance means checking in db
  //we will check using user from model because it has access to mongoose
  const existuser = await user.findOne({
    //find one will check the first the given value is in the database
    $or: [{ username }, { email }], //checking both username and email
  });
  //finally checking
  if (existuser) {
    throw new ApiError(409, "username or email same exist");
  }

  //checking fro image and avatar
  const avatarlocal = req.files?.avatar?.[0]?.path;
  const coverimagelocal = req.files?.coverimage?.[0]?.path;

  // ✅ moved debug log here before the check
  console.log("Avatar path:", avatarlocal);
  console.log("All files:", req.files);

  if (!avatarlocal) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadClooudinary(avatarlocal); //pasing for upload in clodinary
  const coverImage = await uploadClooudinary(coverimagelocal);
  if (!avatar) {
    throw new ApiError(409, "Avatar file is required");
  }
  // storing the value in database
  const User = await user.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverImage?.url || "", // ✅ fixed: coverimage -> coverImage
    email,
    password,
    username: username.toLowerCase(),
  }); //create is a method that take object as the input
  //removing password and refresh token from database
  const creteverifyuser = await user
    .findById(User._id)
    .select("-password  -refreshtoken");
  // it is fro verifying user reation sucessful
  if (!creteverifyuser) {
    throw new ApiError(509, "something from our end ");
  }
  // for giving the response to user
  return res.status(200).json(
  new Apiresponse(200, creteverifyuser, "user registered")
);
});

//we have created it to because we are using it in many place   
const genrateAccessAndRefreshToken = async(userId)=>{
  try {
    const User =  await user.findById(userId)
    const accesstoken = User.genrateAccessAndRefreshToken()
    const refreshtoken = User.genrateAccessAndRefreshToken()

    User.refreshtoken = refreshtoken
    await User.save({validateBeforeSave : false}) //it is to store refresh token in database and validatebeforesafe option say u just save it just save it in db

    return {accesstoken, refreshtoken}
  } catch (error) {
    throw new ApiError(500, "Something went wrong while genrateating refresh and and access token")
  }
}
 // login user ready 
const loginuser = asyncHandler(async(req,res) => {
  // firstly we take input from user i.e req.body-> data  
  // username or email
  //finding the user
  //passwird check 
  //access and referesh token 
  //send cookie 

  const {email, username,password} = req.body
  //checking if user has proiveded any either usename and email 
  if(!username &&!email){
    throw new ApiError(400 , "username or email is required ")
  }
  //checking for entries in database 
   const User = await user.findOne({
    $or: [{username}, {email}]
  })
  //if not the give error 
  if (!User) {
    throw new ApiError(404, "User does not exist ");
  }

  const ispassvalid = await User.ispasswordcorrect(password);
  if (!ispassvalid) {
    throw new ApiError(404, "Invalid credential ");
  }

  const { accesstoken, refreshtoken } = await genrateAccessAndRefreshToken(
    User._id
  );

  const loggedInuser = await user
    .findById(User._id)
    .select("-password -refreshtoken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refershToken", refreshtoken, options)
    .json(
      new Apiresponse(
        200,
        { User: loggedInuser, accessToken: accesstoken, refreshtoken },
        "user logged in sucessfully"
      )
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  await user.findByIdAndUpdate(
    req.User._id,
    {
      $set: {
        refreshtoken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refershToken", options)
    .json(new Apiresponse(200, {}, "User looged out"));
});

export { registerUser, loginuser, logoutuser };