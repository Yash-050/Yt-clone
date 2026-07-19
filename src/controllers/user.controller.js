import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { user } from "../models/user.model.js";
import { uploadClooudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
import { subscription } from "../models/subscription.model.js";

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
  return res
    .status(200)
    .json(new Apiresponse(200, creteverifyuser, "user registered"));
});

//we have created it to because we are using it in many place
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const User = await user.findById(userId);

    console.log("User:", User);

    const accesstoken = User.generateAccesstoken();
    console.log("Access token generated");

    const refreshtoken = User.generateREFRESHstoken();
    console.log("Refresh token generated");

    User.refreshtoken = refreshtoken;

    await User.save({ validateBeforeSave: false });
    console.log("User saved");

    return { accesstoken, refreshtoken };
  } catch (error) {
    console.error("Actual Error:", error);
    throw error;
  }
};
// login user ready
const loginuser = asyncHandler(async (req, res) => {
  // firstly we take input from user i.e req.body-> data
  // username or email
  //finding the user
  //passwird check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  //checking if user has proiveded any either usename and email
  if (!username && !email) {
    throw new ApiError(400, "username or email is required ");
  }
  //checking for entries in database
  const User = await user.findOne({
    $or: [{ username }, { email }],
  });
  //if not the give error
  if (!User) {
    throw new ApiError(404, "User does not exist ");
  }

  const ispassvalid = await User.ispasswordcorrect(password);
  if (!ispassvalid) {
    throw new ApiError(404, "Invalid credential ");
  }

  const { accesstoken, refreshtoken } = await generateAccessAndRefreshToken(
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
    .cookie("refreshToken", refreshtoken, options)
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
    .clearCookie("refreshToken", options)
    .json(new Apiresponse(200, {}, "User logged out"));
});
//in it we are doing like if the timing of user has been more the the time for accesss token than then either we an throw error to user to re login or i can just (frontend ) can fet endpoint where it will verify the whole token and if exist then will genrate a new one
const refreshaccesstoken = asyncHandler(async (req, res) => {
  const incomingrefreshtoken = req.cookie.refreshtoken || req.body.refreshtoken;

  if (!incomingrefreshtoken) {
    throw new ApiError(401, "unauthorized request");
  }
  //accessing the decoding value to match from db using jwt
  const decodedtoken = jwt.verify(
    incomingrefreshtoken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const User = await user.findById(decodedtoken?._id);
  if (!User) {
    throw new ApiError(401, "Unauthorized request");
  }
  if (incomingrefreshtoken !== User.refreshtoken) {
    throw new ApiError(401, "refresh token is expired");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, newrefreshtoken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refreshToken", newrefreshtoken, options)
    .json(
      new Apiresponse(
        200,
        { accessToken, refreshtoken: newrefreshtoken },
        "Access token refreshed "
      )
    );
});
//changing the password of user's accout
const changepassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body; //for giving the old and the new pass to the body

  const User = await user.findById(req.User?._id); //storing the id into the User

  const ispasswordcorrect = await User.ispasswordcorrect(oldpassword);
  if (!ispasswordcorrect) {
    throw new ApiError(400, "invalid olld pass");
  }
  User.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, {}, "Password Changed successfully"));
});

const getcurrentuser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.User, "Current user fetched");
});

const updateccountdetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email) {
    throw new ApiError(400, "All fields are required");
  }
  const User = user
    .findByIdAndUpdate(
      req.User?._id,
      {
        $set: {
          fullname,
          email,
        },
      },
      { new: true }
    )
    .select("-password");

  return res.status(200).json(new Apiresponse(200, User, "Account detail"));
});
//updating the file rather than the text
const updateUseravatar = asyncHandler(async (req, res) => {
  const avatarlocalpath = req.file?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar file is missing ");
  }
  const avatar = await uploadClooudinary(avatarlocalpath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const User = await user
    .findByIdAndUpdate(req.User?._id, {
      $set: {
        avatar: avatar.url,
      },
    })
    .select("-password");
  return res
    .status(200)
    .json(new Apiresponse(200, "avatar updated sucessfully "));
});
const updateusercoverimg = asyncHandler(async (req, res) => {
  const coverimagelocalpath = req.file?.path;
  if (!coverimagelocalpath) {
    throw new ApiError(400, "avatar file is missing ");
  }
  const avatar = await uploadClooudinary(coverimagelocalpath);
  if (!coverimage.url) {
    throw new ApiError(400, "Error while uploading on image");
  }
  const User = await user
    .findByIdAndUpdate(req.User?._id, {
      $set: {
        coverimage: coverimage.url,
      },
    })
    .select("-password");

  return res
    .status(200)
    .json(new Apiresponse(200, "coverimage updated sucessfully "));
});

//now we are starting the user channel and subscriber profile it will show the profile details and all
 const getuserchannelprofile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    // Validate username parameter
    if (!username?.trim()) {
      throw new ApiError(400, "Username is required");
    }

    // Extract current user ID for subscription check (handle unauthenticated cases)
    const currentUserId = req.user?._id || null;

    // Execute aggregation pipeline
    const channelAggregationResult = await user.aggregate([
      {
        $match: {
          username: username.toLowerCase().trim(),
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTO"
        }
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          channelsubscribedtocount: { $size: "$subscribedTO" },
          issubscribed: {
            $cond: {
              if: { $in: [currentUserId, "$subscribers.subscriber"] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscribersCount: 1,
          channelsubscribedtocount: 1,
          issubscribed: 1
        }
      }
    ]);

    // Handle case where channel doesn't exist
    const channel = channelAggregationResult[0];
    if (!channel) {
      throw new ApiError(404, "Channel not found");
    }

    // Return successful response
    return res.
    status(200).json(
      new Apiresponse(200,channel[0],"User channel fetched sucessfully ")
    )
    
  });
  console.log(getuserchannelprofile)
export {
  registerUser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  changepassword,
  getcurrentuser,
  updateUseravatar,
  updateusercoverimg,
  updateccountdetail,
  getuserchannelprofile,
};
