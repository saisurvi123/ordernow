const mongoose = require("mongoose");
const { Schema } = mongoose;

const vendorSchema = new Schema({
  manager: {
    type: String,
    required: true,
  },
  shopname: {
    type: String,
    required: true,
    unique:true
  },
  email:{
    type: String,
    required: true,
    unique:true
  },
  password:{
    type: String,
    required: true
  },
  contactnumber:{
    type: String,
    required: true,
  },
  openingtime:{
    type: String,
    required: true,
  },
  closingtime:{
    type: String,
    required: true,
  },
  verified:{
    default:false
  }
});
module.exports=mongoose.model('vendor',vendorSchema);
