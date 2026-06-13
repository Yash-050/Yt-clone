import mongoose,{Schema} from "mongoose";
import jwt from"jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //for database searching better 
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true, 
    },
    fullname:{
        type:String,
        required:true,
        index:true 
        
    },
    avatar:{
        type:String,//cloudanary
        required:true
    },
    coverimage:{
        type:true
    },
    watchhistory:{
        type:Schema.mongoose.Types.ObjectId,
        ref:"vedio"
    },
    password:{
        type:String,
        required:[true,'Password required']
    },
    refreshtoken:{
        type:String
    }

},{timestamps:true})

userSchema.pre("save",async function(next){//it is  aplug in which will alaways add password bef 
    if(!this.isModified("password"))return next()//checking if this not modified than next 
    this.password = await bcrypt.hash(this.password,10)
    next()
})
//comparing the password 
userSchema.methods.ispassword = async function (password) {//ceating our own method for checking if the password is coorest
    return await bcrypt.compare(password,this.password)
}

//maintaing the genrate access token  
userSchema.methods.generateAccesstoken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname 
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateREFRESHstoken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname 
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}
export const user = mongoose.model("user", userSchema)