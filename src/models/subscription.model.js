import { ObjectId } from "mongodb"
import mongoose ,{Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber:{
        type :Schema.Types.ObjectId, //subscriber
        ref:"user"
    },
    channel :{
         type: Schema.Types.ObjectId,
         ref: "user"
    }
},{
    timestamps:true
})

export const  subscription = mongoose.model("Subscription", subscriptionSchema)