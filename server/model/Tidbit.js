var mongoose = require('mongoose');
var User = require('./User');
var Schema = mongoose.Schema;

var tidbitSchema = new Schema({
    content: String,
    author: {type: Schema.Types.ObjectId, ref: "User"}
});

var Tidbit = mongoose.model("Tidbit", tidbitSchema);
module.exports = Tidbit