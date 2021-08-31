var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CommentSchema = new Schema(
    {
        paragraph: {type: String, default: ""},
        photo: {type:Schema.Types.ObjectId, ref: 'Post'},
        owner: {type: Schema.Types.ObjectId, ref: 'User'}
    },
    { timestamps: { createdAt: 'created_at' }}
);

module.exports = mongoose.model('Comment', CommentSchema);