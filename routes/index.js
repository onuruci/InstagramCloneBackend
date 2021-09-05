var express = require('express');
var router = express.Router();

const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

var UserModel = require('../models/user');
var PostModel = require('../models/post');
var CommentModel = require('../models/comment');


const bcrypt = require('bcryptjs');
var multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public');
    },
    filename: (req, file, cb) => {
        const fileName = req.body.postid;
        cb(null, 'newfile.png');
    }
});

var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(req.body);
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});



const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if(typeof bearerHeader !== 'undefined')
  {
      const bearer = bearerHeader.split(' ');

      const bearerToken = bearer[1];

      req.token = bearerToken;

      next();
  }
  else {
      res.json({
        err: 1,
        message: 'Wrong'
      });
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    message: "Welcome"
  });
});

router.post('/sign-up', [
  body('username', 'Username can not be empty').trim().isLength({min : 1}).escape(),
  body('password', 'Username can not be empty').trim().isLength({min : 1}).escape(),
  async (req, res, next) => {
    const errors = validationResult(req);

    var user = new UserModel({
      username: req.body.username,
      password: req.body.password
    });

    console.log(user);

    var conUser = await UserModel.findOne({username: user.username });
    console.log(conUser);

    if(!errors.isEmpty()){
      res.json({
        message: "Error"
      });
      return;
    }
    else if(conUser !== null)
    {
      res.json({
        message: "User already exists",
        user: conUser,
        error: 1,
        loggedIn: 0
      });
    }
    else {
      bcrypt.hash(user.password, 10, function(err, hash) {
        if(err) {return next(err)}
        
        user.password = hash;
        console.log(user);
        user.save(err => {
          if(err) {return next(err)}

          fs.mkdir('public/users/'+user._id, err => {
            if(err) {return next(err)}
            fs.mkdir('public/users/'+user._id+'/posts', err => {
              if(err) {return next(err)}
              fs.mkdir('public/users/'+user._id+'/profile', err => {
                fs.copyFile('public/profile.png', 'public/users/' +user._id +'/profile/profile.png', err => {
                  if(err) {return next(err)}
                    res.json({
                      message: "Successfull",
                      user: user,
                      error: 0,
                      loggedIn: 1
                  });
                  return;
                })
              });
            })
          })
        });
      });
    }
  }
]
);

router.post('/log-in', [
  body('username', 'Username can not be empty').trim().isLength({min : 1}).escape(),
  body('password', 'Username can not be empty').trim().isLength({min : 1}).escape(),
  async (req, res) => {
    const errors = validationResult(req);
    const user = await UserModel.findOne({username : req.body.username});


    if(!errors.isEmpty())
    {
      res.json({
        error: 1,
        message: "Error"
      });
    }
    else if(user === null)
    {
      res.json({
        message: "No user found",
        error: 1,
        loggedIn: 0
      });
      return;
    }
    else {
      bcrypt.compare(req.body.password, user.password, function(err, result) {
        // res === false
        console.log(result);
        if(err){ {
          res.json({
            err: err
          })
          return;
        }}
        else if(result === true){
          jwt.sign({user : user}, process.env.SECRET_KEY, {expiresIn: '2 days'}, (err, token) => {
            if(err){
              res.json({
                err: err
              });
              return err;
            }
            res.json({
              token: token,
              success: 1,
              message: "succesfully connected"
            });
          })
        }
        else{
          res.json({
            message: "Not equal"
          });
        }
        return;
      });
    }
  }
]);

router.get('/main-page', verifyToken,(req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
    if(err){
      res.json({
        error: 1,
        message: 'Something is wrong'
      });
    }
    else{
      res.json({
        message: 'Succesfull',
        authData: authData,
        error: 0
      })
    }
  });
});

router.post('/newpost', upload.single('postphoto') ,verifyToken, [
  body('paragraph', 'Paragraph can not be empty').trim().isLength({min : 1}).escape(),
  async (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
      if(err){
        res.sendStatus(403);
      }
      else{
        const errors = validationResult(req);

        var post = new PostModel({
          paragraph: req.body.paragraph,
          owner: authData.user._id
        });

        post.photo = 'public/users/'+authData.user._id+'/posts/'+post._id;

        if(!errors.isEmpty())
        {
          res.json({
            error: errors
          });
          return;
        }
        let realOwner = await UserModel.findOneAndUpdate({_id: authData.user._id}, {$push: {posts: post._id}});
        //var arr = [...realOwner.posts, post._id];
        //const c = await UserModel.updateOne({ _id: authData.user._id }, { posts: arr });
        const updatedUser = await UserModel.findById(authData.user._id);
        post.save(err => {
          if(err) { return next(err)}
          fs.rename('public/newfile.png', 'public/users/'+authData.user._id+'/posts/'+post._id+'.png' , err => {
            res.json({
              post: post,
              updatedUser: updatedUser,
              postid: post._id,
              userid: updatedUser._id
            })
          })
        })
        return;
      }
    });
  }
]);

router.get('/userprofile/:usrname', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    if(err){ res.json({
      err: 1
    }) }
    else {
      var user = await UserModel.findOne({username : req.params.usrname}).populate({path: 'posts', populate: {path : 'comments'}});
      res.json({
        user: user,
        authData: authData,
        err: 0
      });
    }
  })
});

router.get('/myprofile', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    if(err) {res.sendStatus(403)}
    else {
      var user = await UserModel.findById(authData.user._id).populate('posts');
      res.json({
        user: user,
        authData: authData,
        err: 0
      });
    }
  })
});

router.post('/addcomment/:postid', verifyToken, [
  body('paragraph', 'Paragraph can not be empty').trim().isLength({min : 1}).escape(),
  (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
      if(err) {res.sendStatus(403)}
      else {
        var new_comment = new CommentModel({
          paragraph: req.body.paragraph,
          photo: req.params.postid,
          user : authData.user._id
        });
        new_comment.save(async (err) => {
          if(err) {res.sendStatus(403)}
          var added_comment = await PostModel.findByIdAndUpdate(req.params.postid, {$push: {comments: new_comment}});
          var updatedPost = await PostModel.findById(req.params.postid);
          res.json({
            post: updatedPost,
            comment: new_comment
          });
        }); 
      }
      return;
    })
  }
]);

router.post('/postdetail/:postid', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    if(err) {res.sendStatus(403)}
    else {
      var post = await PostModel.findById(req.params.postid).populate('comments');
      var user = await UserModel.findById(authData.user._id);
      res.json({
        post: post,
        user: user
      })
    }
  })
});

router.post('/follow/:userid', verifyToken, (req,res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    if(err) {res.sendStatus(403)}
    var user = await UserModel.findById(req.params.userid);
    if(!user.followers.includes(authData.user._id))
    {
      var updateFollower = await UserModel.findByIdAndUpdate(req.params.userid, {$push : {followers : authData.user._id}}, {new: true});
      var updateFollowing = await UserModel.findByIdAndUpdate(authData.user._id, {$push: {following: req.params.userid}}, {new: true});
      res.json({
        updateFollower: updateFollower,
        updateFollowing: updateFollowing
      })
    }
    else {
      res.json({
        message: "Already Following"
      })
    }
  })
});

router.post('/addprofile', upload.single('profilephoto'), verifyToken,(req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    console.log('aut  !!!===', authData);
    console.log('req !== ', req.token);
    if(err){
      console.log(err);
      res.sendStatus(403);
    }
    fs.rename('public/newfile.png', 'public/users/'+authData.user._id+'/profile/profile.png' , err => {
      res.json({
        authData: authData,
        success: 1,
        err: 0
      })
    })
  })
});

router.get('/homepage', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
    if(err){
      console.log(err);
      res.sendStatus(403);
    }
    var user = await UserModel.findById(authData.user._id).populate({path: 'following', populate: {path : 'posts', populate: {path: 'owner'}}});
    var arr = [];
    user.following.forEach(element => {
      arr = [...arr, ...element.posts];
    });
    arr.sort((a, b) => {
      if(a.created_at < b.created_at){
        return 1;
      }
      else {
        return -1;
      }
    });
    res.json({
      user: user,
      message: 'Succesfull',
      arr: arr,
      authData: authData,
      error: 0
    });
  });
});



module.exports = router;