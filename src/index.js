
import dotenv from "dotenv"
import connectDB from "./DB/index.js";
import {app} from "./app.js"
dotenv.config({
    path:'./.env'
})
console.log("MONGODB_URL:", process.env.MONGODB_URL);

connectDB()

.then(()=>{
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`O server is running at port:${process.env.PORT}`);
    })
})
.catch((err) =>{
    console.log("MONGO db connection fail!!!",err)
})