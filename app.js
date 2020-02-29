 require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const googleStrategy = require('passport-google-oauth20').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');



mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const app = express();
var posts = [];
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended:true
}));

app.use(session({
  secret: "Our little secrets",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Users = new mongoose.model("User", userSchema);

passport.use(Users.createStrategy());
passport.serializeUser((Users, done)=>{
        done(null, Users);
    });
passport.deserializeUser((Users, done)=>{
        done(null, Users);
    });


passport.use(new googleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Users.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new facebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Users.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// const secretSchema = mongoose.Schema({
//   content:String
// });
//
// const Secret = mongoose.model("secret", secretSchema);
//
app.get("/", (req, res)=>{
  res.render("home");
});

/////// googleStrategy

app.get("/auth/google",
  passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {failureRedirect: "/login"}),
  (req, res)=>{
    res.redirect("/secrets");
  });

//////// facebookStrategy/////////////

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/register", (req, res)=>{
  res.render("register");
});

app.get("/secrets", (req, res)=>{
  Users.find({"secret": {$ne:null}}, (err,result)=>{
    if (err) {
      console.log(err);
    }else {
      if (result) {
        res.render("secrets", {users:result});
      }
    }
  });
});

app.post("/register", (req, res)=>{
      const username = req.body.username;
      Users.register({username: username}, req.body.password, (err, user)=>{
        if (err) {

          res.redirect("/register");
        }else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
  });

app.get("/login", (req, res)=>{
    res.render("login");
  });

app.get("/logout", (req, res)=>{
  req.logout();
  res.redirect("/");
});

app.post("/login", (req, res)=>{
  const user = new Users({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err)=>{
    if (err) {
      console.log(err);
    }else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  })
});

app.get("/submit", (req, res)=>{
  if (req.isAuthenticated()){
    res.render("submit");
  }else {
    res.redirect("/login");
  }

});

app.post("/submit", (req, res)=>{

  Users.findById(req.user._id, (err, result)=>{
    if (err) {
      console.log(err);
    }else {
      if (result) {
        result.secret = req.body.secret;
        result.save();
        res.redirect("/secrets");
      }
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
