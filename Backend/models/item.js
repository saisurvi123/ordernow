const mongoose = require("mongoose");
const { Schema } = mongoose;
const Vendor=require('./vendor')
const itemSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: "vendor",
  },
  shopname: {
    type:String,
    required:true
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("item", itemSchema);
