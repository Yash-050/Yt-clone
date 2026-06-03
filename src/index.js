
import dotenv from "dotenv"
import connectDB from "./DB/index.js";
dotenv.config({
    path:'./.env'
})
console.log("MONGODB_URL:", process.env.MONGODB_URL);

connectDB()