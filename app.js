
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , MongoStore = require('connect-mongo')(express)
    , flash = require('connect-flash')
    , settings = require('./settings')
    , app = express();
    //初始化服务器日志所需模块
var fs = require('fs')
    , accessLogfile = fs.createWriteStream('access.log', {flags:'a'})
    , errordLogfile = fs.createWriteStream('error.log', {flags:'a'});

    app.configure(function () {

        app.use(express.logger({stream:accessLogfile}));
        app.set('port', process.env.PORT || 3000);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser({uploadDir:'./upload/tmp'}));
        app.use(express.methodOverride());
        app.use(flash());

        app.use(express.cookieParser());
        app.use(express.session({
            secret:settings.cookiesSecret,
            store:new MongoStore({
                db:settings.db
            })
        }));

        app.use(function (req, res, next) {
            res.locals.error = req.flash('error');
            res.locals.success = req.flash('success');
            res.locals.user = req.session.user;
            next();
        });

        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));

    });

app.configure('production',function(){
    app.error(function(err,req,res,next){
        var meta = '[' + new Date() + '] ' + req.url + '\n';
        errordLogfile.write(meta + err.stack + '\n');
        next();
    })
})

app.configure('development', function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true}));
});

routes(app);

if(!module.parent){
    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });
}
