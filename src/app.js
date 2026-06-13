import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //for json
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //for url storing
app.use(express.static("public")); //for folder
app.use(cookieParser());

//routes importing

import userRouter from "./routes/user.routes.js";

//routes decleration
app.use("/api/v1/users", userRouter); //telling the app when /user url then pass the control to user touter to handle the tasks effectiveyly
export { app };
