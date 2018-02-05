const Strategy = require("passport-strategy");
const CustomStrategy = require("passport-custom");
const randomstring = require("randomstring");
const request = require("request");
const queryString = require('query-string');
const util = require("util");
const jwt = require("jsonwebtoken");
const User = require("./model/User");

/*General flow:
1) User hits /auth/google which eventually calls GoogleStrategy.authenticate()
2) authenticate() redirects the user to the Google Auth site with a redirect url of /auth/google/callback.
3) User Authenticates with their google uname/passwd (and allows our app to get certain information from them).
4) Google redirects the user back to /auth/google/callback/ and adds in a 'code' as a query parameter (represents the authorization code) 
5) /auth/google/callback calls authenticate() which sees the 'code' and calls _verify()
6) _verify() makes a request to Google's token generator containing the code as well as our app's id/secret.
7) Google returns an id_token (along with other info) which is a JWT of the user 
8) _verify() decodes this id_token, and extracts the user's id. 
9) _verify() then either fetches the user if it exists, or creates a new user from the id and email.
10) passport then takes over and sets a cookie with the user_id, and uses that to reestablish the user for each request (stored in req.user)
11) Every subsequent request passes through a function which checks for req.user, if it exists move along, if not redirect back to login.html
12) Cookie is removed upon logging out (or timeout probably...)*/

function GoogleStrategy() {
    //We include this state in our redirect to google. Google then includes it in its redirect back to us,
    //This is basically an anti-forgery token. 
    //Ideally we would also include a 'nonce' to protect against replays, but this isn't required and isn't necessary for demo.
    this.state = randomstring.generate({length: 30, charset: "alphabetic"});
    //This is an id/secret for our application (express test app i think). I don't care if people know it, this is a throwaway app
    this.clientID = "701304563962-dafuidec0j06gktfp8kff9bkr4huu830.apps.googleusercontent.com";
    this.clientSecret = "SXUPClFWB5CNfUy6D4czyFAu";
    //The uri Google redirects the user to after authentication. Google will add in various query params that include what we need.
    this.redirectUri = "http://localhost:8082/auth/google/callback";
    //Where we forward the user to authenticate with google.
    this.googleAuthUri = "https://accounts.google.com/o/oauth2/v2/auth";
    //Where we make a request with the user's 'code' to get our tokens.
    this.googleTokenUri = "https://www.googleapis.com/oauth2/v4/token";
    Strategy.call(this);
    this.name= "myGoogleStrategy";
}

GoogleStrategy.prototype._verify = function (req, done) {
    if (req.query.state.split("|")[0] == this.state) {
        console.log("states match, valid request");
        let props = {
            //the code is returned by google. It, in combination with our app's id and secret,
            //can be used to get an id_token for the user. 
            code: req.query.code,
            client_id: this.clientID,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: "authorization_code"
        }
        request({
            uri: this.googleTokenUri,
            method: "POST",
            qs: props
        }, (err, res, body) => {
            if (err) done(err, {}, {});
            else {
                console.log("found jwt user");
                //the id_token is a JWT token of the user. Ideally one would verify the token as well,
                //but I ignored that for now.
                let JWT_user = jwt.decode(JSON.parse(body).id_token);
                //We know this is a valid google user now, either fetch the user or create
                //a new user in our db (if we dont have them). Either way return the resulting user. 
                User.findOne({"googleId": JWT_user.sub}, (err, user) => {
                    if (err || user == null) {
                        let user = new User({email: JWT_user.email, googleId: JWT_user.sub});
                        user.save((err, user) => {
                            if (err) done(err, null);
                            else done(null, user);
                        })
                    }
                    else {
                        done(null, user);
                    }
                })
            }
        });
    }
    else {
        done("states did not match", {}, {});
    }
}

GoogleStrategy.prototype.authenticate = function(req, options) {
    console.log("in authenticate");
    //callback coming after user authenticated with google.
    //Use the returned code to retrieve a JWT token describing the user
    if (req.query.code) {
        let verified = (err, user, info) => {
            if (err) this.fail(err);
            else {
                console.log("found user");
                console.log(user);
                this.success(user, info);
            }
        }

        this._verify(req, verified);
    }
}

GoogleStrategy.prototype.redirectToGoogle = function(req,res) {
    console.log("in redirect to google");
    console.log(req.path);
    let props = {
        client_id: this.clientID,
        response_type: "code",
        scope: "openid email",
        redirect_uri: this.redirectUri ,
        state: this.state + "|" + req.path
    }
    res.redirect(this.googleAuthUri + "?" +  queryString.stringify(props));
}

util.inherits(GoogleStrategy, Strategy);

module.exports = GoogleStrategy;