
/*
 * GET home page.
 */

var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');


module.exports = function(app){

    app.get('/',function(req,res){

        Post.get(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title:'首页',
                posts:posts
            })
        })
//        throw new Error('An seror from gyrate for testing.');
    })

    app.get('/reg',checkNotLogin);
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'用户注册'
        });

    })

    app.post('/reg',checkNotLogin);
    app.post('/reg', function (req, res) {
        //check if the password match password-repeat
        if (req.body['password-repeat'] !== req.body['password']) {
            req.flash('error', '两次输入口令不匹配');
            return res.redirect('/reg');
        }
        //生产口令的散列值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');

        var newUser = new User({
            name:req.body.username,
            password:password
        })


        User.get(newUser.name, function (err, user) {
            if (user) {
                err = '该用户名已存在'
                //console.log(err);
            }
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            //如不存在则新增用户
            newUser.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', '注册成功');
                res.redirect('/');
            });
        })

    })

    app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'用户登入'
        });
    });

    app.post('/login',checkNotLogin);
    app.post('/login', function (req, res) {
        //生成口令的散列值
        var md5 = crypto.createHash('md5');
        var passowrd = md5.update(req.body.password).digest('base64');

        User.get(req.body.username, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在');
                //console.warn(  req.flash('error')  );
                return res.redirect('/login');
            }
            if (user.password != passowrd) {
                req.flash('error', '口令不正确');
                //console.warn(  req.flash('error')  );
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', '登录成功!');
            res.redirect('/u/'+user.name);

        });
    });

    app.get('/logout',checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });

    app.post('/post',checkLogin);
    app.post('/post',function(req,res){
        var currentUser = req.session.user;
        var post = new Post(currentUser.name, req.body.post, null, req.files['pic']);
        post.checkContent(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            post.save(function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                req.flash('success', '发表成功');
                res.redirect('/u/' + currentUser.name);
            })
        })

    })

    app.get('/u/:user',function(req,res){
        User.get(req.params.user,function(err,user){
            if(!user){
                req.flash('error','用户不存在');
                return res.redirect('/');
            }
            Post.get(user.name,function(err,posts){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    posts:posts
                })
            })
        })
    });
}

function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登入');
        return res.redirect('/login');
    }
    next();
}

function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登入');
        return res.redirect('/');
    }
    next();
}
