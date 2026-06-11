import { Schema, model, Types } from 'mongoose';
const ReportSchema = new Schema({ postId:{type:Types.ObjectId,ref:'Post'}, reportedBy:{type:Types.ObjectId,ref:'User'}, reason:{type:String,enum:['pornographic','piracy','violence','cyberbully','impersonation','abuse','Reported from chat']}, createdAt:{type:Date,default:Date.now} });
export default model('Report', ReportSchema);
