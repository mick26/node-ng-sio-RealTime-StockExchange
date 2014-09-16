/*
Install mocha globally so no need for makefile

Error "error cannot read property prototype of undefined"
changed node-jquery.js fourth-fifth row's
http://stackoverflow.com/questions/15774085/node-js-with-expressjs-error-cannot-read-property-prototype-of-undefined

Install mocha globally then no need for makefile and installing cygwin etc
Error "suite is not defined"
You need to tell Mocha to use the TDD interface, instead of the default BDD one:
mocha --ui tdd card.test.js
http://stackoverflow.com/questions/9795254/nodejs-mocha-suite-is-not-defined-error

To run mocha test: mocha --ui tdd test/exchange.test
*/

'use strict';

/* ========================================================== 
External Modules/Packages Required for testing
============================================================ */
var assert = require('assert');
var should = require('should');   //assertion library

/* ========================================================== 
Internal Modules/Packages Required for testing
============================================================ */
var exchange = require('../lib/exchange');

var exchangeData = {};



suite('exchange', function() {

  /* ========================================================== 
  Test Case - submit buy order
  check that at €40 there are 100 units available
  using should.js assertion library
  done callback tells Mocha(which runs serially) we are ready for next test
  ============================================================ */
  test('buy should add a BUY nockmarket order', function(done) {
    exchangeData = exchange.buy(40, 100, exchangeData);
    exchangeData.buys.volumes[40].should.eql(100);
    done();
  });
  
  /* ========================================================== 
  Test Case - submit sell order to sell 200 units @ €41
  check there are 200 units available @ €41
  ============================================================ */
  test('sell should add a SELL nockmarket order', function(done) {
    exchangeData = exchange.sell(41, 200, exchangeData);
    exchangeData.sells.volumes['41'].should.eql(200);
    done();
  });
  
  /* ========================================================== 
  Test Case - submit sell order to sell 75 units @ €40
  result is a trade, trades are stored in an array.
  Check new state of order book
  ============================================================ */
  test('sell should produce trades', function(done) {
    exchangeData = exchange.sell(40, 75, exchangeData);
    exchangeData.trades[0].price.should.eql(40);
    exchangeData.trades[0].volume.should.eql(75);
    exchangeData.buys.volumes[40].should.eql(25);
    exchangeData.sells.volumes[41].should.eql(200);
    done();
  });
});