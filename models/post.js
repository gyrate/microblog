var mongodb = require('./db');
var fs = require('fs');//移动文件

function Post(username, post, time, file) {
    this.user = username;
    this.post = post;

    if (time) {
        this.time = time;
    } else {
        this.time = new Date();
    }

    //区分日志提交操作和读取日志操作
    if ( file && file.size ) {
        this.file = file;
        this.fileUrl = '/upload/images/' + file.name;
    } else if (typeof file == 'string') {
        this.fileUrl = file;
    }
}
module.exports = Post;

Post.prototype.checkContent = function checkContent(callback){
    var err = ( !this.post || this.post.trim().length == 0 ) ? '发表内容不能为空 !' : null;
    callback(err);
}

Post.prototype.save = function save(callback) {
    var self = this;

    if( this.file && this.file.size ){
        this.saveFile(function(){
            self.saveDataBase(callback);
        });
    }else{
        self.saveDataBase(callback);
    }
}

Post.prototype.saveDataBase = function (callback){
    //存入mongodb的文档
    var post = {
        user:this.user,
        post:this.post,
        time:this.time,
        fileUrl:this.fileUrl
    };
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取post集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //为user属性添加索引
            collection.ensureIndex('user');
            //写入psot文档
            collection.insert(post, {safe:true}, function (err, post) {
                mongodb.close();
                callback(err, post);
            })
        })
    })
}

Post.prototype.saveFile = function(callback){
    //保存图片文件到指定路径
    var file = this.file
        , tmp_path = file.path
        , target_path = './public/upload/images/' + file.name;

    fs.rename(tmp_path,target_path,function(err){
        if(err){
            console.error(err);
            return ;
        }
        fs.unlink(tmp_path,function(){
            if(err){
                console.error(err);
                return ;
            }
            console.log('picture save successfully.');
            callback();
        })
    })
}

Post.get = function get(username, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查找user属性为username的文档，如果username为null则匹配全部
            var query = {};
            if (username) {
                query.user = username;
            }
            collection.find(query).sort({time:-1}).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                //封装posts为Post对象
                var posts = [];
                docs.forEach(function (doc, index) {
                    var post = new Post(doc.user, doc.post,doc.time,doc.fileUrl);
                    posts.push(post);
                })
                callback(null, posts);
            })
        })
    })
}