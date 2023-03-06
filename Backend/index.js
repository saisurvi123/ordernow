const express = require("express");
const connectToMongo = require("./db");
const cors=require('cors');
connectToMongo();
const app = express();
app.use(cors());
const port = 5000;
app.use(express.json());

// available routes in a modular way
// routes for authentication
app.use("/api/vendor",require("./routes/vendor"))
app.use("/api/buyer", require("./routes/buyer"));
app.get('/',(req,res)=>{
    res.send("hello akhil")
})

// app.use('/api/notes',require('./routes/item'));

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});