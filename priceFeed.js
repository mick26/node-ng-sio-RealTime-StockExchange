/* ========================================================== 
Program to retrieve real stock market prices from Yahoo Finance
Freely available data is delayed and contains only trade prices 
not volumes or order info.


============================================================ */



/* ========================================================== 
External Modules/Packages Required
============================================================ */
var http = require('http');


/* ========================================================== 
options JSON object
============================================================ */
var options = {  
  host: 'download.finance.yahoo.com',  
  port: 80,
  path: '/d/quotes.csv?s=AAPL,FB,GOOG,MSFT&f=sl1c1d1&e=.csv'
};   

http.get(options, function(res) { 
  var data = '';

  /* ========================================================== 
  when we rx data convert from raw bytes to string
  ============================================================ */
  res.on('data', function(chunk) {
    data += chunk.toString();
  })

  .on('error', function(err) { 
    console.err('Error retrieving Yahoo stock prices');
    throw err; 
  })

  .on('end', function() {
    console.log(data);
  });

});