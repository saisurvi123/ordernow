const mongoose = require("mongoose");
const { Schema } = mongoose;
const cartitemSchema = new Schema({
  vendor: {
    type: String,
    required: true,
  },
  buyer: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("cartitem", cartitemSchema);
