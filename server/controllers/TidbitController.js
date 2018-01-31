const Tidbit = require("../model/Tidbit");
const User = require("../model/User");

module.exports = {
    postTidbit: (req,res) => {
        let content = req.body.content;
        let googleId = req.user.googleId;
        User.findOne({'googleId': googleId}, (err, user) => {
            if (err) res.status(500).send("failed to store user")
            else {
                let tidbit = new Tidbit({
                    content: content,
                    author: user
                })
                tidbit.save((err, tidbit) => {
                    if (err) res.status(500).send("failed to store tidbit")
                    else res.redirect("/tidbits/my");
                })
            }
        })
    },

    getMyTidbits: (req,res) => {
        Tidbit.find({"author": req.user}, (err, tidbits) => {
            res.render("pages/myTidbits", {tidbits: tidbits}); 
        })
    }
}