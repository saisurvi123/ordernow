const mongoose = require("mongoose");
const { Schema } = mongoose;
const Vendor=require('./vendor')
const Buyer=require('./buyer')
const orderSchema = new Schema({
  vendor: {
    type: String,
    required:true
  },
  buyer: {
    type: String,
    required:true
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
    unique: true,
  },
  quantity: {
    type: String,
    require: true,
  },
  date:{
    type:String,
     default:Date.now
  },
  ordertime:{
    type:Date
  },
  doorno:{
    type:String
  },
  locality:{
    type:String
  },
  city:{
    type:String
  },
  pincode:{
    type:String
  },
  state:{
    type:String
  },
  country:{
    type:String
  }


});
module.exports = mongoose.model("order", orderSchema);
