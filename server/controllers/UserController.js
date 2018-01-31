const User = require("../model/User");

module.exports = {
    registerUser: (req,res) => {
        console.log(req.body);
        let user = new User(Object.assign({}, req.body));
        user.save((err, ret) => {
            if (err) res.status(500).send("failed to make user");
            else res.status(200).send(ret);
        });
    },

    getUsers: (req,res) => {
        User.find({}, (err, users) => {
            if (err) res.status(500).send('request failed');
            else res.send(users);
        })
    }
}