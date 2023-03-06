const mongoose = require("mongoose");
const { Schema } = mongoose;
const buyerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contactnumber:{
    type: String,
    required: true,
  },
  age:{
    type: String,
    required: true,
  },
  batch:{
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: Date.now,
  },
  password:{
    type:String,
    required:true
  },
  verified:{
    default:false
  }
});
module.exports=mongoose.model('buyer',buyerSchema);
