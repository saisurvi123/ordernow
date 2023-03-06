const express=require('express');
const router=express.Router();
const otpverify = require("../models/otp");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer=require('nodemailer')
const { body, validationResult } = require("express-validator");
// const fetchuser=require('../middleware/fetchuser')
const moment=require('moment');
const buyer = require('../models/buyer');
const fetchbuyer = require('../middleware/fetchbuyer');
const order=require('../models/order');
const item = require('../models/item');
const cartitem = require('../models/cartitem');

// tool functions for  mailing 

let transporter=nodemailer.createTransport({
  host:"smtp.gmail.com",
  secure:false,
  auth:{
    user:"survisaikiran79@gmail.com",
    pass:"cldtfvgetdeokheq"

  },
})
// testing success
transporter.verify((err,success)=>{
  if(err){
    // console.log("failed to connect transmitter")
    console.log(err);
  }
  else{
    console.log("ready for messages")
  }
})

// for creating buyers

router.post(
    "/registerbuyer",
    [body("email").isEmail(),
    body("password").isLength({ min: 6 })],
    (req, res) => {
      console.log(req.body);
      // validation of email and passwrod
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // alert("enter valid email and password")
        return res.status(400).json({ errors: errors.array() });
      }

      // lets check for duplicates
      else{
          // creation of user
          buyer.findOne({"email":req.body.email}, (err, results) => {
              if (err) return handleError(err);
              if (results) {
                // alert("entered email is already in use")
                return res.send({ error: "enetered email is already in use" });
              } else {
                
                const salt = bcrypt.genSaltSync(10);
                const secPass= bcrypt.hashSync(req.body.password,salt);
                const user1 = new buyer({
                    name:req.body.name ,
                    email:req.body.email ,
                    contactnumber:req.body.contactnumber,
                    password:secPass,
                    age:req.body.age,
                    batch:req.body.batch,
                    verified:false
                });
                var token = jwt.sign({id:user1.id}, 'shskdfjaoeruwo');
                // console.log(token);
                user1.save().then((result)=>{
                  
                  result.token=token;
                  // console.log(result);
                  sendotp(result,res); 
                })
                // res.send({ success: "User created successfully",authtoken:token });
                // res.end();
              }
            });
          }
      }
      
  );

// logging users

  router.post("/loginbuyer",[body("email").isEmail(),
  body("password").exists()],(req,res)=>{
      console.log(req.body);
      // validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      else{
          // creation of user
          buyer.findOne({"email":req.body.email}, (err, results) => {
              if (err) return handleError(err);
              if (!results){
                return res.send({ error: "1pls enter valid credentials" });
              } else {
               
               const passcomp=bcrypt.compareSync(req.body.password,results.password);
               console.log(passcomp)
               if(!passcomp){
                console.log(req.body.password);
                console.log(results.password);
                return res.send({ error: "2pls enter valid credentials" });
               }
               else{
                  var token = jwt.sign({id:results.id}, 'shskdfjaoeruwo');
                  console.log(token);
                  res.send({authtoken:token});
               }
              }
            });
          }
      }
  )
  // getting details of users
  
  // router.post("/getUser",fetchuser,(req,res)=>{
  //     console.log(req.user)
  //     // console.log(req.user);
  //     const userid=req.user.id;
  //     User.findById({_id:userid},(err,results)=>{
  //         if(results){
  //             console.log(results);
  //             res.send(results);
  //         }
  //         else{
  //             res.status(401).send({error:"pls authenticate properly"})
  //         }
  //     }).select("-password")
      
  // })
  
 // sending otp to mails

const sendotp= async({_id,email,token},res)=>{
  const Otp=`${Math.floor(1000+Math.random()*9000)}`;
  console.log(token)
  const mailoptions={
    from:"survisaikiran79@gmail.com",
    to:email,
    subject:"verifying your email as a buyer by OrderNow",
     html:`<p> enter the <b>${Otp}</b> in web to verify your email address</p>
     <p>  OTP <b> expires</b> in 1 hour</p>`
  }
  const newotp=new otpverify({
    userId:_id,
    otp:Otp,
    createdAt:Date.now(),
    expiresAt:moment(Date.now()).add(30, 'm').toDate()
  });
  await newotp.save();
  await transporter.sendMail(mailoptions);
  
   res.send({
    authtoken:token,
    status:"pending",
    message:"verification otp mail sent",
    data:{
       userId:_id,
       email:email
    },
    success: "User created successfully"
   }
   )
  //  res.end();
}

// verifying otp based on entry
router.post('/verifybuyerotp',async(req,res)=>{
  try {
    let {userId,otp}=req.body;
    if(!userId || !otp){
       throw Error("empty otp details are not allowed")
    }
    else{
      console.log("here")
      const rec=await otpverify.find({
        userId,
      });
      if(rec.length<=0){
        return res.send({
          error:"acc records not found"
        })
      }
      else{
        const {expiresAt}=rec[0];
        const OTP=rec[0].otp;
        if(expiresAt<Date.now()){
          await otpverify.deleteMany({userId});
          return res.send({
            error:"time expired"
          })
        }
        else{
          if(otp===OTP){
            await buyer.updateOne({_id:userId},{verified:true});
            await otpverify.deleteMany({userId});
            res.json({
              status:"VERIFIED",
              message:"User email verified successfully"
            })
          }
          else{
            throw Error("incorrect otp");
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
     res.send(error);
  }
})


router.post("/createorder",fetchbuyer,[
  body("quantity").isLength({ min: 1 })
],(req,res)=>{
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userid = req.user.id;
    const itemid=req.body.itemid;
    // no need for checking duplicates
    // now find vendor name 
    item.findOne({_id:itemid},(err,resu)=>{
      if(err){
        return res.send({error:"error in id of the item"})
      }
      const order1=new order({
        buyer:userid,
        vendor:resu.vendor.toString(),
        name:resu.name,
        price:resu.price,
        ordertime:Date.now(),
        quantity:req.body.quantity,
        doorno:req.body.doorno,
        locality:req.body.locality,
        city:req.body.city,
        pincode:req.body.pincode,
        state:req.body.state,
        country:req.body.country
      });
      order1.save();
      return res.send(order1);
    })
    
})



// fetchall fooditems available on site

router.get("/fetchallitems",(req,res)=>{
  item.find({},(err,results)=>{
    if(err){
      return res.send({error:"error in fetching all items of site"})
    }
    res.send(results);
  })
})

// fetch all orders
router.get("/fetchmyorders",fetchbuyer,(req,res)=>{
  const userid = req.user.id;
  order.find({buyer:userid},(err,result)=>{
    if(err){
      return res.send({error:"error in finding orders of user"})
    }
    return res.send(result);
  })

})



// cancel order
router.delete("/cancelorder/:id",fetchbuyer,(req,res)=>{
 
  //first check which user is updating the given notes id
  order.findById({_id:req.params.id},(err,result)=>{
    if (err) return console.log(err);
    if(result.buyer.toString()!==req.user.id){
      return res.status(401).send("permission rejected");
    }
    else{
        order.findByIdAndDelete({_id:req.params.id},(err,result)=>{
          if(err) return handleError(err);
          else{
            // console.log("cool")
            return res.send({Message:"deletion success"});
          }
        })      
    }
  })
  

})


// add to cart
router.post("/addtocart/:id",fetchbuyer,(req,res)=>{
  // first check if it is already present in cart
  // console.log(req.user.id);
  console.log(req.params.id);
  
  cartitem.find({buyer:req.user.id},(err,result)=>{
    if(err)return res.send({error:"error in fetching cartitems"});
    if(!result){
      return res.send({error:"already added to cart"})
    }
    // now check for item in items database collection
    item.findById({_id:req.params.id},(err,resu)=>{
      const cartitem1=new cartitem({
        vendor:resu.vendor,
        buyer:req.user.id,
        name:resu.name,
        price:resu.price,
        description:resu.description
      })
      cartitem1.save();
      return res.send(cartitem1);
    });
  })
})
// fetch my cart items
router.get("/fetchcartitems",fetchbuyer, (req,res)=>{
  cartitem.find({buyer:req.user.id},(err,results)=>{
    if(err)return res.send({error:"error in fetching cart items"})
    res.send(results);
  })
  
})



module.exports=router