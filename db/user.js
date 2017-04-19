var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'id': String,
    'email': String,
    'password': String,
    'authed': {'type': Boolean, 'default': false},
    'auth_token': String,
    'join_date': Date
});

module.exports = mongoose.model('user', userSchema);
