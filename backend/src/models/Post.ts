import { Schema, model, Types } from 'mongoose';
const MediaSchema = new Schema({ url:String, type:String, hls:String }, { _id:false });
const PostSchema = new Schema({
  author:{type:Types.ObjectId,ref:'User',index:true}, text:String, media:[MediaSchema], isWarp:{type:Boolean,default:false},
  repostOf:{type:Types.ObjectId,ref:'Post',default:null}, visibility:{type:String,enum:['public','followers','private'],default:'public'},
  hashtags:[String], mentions:[Types.ObjectId], likeCount:{type:Number,default:0}, commentCount:{type:Number,default:0},
  createdAt:{type:Date,default:Date.now}
});
export default model('Post', PostSchema);
