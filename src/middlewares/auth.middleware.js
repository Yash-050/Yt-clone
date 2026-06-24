// Middleware ka kaam hai check karna:
// "Kya request bhejne wala user login hai ya nahi?"

import { user } from "../models/user.model";
import { ApiError } from "../utils/Apierror";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyjwt = asyncHandler(async (req, res, next) => {
  try {

    // Cookie ya Authorization header se token nikal lo
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Agar token hi nahi mila to user logged in nahi hai
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Token verify karo using secret key
    // Verify hone ke baad token ke andar stored data mil jayega
    const decodedtoken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Token se user id nikali aur DB me user dhunda
    const User = await user
      .findById(decodedtoken?._id)
      .select("-password -refreshtoken");

    // Agar user DB me nahi mila to token invalid hai
    if (!User) {
      throw new ApiError(401, "Invalid access token");
    }

    // User ko request object me attach kar diya
    // Taaki next controller directly use kar sake
    req.User = User;

    // Authentication successful
    // Ab next middleware/controller par jao
    next();

  } catch (error) {

    // Token expired, invalid ya koi aur auth error
    throw new ApiError(
      401,
      error?.message || "Invalid access token"
    );
  }
});