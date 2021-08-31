var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        username : {type: String, required : true, unique: true},
        password : {type: String, required : true},
        posts: {type: [Schema.Types.ObjectId], ref: 'Post'},
        followers: {type: [Schema.Types.ObjectId], ref: 'User'},
        following: {type: [Schema.Types.ObjectId], ref: 'User'}
    },
    { timestamps: { createdAt: 'created_at' }}
);

module.exports = mongoose.model('User', UserSchema);