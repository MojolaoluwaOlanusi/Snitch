import { Schema, model, Types } from 'mongoose';
const WarningSchema = new Schema({ userId:{type:Types.ObjectId,ref:'User'}, issuedBy:{type:Types.ObjectId,ref:'User'}, reason:String, createdAt:{type:Date,default:Date.now} });
export default model('Warning', WarningSchema);
