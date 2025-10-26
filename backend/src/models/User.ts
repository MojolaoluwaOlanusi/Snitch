import { Schema, model, Types } from 'mongoose';
const UserSchema = new Schema({
  email:{type:String,unique:true,index:true}, passwordHash:String, username:{type:String,unique:true,index:true},
  displayName:String, accountType:{type:String,enum:['Work','Personal','Business'],default:'Personal'},
  bio:String, avatarUrl:String, incognito:{type:Boolean,default:false}, isBanned:{type:Boolean,default:false},
  warningsCount:{type:Number,default:0}, isAdmin:{type:Boolean,default:false}, createdAt:{type:Date,default:Date.now}
});
export default model('User', UserSchema);
