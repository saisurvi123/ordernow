const mongoose=require('mongoose');
const mongoURI="mongodb://localhost:27017/OrderNow";
// this is how we connect to mongo
const connectToMongo=()=>{
    mongoose.connect(mongoURI,()=>{
        console.log("connected to database");
    })
}

module.exports= connectToMongo;