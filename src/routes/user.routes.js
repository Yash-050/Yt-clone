import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

//asking the to do the work part when called
router.route("/register").post(
  upload.fields([//this is importing the multer and using it for middleware 
    //this new part and we are only using it to take input as a image and other file
    { name: "avatar", maxCount: 1 },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);
export default router;
