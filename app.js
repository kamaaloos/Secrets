require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"]
});


const Users = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", (req, res) => {
  const newUser = new Users({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({
    email: username
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          if (result.password === password) {
            res.render("secrets");
          }
        }
      }
    });
  });






let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server has started seccessfully!");
});
