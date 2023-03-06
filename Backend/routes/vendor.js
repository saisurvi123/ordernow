const express = require("express");
const router = express.Router();
const otpverify = require("../models/otp");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
// const fetchuser=require('../middleware/fetchuser')
// const multer = require("multer");
const moment = require("moment");
const vendor = require("../models/vendor");
const item = require("../models/item");
const cartitem=require("../models/cartitem")
const stream = require('stream');
const multer = require('multer');
const { google } = require('googleapis');
const fetchvendor = require("../middleware/fetchvendor");
// storage of image
const Storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
// upload
// const upload = multer({
//   storage: Storage,
// }).single("foodimage");
// // tool functions for  mailing

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    user: "survisaikiran79@gmail.com",
    pass: "cldtfvgetdeokheq",
  },
});
// testing success
transporter.verify((err, success) => {
  if (err) {
    // console.log("failed to connect transmitter")
    console.log(err);
  } else {
    console.log("ready for messages");
  }
});

// for creating vendors

router.post(
  "/registervendor",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  (req, res) => {
    console.log(req.body);
    // validation of email and passwrod
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // alert("enter valid email and password")
      return res.status(400).json({ errors: errors.array() });
    }

    // lets check for duplicates
    else {
      // creation of user
      vendor.findOne({ email: req.body.email }, (err, results) => {
        if (err) return res.send(err);
        if (results) {
          // alert("entered email is already in use")
          return res.send({ error: "enetered email is already in use" });
        } else {
          const salt = bcrypt.genSaltSync(10);
          const secPass = bcrypt.hashSync(req.body.password, salt);
          const user1 = new vendor({
            manager: req.body.manager,
            shopname: req.body.shopname,
            email: req.body.email,
            password: secPass,
            contactnumber: req.body.contactnumber,
            openingtime: req.body.openingtime,
            closingtime: req.body.closingtime,
            verified: false,
          });
          var token = jwt.sign({ id: user1.id }, "shskdfjaoeruwo");
          // console.log(token);
          user1.save().then((result) => {
            result.token = token;
            // console.log(result);
            sendotp(result, res);
          });
          // res.send({ success: "User created successfully",authtoken:token });
          // res.end();
        }
      });
    }
  }
);

// logging users

router.post(
  "/loginvendor",
  [body("email").isEmail(), body("password").exists()],
  (req, res) => {
    console.log(req.body);
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      // creation of user
      vendor.findOne({ email: req.body.email }, (err, results) => {
        if (err) return res.send(err);
        if (!results) {
          return res.send({ error: "pls enter valid credentials" });
        } else {
          const passcomp = bcrypt.compareSync(
            req.body.password,
            results.password
          );
          if (!passcomp) {
            return res.send({ error: "pls enter valid credentials" });
          } else {
            var token = jwt.sign({ id: results.id }, "shskdfjaoeruwo");
            console.log(token);
            res.send({ authtoken: token });
          }
        }
      });
    }
  }
);
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

const sendotp = async ({ _id, email, token }, res) => {
  const Otp = `${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(token);
  const mailoptions = {
    from: "survisaikiran79@gmail.com",
    to: email,
    subject: "verifying your email as a vendor by OrderNow",
    html: `<p> enter the <b>${Otp}</b> in web to verify your email address</p>
     <p>  OTP <b> expires</b> in 1 hour</p>`,
  };
  const newotp = new otpverify({
    userId: _id,
    otp: Otp,
    createdAt: Date.now(),
    expiresAt: moment(Date.now()).add(30, "m").toDate(),
  });
  await newotp.save();
  await transporter.sendMail(mailoptions);

  res.send({
    authtoken: token,
    status: "pending",
    message: "verification otp mail sent",
    data: {
      userId: _id,
      email: email,
    },
    success: "User created successfully",
  });
  //  res.end();
};

// verifying otp based on entry
router.post("/verifyvendorotp", async (req, res) => {
  try {
    let { userId, otp } = req.body;
    if (!userId || !otp) {
      throw Error("empty otp details are not allowed");
    } else {
      console.log("here");
      const rec = await otpverify.find({
        userId,
      });
      if (rec.length <= 0) {
        return res.send({
          error: "acc records not found",
        });
      } else {
        const { expiresAt } = rec[0];
        const OTP = rec[0].otp;
        if (expiresAt < Date.now()) {
          await otpverify.deleteMany({ userId });
          return res.send({
            error: "time expired",
          });
        } else {
          if (otp === OTP) {
            await vendor.updateOne({ _id: userId }, { verified: true });
            await otpverify.deleteMany({ userId });
            res.json({
              status: "VERIFIED",
              message: "User email verified successfully",
            });
          } else {
            throw Error("incorrect otp");
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

//fetch my fooditems
router.get("/fetchmyfooditems", fetchvendor, (req, res) => {
  const vendorid = req.user.id;
  item.find({ vendor: vendorid }, (err, results) => {
    if (err) {
      return res.send({ error: "error in fetching vendors foodies" });
    }
    res.send(results);
  });
});

// adding new foodm items
router.post(
  "/addnewitem",
  fetchvendor,
  [
    body("name").isLength({ min: 1 }),
    body("price").isLength({ min: 1 }),
    body("description").isLength({ min: 1 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userid = req.user.id;
    // lets check for duplicates
    item.findOne(
      {
        name: req.body.name,
      },
      (err, result) => {
        if (err) return res.send(err);
        if (result) {
          return res.status(400).send({ error: "already same item exists" });
        } else {
          // lets find the shopname as well to store in item schema
          vendor.findOne({ _id: userid }, (err, resu) => {
            if (err) {
              return res.send({ error: "error in finding shopname" });
            }
            const item1 = new item({
              vendor: userid,
              shopname: resu.shopname,
              name: req.body.name,
              description: req.body.description,
              price: req.body.price,
            });
            item1.save();
            res.send(item1);
          });
        }
      }
    );
  }
);

router.put("/updateitem/:id", fetchvendor, (req, res) => {
  const { name, description, price } = req.body;
  const newnote = {};
  if (name) {
    newnote.name = name;
  }
  if (description) {
    newnote.description = description;
  }
  if (price) {
    newnote.price = price;
  }
  //first check which user is updating the given notes id
  item.findById({ _id: req.params.id }, (err, result) => {
    if (err) return res.send({error:"no such id"});
    console.log(result);
    if (result.vendor.toString() !== req.user.id) {
      return res.status(401).send("permission rejected");
    } else {
      // once checked then update
      console.log(req.params.id);
      item.findByIdAndUpdate(
        { _id: req.params.id },
        { $set: newnote },
        { new: true },
        (err, result) => {
          if (err) return res.send(err);
          else {
            console.log("cool");
            return res.send(newnote);
          }
        }
      );
    }
  });
});

// delete the item
router.delete("/deleteitem/:id", fetchvendor, (req, res) => {
  //first check which user is updating the given notes id
  item.findById({ _id: req.params.id }, (err, result) => {
    if (err) return console.log(err);
    if (result.vendor.toString() !== req.user.id) {
      return res.status(401).send("permission rejected");
    } else {
      item.findByIdAndDelete({ _id: req.params.id }, (err, result) => {
        if (err) return res.send(err);
        else {
          console.log("cool");
          return res.send({ Message: "deletion success" });
        }
      });
    }
  });
});
// uploading images part



const upload = multer();

const uploadFile = async (fileObject) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);
  const { data } = await google.drive({ version: 'v3' }).files.create({
    media: {
      mimeType: fileObject.mimeType,
      body: bufferStream,
    },
    requestBody: {
      name: fileObject.originalname,
      parents: ['DRIVE_FOLDER_ID'],
    },
    fields: 'id,name',
  });
  console.log(`Uploaded file ${data.name} ${data.id}`);
};






router.post("/uploadimage",upload.any(), async(req,res)=>{
  console.log(req.files)
  try {
    const { body, files } = req;
    for (let f = 0; f < files.length; f += 1) {
      await uploadFile(files[f]);
    }

    console.log(body);
    res.status(200).send('Form Submitted');
  } catch (f) {
    res.send(f.message);
  }

})

module.exports = router;
