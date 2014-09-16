'use strict';

/* ========================================================== 
External Modules/Packages Required
============================================================ */
var $ = require('jquery')                     //jquery used for clone function

/* ========================================================== 
Internal Modules/Packages Required
============================================================ */
/*
Binary Heap:a method to store a collection of objects in such a way 
that the smallest element can be quickly found. Need both max and min heaps as 
trades occur at highest buy price and lowest sell price
*/
var BinaryHeap = require('./BinaryHeap');     

/* ========================================================== 
Define constants
============================================================ */
var BUY = "buys";
var SELL = "sells";


/* ========================================================== 
Create binary heap
============================================================ */
function createBinaryHeap(orderType) {
  return new BinaryHeap(function (x) {
    return x;
  }, orderType);
}

/* ========================================================== 
Clone existing exchange data - ensures that parameters passed to  fn are not altered
if we want to use exchange data later in a different context we can
============================================================ */
function createExchange(exchangeData) {
  var cloned = $.extend(true, {}, exchangeData);
  cloned.trades = [];
  init(cloned, BUY);
  init(cloned, SELL);
  return cloned;



  /* ========================================================== 
  Initialisation
  if rx empty exchange data set up empty object to represent volumes and a new binary
  heap to represent prices. For Buy orders we use a max binary heap as trades occur at 
  highest buy price
  ============================================================ */
  function init(exchange, orderType) {
    if (!exchange[orderType]) {
      exchange[orderType] = {};
      exchange[orderType].volumes = {};
      var options = {};
      if (BUY == orderType) options.max = true;
      exchange[orderType].prices = createBinaryHeap(options);
      }
    }
  } 
  
  module.exports = {
    BUY: BUY,
    SELL: SELL,
  
    buy:function (price, volume, exchangeData) {
      return order(BUY, price, volume, exchangeData);
    },
  
    sell:function (price, volume, exchangeData) {
      return order(SELL, price, volume, exchangeData);
    },
  
    order: order,


    //convert orderbook to text (P.35)
    getDisplay: function(exchangeData) {
      var options = {
        max: true
      };
      var buyPrices = createBinaryHeap(options);
      var sellPrices = createBinaryHeap(options);
      var buys = exchangeData.buys;
      var sells = exchangeData.sells;
      
      if (sells) {
        for (var price in sells.volumes) {
          sellPrices.push(price);
        }
      }
      if (buys) {
        for (var price in buys.volumes) {
          buyPrices.push(price);
        }
      }
      
      var padding = "        | ";
      var stringBook = "\n";
      
      while (sellPrices.size() > 0) {
        var sellPrice = sellPrices.pop()
        stringBook += padding + sellPrice + ", " + sells.volumes[sellPrice] + "\n";
      }
      while (buyPrices.size() > 0) {
        var buyPrice = buyPrices.pop();
        stringBook += buyPrice + ", " + buys.volumes[buyPrice] + "\n";
      }
      stringBook += "\n\n";
      for (var i=0; exchangeData.trades && i < exchangeData.trades.length; i++) {
        var trade = exchangeData.trades[i];
        stringBook += "TRADE " + trade.volume + " @ " + trade.price + "\n";
      }
      return stringBook;
    }
}


/* ========================================================== 
The Order Processing - Most difficult part
============================================================ */
function order(orderType, price, volume, exchangeData) {
  // Init
  var cloned = createExchange(exchangeData);  //clone the data
  var orderBook = cloned[orderType];          //retrieve buy or sell order book 
  var oldVolume = orderBook.volumes[price];   //get all volume @ given price
  

  /* ========================================================== 
  If buy order return SELL and vice versa
  ============================================================ */
  function getOpposite() {
    return (BUY == orderType) ? SELL: BUY;
  }

  /* ========================================================== 
  get max price - for buy order a trade occurs when price >=smallest sell order
  ============================================================ */
  function isTrade() {
    var opp = cloned[getOpposite()].prices.peek();
    return (BUY == orderType) ? price >= opp : price <= opp;
  }


  var trade = isTrade();
  var remainingVolume = volume;   //remaining volume after a trade
  var storePrice = true;          //new price needs to be stored if trade removes entire level of order book
  


  if (trade) {
    var oppBook = cloned[BUY]

    if (orderType == BUY) 
      oppBook = cloned[SELL]
    
    while (remainingVolume > 0 && Object.keys(oppBook.volumes).length > 0) {
      var bestOppPrice = oppBook.prices.peek();
      var bestOppVol = oppBook.volumes[bestOppPrice];
      
      /* ========================================================== 
      Trade present @ base price, create trade object in JSON & add to trades[]
      subtract order volume from existing volume
      order is filled so set volume to 0
      A small order so zero price impact - boolean to indicate no prices to be changed 
      ============================================================ */
      if (bestOppVol > remainingVolume) {
      	cloned.trades.push({price:bestOppPrice, volume:remainingVolume});
      	oppBook.volumes[bestOppPrice] = oppBook.volumes[bestOppPrice] - remainingVolume;
      	remainingVolume = 0;
      	storePrice = false;
      }
      
      else {
        /* ========================================================== 
        buy order is large enough to remove at least one level on the opposite side.
        leaving 0 units remaining. (P34)
        ============================================================ */
      	if (bestOppVol == remainingVolume)      //incoming order vol = existing vol
          storePrice = false;                   //orders cancel each other out so no need to store new price
      	
        //create trade and push to trades[]
        cloned.trades.push({ 
          price:bestOppPrice, 
          volume:oppBook.volumes[bestOppPrice] 
        });

      	remainingVolume = remainingVolume - oppBook.volumes[bestOppPrice];
      	// Pop the best price from the heap
      	oppBook.prices.pop();
      	delete oppBook.volumes[bestOppPrice];
      }
    }
  }

  if (!oldVolume && storePrice) 
    cloned[orderType].prices.push(price);
    
  var newVolume = remainingVolume;
  
  // Add to existing volume
  if (oldVolume) 
    newVolume += oldVolume;

  if (newVolume > 0) 
    orderBook.volumes[price] = newVolume;
  
  return cloned;                //return all data back from our function
}