/*================================================================
P35 
randomly choose to buy or sell
if no data exists we generate price & volume
otherwise start @ best buy or sell price and shift the price randomly
before setting the volume

=================================================================*/

'use strict';

/* ========================================================== 
External Modules/Packages Required
============================================================ */
var cookieParser = require('cookie-parser'); //May Not Need??
var cookie = require('cookie');
var crypto = require('crypto');
var http = require('http');
var ObjectID = require('mongodb').ObjectID;
var exchange=require('./exchange.js');
var http = require('http');
var express=require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser'); //May Not Need??
var cookie = require('cookie');

/* ====================================================================== 
Import sio module from server.js
Enables use of sio in this module
======================================================================= */
var io = require('./../../server.js').sio;

/* ========================================================== 
Internal Modules/Packages Required
============================================================ */
var db = require('../config/db');
var exchange = require('./exchange');


/* ========================================================== 
Variable
============================================================ */
var priceFloor = 35;
var priceRange = 10;
var volFloor = 80;
var volRange = 40;

var volRange = 40;  //for MemoryStore
var online = [];


module.exports = {


  /* ========================================================== 
  addStock()
  ============================================================ */
  addStock: function(uid, stock, callback) {

    var counter = 0;
    var price;    

    //when counter =2 doCallback() callback fn has been called twice 
    //only then do we return the price
    //see async library
    function doCallback() {
      counter++;

      console.log("counter: "+counter);   //TEST
      
      if (counter == 2) {
        callback(null, price);
      }
    }
              


    //These 2 fn's run in parallel 
    //when complete each fn calls doCallback()
    module.exports.getStockPrices([stock], function(err, retrieved) {

    //function getStockPrices (stock, err, retrieved) {   

      console.log("In getStockPrices()");     //TEST

      price = retrieved[0];
      doCallback();
    });

    db.push('users', new ObjectID(uid), {portfolio: stock}, doCallback);

  },


  /* ========================================================== 
  authenticate()
  ============================================================ */
  authenticate: function(username, password, callback) {
    
    db.findOne('users', {username: username}, function(err, user) {
      
      if (user && (user.password === encryptPassword(password))) {
        callback(err, user._id);
      }
      else
        callback(err, null);
  //      callback(err, 401);

    });
  },
      

  /* ========================================================== 
  createUser()
  ============================================================ */
  createUser: function(username, email, password, callback) {
    var user = {username: username, email: email, password: encryptPassword(password)};
    db.insertOne('users', user, callback);
  },


  /* ========================================================== 
  ensureAuthenticated()
  A function to be used at every secured route
  Send HTTP 401 error (unauthorised) if not logged on
  ============================================================ */
  ensureAuthenticated: function (req, res, next) {
    if (req.session._id) {
      return next();
    }
    res.status(401).send("Unauthorised-SessionID not found")
  },



  /* ========================================================== 
  generateRandomOrder()
  ============================================================ */
  generateRandomOrder: function(exchangeData) {
    var order = {};
    if (Math.random() > 0.5)
      order.type = exchange.BUY
    else
      order.type = exchange.SELL
     
    var buyExists = exchangeData.buys 
                    && exchangeData.buys.prices.peek();
    var sellExists = exchangeData.sells 
                    && exchangeData.sells.prices.peek();
    
    var ran = Math.random();
    if (!buyExists && !sellExists)
      order.price = Math.floor(ran * priceRange) + priceFloor;
    
    else if (buyExists && sellExists) {
      if (Math.random() > 0.5)
        order.price = exchangeData.buys.prices.peek();
      else
        order.price = exchangeData.sells.prices.peek();
    } 

    else if (buyExists) {
      order.price = exchangeData.buys.prices.peek();
    } 

    else {
      order.price = exchangeData.sells.prices.peek();
    }
  
    var shift = Math.floor(Math.random() * priceRange / 2);
    
    if (Math.random() > 0.5)
      order.price += shift;
    
    else
      order.price -= shift;
    
    order.volume = Math.floor(Math.random() * volRange) + volFloor;
    return order;
  },


  /* ========================================================== 
  getStockPrices() - P.79
  ============================================================ */
   getStockPrices: function(stocks, callback) {
    var stockList = '';


    console.log("In getStockPrices()");     //TEST

    //takes array of stock, convert to csv    
    stocks.forEach(function(stock) {
      stockList += stock + ',';
    });
    
    //set options required by Yahoo API
    var options = {  
      host: 'download.finance.yahoo.com',  
      port: 80,
      path: '/d/quotes.csv?s=' + stockList + '&f=sl1c1d1&e=.csv'
    };   
  

    //Send stocklist to Yahoo API and get price data back
    http.get(options, function(res) { 
      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      })

      //Error getting data from Yahoo
      .on('error', function(err) { 
        console.err('Error retrieving Yahoo stock prices');
        throw err; 
      })

      //parse the data got from Yahoo
      .on('end', function() {
        var tokens = data.split('\r\n');
        var prices = [];
        tokens.forEach(function(line) {
          var price = line.split(",")[1];
          if (price)
            prices.push(price);
        }); 
        callback(null, prices);
      });  
    });    
  },


  /* ========================================================== 
  getUserById()
  ============================================================ */
  getUserById: function(id, callback) {
    db.findOne('users', {_id: new ObjectID(id)}, callback);
  },


  /* ========================================================== 
  getUser()
  ============================================================ */
  getUser: function(username, callback) {
    db.findOne('users', {username: username}, callback);
  },

  
  /* ========================================================== 
  sendExchangeData()
  ============================================================ */
  sendExchangeData: function(stock, exchangeData) {
    lastExchangeData[stock] = exchangeData;
    var current = transformStockData(stock, exchangeData);
    io.sockets.emit('exchangeData', current); 
  },

  /* ========================================================== 
  updateEmail()
  users collection query is {email:email}
  ============================================================ */
  updateEmail: function(id, email, callback) {
    db.updateById('users', new ObjectID(id), {email: email}, callback);
  },



  transformExchangeData: function(data) {
    var transformed = [];
    for (var stock in data) {
      var existingData = data[stock];
      var newData = transformStockData(stock, existingData);
      transformed.push(newData);
    }
    return transformed;
  }


};
/* ========================================================== 
*** END of module.exports ***
============================================================ */


/* ========================================================== 
encryptPassword()
============================================================ */
function encryptPassword(plainText) {
  return crypto.createHash('md5').update(plainText).digest('hex');
};


/* ========================================================== 
transformExchangeData()
Inefficient to TX entire block of data at once
tp - trade price
tv - trade volume
============================================================ */

function transformStockData(stock, existingData) {
  var newData = {};
  newData.st = stock;
  if (existingData && existingData.trades && existingData.trades.length > 0) {
    newData.tp = existingData.trades[0].price;
    newData.tv = existingData.trades[0].volume;
  }
  var buyPrices = {};
  var askPrices = {};
  if (existingData && existingData.buys) {
    buyPrices = Object.keys(existingData.buys.volumes);
    for (var i=buyPrices.length - 5; i<buyPrices.length; i++) {
      var index = buyPrices.length - i;
      newData['b' + index + 'p'] = buyPrices[i];
      newData['b' + index + 'v'] = existingData.buys.volumes[buyPrices[i]];
    }
  }
  if (existingData && existingData.sells)   {
    askPrices = Object.keys(existingData.sells.volumes);
    for (var i=0; i<5; i++) {
      var index = i + 1;
      newData['a' + index + 'p'] = askPrices[i];
      newData['a' + index + 'v'] = existingData.sells.volumes[askPrices[i]];
    }
  }
  for (var i = 1; i <= 5; i++) {
    if (!newData['b' + i + 'p']) {
      newData['b' + i + 'p'] = 0;
      newData['b' + i + 'v'] = 0;
    }
    if (!newData['a' + i + 'p']) {
      newData['a' + i + 'p'] = 0;
      newData['a' + i + 'v'] = 0;
    }
    if (!newData['tv']) {
      newData['tv'] = 0;
    }
    if (!newData['tp']) {
      newData['tp'] = 0;
    }
  }
  return newData;
}













