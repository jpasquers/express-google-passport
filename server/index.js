const express = require("express");
const bodyParser = require('body-parser');
const http = require("http");
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const User = require("./model/User");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const GoogleStrategy = require("./GoogleStrategy");
const TidbitController = require("./controllers/TidbitController");
const UserController = require("./controllers/UserController");

const googleStrat = new GoogleStrategy();
passport.use(googleStrat);


passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

let loggedIn = (req,res,next) => {
    if (req.user) {
        next();
    }
    else {
        googleStrat.redirectToGoogle(req,res);
    }
}

const app = express();

mongoose.connect('mongodb://localhost/expressApp');

app.use(express.static('views/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSession({secret: "keyboard cat"}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');


app.get('/auth/google', 
    (req, res) => {googleStrat.redirectToGoogle(req,res)}
);
  
app.get('/auth/google/callback',
    passport.authenticate("myGoogleStrategy", { failureRedirect: "login.html"}),
    (req,res,next) => {
        let redirectUri = req.query.state.split("|")[1];
        res.redirect(redirectUri);
    }
);

app.get("/", loggedIn, (req, res) => {
    res.render("pages/index", {email: req.user.email});
})


app.get("/flipString", (req,res) => {
   res.send(req.query.q.split("").reverse().join(""));
})

app.get('/logout', function(req, res){
    req.logout();
    res.redirect("/login.html");
});

app.get("/tidbits/my", loggedIn, TidbitController.getMyTidbits);
app.post("/postTidbit", loggedIn, TidbitController.postTidbit);

app.get("/tidbit", loggedIn, (req, res) => { 
    res.render("pages/postTidbit"); 
});

app.get("*", loggedIn, (req,res) => {
    res.redirect("/");
})

//actually start the server
const port = 8082;

app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => {
    console.log("listening on port " + port);
})