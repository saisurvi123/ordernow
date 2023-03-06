const mongoose=require('mongoose')
const { Schema } = mongoose;

const otpverifySchema = new Schema({
  userId:String,
  otp:String,
  createdAt:Date,
  expiresAt:Date
  
});
module.exports=mongoose.model('otpverify',otpverifySchema);



