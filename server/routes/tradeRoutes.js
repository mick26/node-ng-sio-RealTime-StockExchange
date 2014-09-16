var db = require('../config/db');

module.exports = {


	getIndex : function(req, res) {
		res.render('chart');  
  		//res.send('Hello World');
	},


	getTrades : function(req, res) {
	  //Query DB
	  //Searching for documents where the init field exists
	  //only trades have the init field
	  //limit the number of results to 100
	  db.find('transactions', {init: {$exists: true}}, 100, function(err, trades) {
	    if (err) {
	      console.error(err);
	      return;
	    }

	    var json = [];
	    var lastTime = 0;
	    
	    //Highstock expects an array of arrays
	    //Each sub array of form [time, price]
	    //use combination of subString() & parseInt to generate JS Date object
	    //1st 4 bytes of objectID contain timestamp
	    //.subString(0, 8) -> extract 1st 4 bytes
	    //16 due to conversion from hex
	    // *1000 -> millisecond conversion
	    // Mon Jul 20 2014 08:46:30 GMT+1000 (EST)

	    trades.reverse().forEach(function(trade) {
	      
	      var date = new Date(parseInt( trade._id.toString().substring(0, 8), 16 ) *1000);
	    
	      var dataPoint = [date.getTime(), trade.price];

	      if(date - lastTime > 1000)
	        json.push(dataPoint);
	      
	      lastTime = date;
	    });

	    console.log("Data= "+JSON.stringify(json));

	    res.json(json);         //send json data to client
	  });
	}

}
