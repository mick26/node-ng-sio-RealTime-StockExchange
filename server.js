

/* ========================================================== 

https://www.npmjs.org/package/debug
http://raganwald.com/2013/03/28/trampolines-in-javascript.html

http://stackoverflow.com/questions/25374093/getting-the-current-user-in-express-js-while-using-socket-io/25375468#25375468

http://udgwebdev.com/criando-um-chat-usando-session-do-express-4-no-socket-io-1-0/
http://stackoverflow.com/questions/4753957/socket-io-authentication?rq=1
http://www.danielbaulig.de/socket-ioexpress/

https://github.com/turbonetix/socket.io-handshake
http://www.sitepoint.com/forums/forumdisplay.php?441-Questions-arising-from-Jump-Start-Node-js&s=14836aedf13dad31a6f075039d2847be

http://stackoverflow.com/questions/18302242/express-session-memorystore-not-returning-session
http://www.senchalabs.org/connect/utils.html

http://stackoverflow.com/questions/19889552/how-to-access-express-session-memorystore-via-socket-io-objects
http://expressjs-book.com/forums/topic/express-js-sessions-a-detailed-tutorial/

https://www.npmjs.org/package/connect-redis
http://stackoverflow.com/questions/9245044/socket-io-websocket-authorization-failing-when-clustering-node-application
http://ejosh.co/de/2012/07/node-js-socket-io-and-redis-beginners-tutorial-server-side/
http://blog.modulus.io/nodejs-and-express-sessions


P37
Generate a Random order and submit it to the exchange
============================================================ */

'use strict';

/* ========================================================== 
External Modules/Packages Required
============================================================ */
var express = require('express');
var socketSessions = require('socket.io-handshake');
var expressSession = require('express-session');
var RedisStore = require('connect-redis')(expressSession);
//We will use this sessionStore object to access session data inside the socket.io code
var sessionStore = new RedisStore();
var cookieParser = require('cookie-parser');
var handshake = require('socket.io-handshake');
var logger = require('morgan');
var methodOverride = require('method-override');
var path = require('path');
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);

/*
* Export sio module so socket.io can be used in other modules
*/
module.exports.sio = io;   //ADDED this


var errorHandler = require('errorhandler');
var colours = require('colors');
var bodyParser = require('body-parser');
var path=require('path');
//var debug = require('debug');


/*
By running socket.io with the socket.io-redis adapter you can run multiple socket.io 
instances in different processes or servers that can all broadcast and emit events to 
and from each other.
*/
var ioredis = require('socket.io-redis');

//var favicon = require('serve-favicon');
//Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.



/* ========================================================== 
Internal Modules/Packages Required
============================================================ */
//var exch = require('./server/lib/exchange');
var nocklib = require('./server/lib/nocklib');
var db = require('./server/config/db');

//var utils = require('./server/lib/utils.js'); //connect utils.js
var socketModule = require('./server/socket.js');
var submitTrades = require('./server/lib/submitTrades.js');

//var submitTrades = require('./server/lib/submitTrades.js');

socketModule.sockUsing(io);

var routes = require('./server/routes.js');



/*================================================================
Add Stocks to the Exchange
Stocks represented as an array of strings
================================================================= */
var stocks = ['AIB', 'CRH', 'IRE', 'PAP.I', 'ZBB'];
var allData = [];

stocks.forEach(function(stock) {allData.push({});});



/*========================================================================
Session Config
Cannot read sid cookie in angular unless httpOnly = false (true os the default)
key - cookie name defaulting to connect.sid
======================================================================= */
var sessionConfig = {
    store: sessionStore, 
    key:'sid', 
    cookie: {httpOnly: false},
    secret:'secret',
    parser:cookieParser(),
    saveUninitialized: true,
    resave: true
};



/* ===================================================================
Use Middleware
==================================================================== */
app.use(expressSession(sessionConfig));


/*
Ref.
https://github.com/visionmedia/connect-redis
By default, the node_redis client will auto-reconnect when a connection is lost. 
But requests may come in during that time. In express, one way this scenario can be handled is including 
a "session check" after setting up a session (checking for the existence of req.session):
*/

app.use(function (req, res, next) {
    if (!req.session) {
        return next(new Error('req.session does not exist')) // handle error
    }

    if (req.session) { 
       // console.log("req.session= "+JSON.stringify(req.session));
       /*
        * Can also make changes to session here
        */
        //req.session = null; //deletes the session
        //req.session.cookie.httpOnly = false;
        //req.session.cookie.secure = 'true';
        //req.session.cookie.maxAge = null;
        //req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; //1 year
    }
    next() // otherwise continue
})


io.use(handshake(sessionConfig));
app.use(methodOverride());

/* ========================================================== 
Port the server will listen on
============================================================ */
app.set('port', process.env.PORT || 3000);

/* ==========================================================
serve the static index.html from the public folder
============================================================ */
app.use(express.static(__dirname + '/public'));

 
//development only
if (app.get('env') === 'development') {
    app.use(errorHandler());
    app.use(logger('dev'));
}

//production only
if (app.get('env') === 'production') {
    // TODO
};

/*
 * host and port to connect to Redis on
 */
io.adapter(ioredis({ 
    host: 'localhost', 
    port: 6379 
}));


//app.use(logger('dev'));       //log every request to the console in dev
app.use(bodyParser.json());     //parse application/json

//app.use(bodyParser.urlencoded()); //parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ 
  extended: true 
}))



/* ========================================================== 
ROUTES - using Express
============================================================ */
routes(app);


/* ===========================================================
Ensure DB is open first
http server only starts listening when DB is open
=============================================================*/
db.open(function() {

  http.listen(app.get('port'), function(req, res) {
    console.log('Express server listening on port ' .green + app.get('port'), app.settings.env );
    for (var i = 0; i < stocks.length; i++) { 
      submitTrades.submitRandomOrder(i);
    };
  });


  /* ========================================================== 
  SOCKET.IO
  ============================================================ */
  /*
   * Can add Authentication for socket.io here
   * socket.io connection will not be made unless 
   * return next()
   */
  io.use(function(sock, next) {
    console.log("IN io.use"); //TEST
    //Only connect to socket.io if received a cookie header
    if (sock.request.headers.cookie) 
      return next();
    
    else
      next(new Error('Authentication error'));
  });

  /*
   * Connect to Socket.io - 
   * Enable socket.io operations in module sockModule inside the sockWorker function 
   */
  io.on('connection', function (sock) {
    socketModule.sockWorker(sock, io);
  });
  /* ============================================================ */

});