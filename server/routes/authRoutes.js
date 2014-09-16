/* ========================================================== 

Ref.
http://stackoverflow.com/questions/11273988/clearing-sessions-in-mongodb-expressjs-nodejs
============================================================ */

/* ========================================================== 
ROUTES - Authentication
============================================================ */

var db = require('../config/db');
var nocklib = require('../lib/nocklib.js');


module.exports = {

	register : function(req, res) {

		//username or password not entered
		if (req.body.username == '' || req.body.password == '' || req.body.email == '') {
			return res.status(400).send("Bad Request:Registration error");
		}

		//check if username exists already
		nocklib.getUser(req.body.username, function(err, user) {
			//username exists already
      		if (user)
        		res.status(409).send("Conflict: username already exists");
        	else {
        		//Create user
				nocklib.createUser(req.body.username, req.body.email, req.body.password, function(err, user) {
				})  
        	}
    	});
	},


	login : function(req, res) {

		console.log("USERname: " +JSON.stringify(req.body.username)); //TEST
		console.log("PASSword: " +JSON.stringify(req.body.password)); //TEST

	//	if(req.body.username == "" || req.body.password == "") {
	//		res.status(401).send("Username or password not filled in").end();
	//	}

   		nocklib.authenticate(req.body.username, req.body.password, function(err, id) {
     
      		if (id) {
      			console.log("ID: " +id);		//TEST
        		req.session._id = id;
        		req.session.username = req.body.username;  //ADDED-for socket.io username
        		res.status(200).send("logged in ok");
      		}
      		else {
      			req.session =null;		//delete the session
        		res.status(401).send('Unauthorised');
      		}

    	});    
	},

	getUser : function(req, res) {
		nocklib.getUser(req.params.username, function(err, user) {
      		if (user)
        		res.send('1');
      		else
        		res.send('0');
    	});
	},


	portfolio : function(req, res) {
		nocklib.getUserById(req.session._id, function(err, user) {
    		var portfolio = [];

    		if (user && user.portfolio) 
    			portfolio = user.portfolio;
    
    	 	nocklib.getStockPrices(portfolio, function(err, prices) {
    
    	 	   /*
    	 		* xhr to detect ajax requests
    	 		* if ajax create array with stock names & prices
    	 		*/
    	 		if(req.xhr) {
    	 			var data=[];
    	 			for(var i=0; i<portfolio.length; i++) {
    	 				data.push({stock:portfolio[i], price:prices[i]});
    	 			}
    	 			//console.log("**DATA= "+data);		//TEST
    	 			res.json(data);
    	 		}
    	 		else {
    	 			res.send({portfolio:portfolio, prices:prices, email:user.email});
    	 		}
    	 	})

  		});
	},

	addStock : function(req, res) {
		//check user is making AJAX request

		console.log("addstock req.body: " + JSON.stringify(req.body.stock)); 		//TEST
		console.log("req.session._id: " + JSON.stringify(req.session._id)); 		//TEST

		if (!req.xhr) {

			console.log("in the addStock if");		//TEST

			//get ID from session & stock code
			//add stock to portfolio & get the price
			//add stock to portfolio and get price
    		nocklib.addStock(req.session._id, req.body.stock, function(err, price) {
      			res.send(price);													//send price back to browser
      		});
    	}
    	else
    		res.send("problem dealing with post /addstock ");
	},


	/*================================================================
	$HTTP post /logout
	=================================================================*/
	logout : function(req, res) {
	 // req.logOut();				//using passport
	  req.session.destroy(function(err) {
	  	if(err) {
	  		console.log("Error destroying session on server");
	  		console.log(err);
	  	}
	  });		//clear the sesssion

	  req.session = null;	//ADDED also deletes session ----------------|
	  res.status(200).send("Logged out");
	},



	/*================================================================
	$http get /loggedin
	Test if user is logged in or not
	? is the JS Conditional Operator 
	Ref.
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators
	condition ? val1 : val2
	if condition is true the operator has value val1
	if user is NOT Authenticated 0 is returned to client

	NOTE!! req.isAuthenticated() and req.isUnauthenticated() are PassportJS flags
	=================================================================*/
	//loggedin : function(req, res) {
	//	console.log("*Req.isAuthenticated()" +req.isAuthenticated()); //TEST
	//	console.log("*Req.isUnauthenticated()" +req.isUnauthenticated()); //TEST
	//  	res.send(req.isAuthenticated() ? req.user : '0');
	//	console.log("get /loggedin");

	loggedin : function (req, res) {
    
	    //If session_id exists
	    if (req.session._id) {
	    	res.send(req.user)
	      //return next();
	    }
	    
	    //No session_id exists
	    if (!req.session._id) {
	    	res.status(401).send("Unauthorised-SessionID not found")
	  	}

	}
}


