/* ====================================================================== 
Import sio module from server.js
Enables use of sio in this module
======================================================================= */
io = require('./../../server.js').sio;

/* ====================================================================== 
Internal Modules/Packages Required
======================================================================= */
var exch = require('./exchange');
var nocklib = require('./nocklib');
var db = require('../config/db');

var socketModule = require('../socket.js');

/* ======================================================================= 
Variables
======================================================================== */
var exchangeData = {};
var timeFloor = 500;
var timeRange = 1000;

/* =======================================================================
Add Stocks to the Exchange
Stocks represented as an array of strings
======================================================================= */

var stocks = ['AIB', 'CRH', 'IRE', 'PAP.I', 'ZBB'];
var allData = [];


stocks.forEach(function(stock) {allData.push({});});


/* ===================================================================
submitRandomOrder()
index = the stock we are trading
separate exchangeData for each stock
==================================================================== */

var submitRandomOrder = function(index) {
  // order
  var exchangeData = allData[index];

   var ord = nocklib.generateRandomOrder(exchangeData);
   ord.stock = stocks[index];
  
  //console.log('order', ord);
  /*
  * BUY order
  */
  if (ord.type == exch.BUY)
    allData[index] = exch.buy(ord.price, ord.volume, exchangeData);
 /*
  * SELL order
  */
  else  
    allData[index] = exch.sell(ord.price, ord.volume, exchangeData);  
    


  db.insertOne('transactions', ord, function(err, order) {

    if (exchangeData.trades && exchangeData.trades.length > 0) {
      
      //nocklib.sendTrades(exchangeData.trades);              //send the trades
      //sendTrades(exchangeData.trades);                      //send the trades

      var trades = exchangeData.trades.map(function(trade) {

        trade.init = (ord.type == exch.BUY) ? 'b' : 's';
        trade.stock = stocks[index];
        return trade;
      });

      nocklib.sendExchangeData(stocks[index], exchangeData);

      db.insert('transactions', trades, function(err, trades) {
        pauseThenTrade();
      });
    }

    else {
    	pauseThenTrade();
    }


   	function pauseThenTrade () {
	 	var pause = Math.floor(Math.random() * timeRange) + timeFloor;
		setTimeout(submitRandomOrder.bind(this, index), pause);
	}

  });
};



/* ========================================================== 
sendTrades()
takes - array of trades
sends- trade message to all connected clients
============================================================ */
function sendTrades (trades) {
  io.emit('trade', JSON.stringify(trades));
};


module.exports = {
	submitRandomOrder:submitRandomOrder
};


