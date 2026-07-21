import { Router } from "express";
import {
  changepassword,
  getcurrentuser,
  getWatchHistory,
  loginuser,
  logoutuser,
  registerUser,
  updateccountdetail,
  updateUseravatar,
  updateusercoverimg,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { refreshaccesstoken } from "../controllers/user.controller.js";
const router = Router();

//asking the to do the work part when called
router.route("/register").post(
  upload.fields([
    //this is importing the multer and using it for middleware
    //this new part and we are only using it to take input as a image and other file
    { name: "avatar", maxCount: 1 },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginuser);
//secured routes
router.route("/logout").post(verifyjwt, logoutuser); //it means the middleware will verify if the user exist and if then log him out and it uses verifyjwt first and logout just after it
router.route("/refresh-token").post(refreshaccesstoken);
router.routes("/changepass").post(verifyjwt, changepassword);
router.route("/current-user").get(verifyjwt, getcurrentuser);
router.route("/update-acc").patch(verifyjwt, updateccountdetail); //if post used then it will upf=date all
router
  .route("/avatar-change")
  .patch(verifyjwt, upload.single("avatar"), updateUseravatar);
router
  .route("/cover-image")
  .patch(verifyjwt, upload.single("/coverimage"), updateusercoverimg);
router.route("/c/:username").get(verifyjwt, getcurrentuser);
router.route("/history").get(verifyjwt, getWatchHistory);
export default router;
