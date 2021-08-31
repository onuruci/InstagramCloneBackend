var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new Schema(
    {
        paragraph: {type: String, default: ""},
        photo: {type:String, default:""},
        likes: {type: Number, default: 0},
        comments : {type: [Schema.Types.ObjectId], ref: 'Comment'},
        owner: {type: Schema.Types.ObjectId, ref: 'User'}
    },
    { timestamps: { createdAt: 'created_at' }}
);

module.exports = mongoose.model('Post', PostSchema);