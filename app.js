require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const Users = new mongoose.model("User", userSchema);

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended:true
}));

app.get("/", (req, res)=>{
  res.render("home");
});

app.get("/login", (req, res)=>{
  res.render("login");
});

app.post("")

app.get("/register", (req, res)=>{
  res.render("register");
});

app.post("/login", (req, res)=>{
  var email = req.body.username;
  var password = req.body.password;
  Users.findOne({email:email}, (err, result)=>{
      if (err) {
        console.log(result);
      } else {
        if (result.password === password) {
          res.render("secrets");
        }else {
          res.send("Waad khalady ee soo sax password-ka!!")
        }

      }
  });
});

app.post("/register", (req, res)=>{
  const newUser = new Users({
    email: req.body.username,
    password: req.body.password
  });

  Users.find({},(err,result)=>{
    const email = req.body.username;
    const password = req.body.password;
    console.log(result);
    if (result) {
      res.redirect("/login");
    }else {
      newUser.save();
      res.redirect("/login");
    }
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,()=>{
  console.log("Server has started seccessfully!");
});
