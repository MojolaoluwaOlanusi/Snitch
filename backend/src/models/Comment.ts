import { Schema, model, Types } from 'mongoose';
const MediaSchema = new Schema({ url:String, type:String }, { _id:false });
const CommentSchema = new Schema({ author:{type:Types.ObjectId,ref:'User'}, targetType:{type:String,enum:['Post','Comment']}, targetId:{type:Types.ObjectId}, text:String, media:[MediaSchema], createdAt:{type:Date,default:Date.now} });
export default model('Comment', CommentSchema);
