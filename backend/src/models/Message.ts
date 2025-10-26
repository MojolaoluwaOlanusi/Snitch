import { Schema, model, Types } from 'mongoose';
const MessageSchema = new Schema({
  threadId:{type:Types.ObjectId,ref:'Thread'}, sender:{type:Types.ObjectId,ref:'User'}, body:String,
  attachments:[{url:String,type:String}], readBy:[Types.ObjectId], createdAt:{type:Date,default:Date.now}
});
export default model('Message', MessageSchema);
export const Thread = model('Thread', new Schema({ participants:[Types.ObjectId], lastMessageAt:Date, createdAt:{type:Date,default:Date.now} }));
