import { Timestamp } from "mongodb";
import mongoose, { Schema } from "mongoose";
import mongooseAggergatepaginate from "mongoose-aggregate-paginate-v2"

const vedioSchema = new Schema({
  vediofile: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  tittle: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  ispublished: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
},{timestamps:true})
vedioSchema.plugin(mongooseAggergatepaginate)
export const vedio = mongoose.model("vedio", vedioSchema);
