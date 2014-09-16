

/*================================================
Controllers Module
================================================ */
angular.module('marketApp.controllers', [])


/*================================================
HomeCtrl - Controller
================================================ */
.controller('HomeCtrl', function ($scope, $rootScope, $http, $location) {
	//Make an AJAX call to check if the user is logged in
    $http.get('/loggedin')

    //.success(function(user) {
    .success(function(data, status, headers, config) {

      //Authenticated - 
      if (data !== '0') {
        $rootScope.isLogged = 1;		//set logged in flag
        $rootScope.username = data.username;
        $scope.error = '';
        $rootScope.welcome = 'Welcome ' + JSON.stringify($rootScope.username);  
      }

      //Not Authenticated - Got 0 as $http response i.e. 
      else {

        $scope.info = function () {
         //   flash.info = 'info message-You need to log on';
      };

        $rootScope.message = 'You need to log in.';
        $rootScope.isLogged = 0;          //reset logged in flag
        $rootScope.username = "";     
      }
    })
})



/*================================================
PortfolioCtrl - Controller
================================================ */
.controller('PortfolioCtrl', function ($scope, $log, $http, $location) {

	$scope.portfolio = {};		//JS object
	$scope.myPortfolio = [];	//JS Array

	//Get the users Portfolio	
	$http.get('/portfolio')
		//success - callback
		.success(function(data, status, headers, config) {

			$scope.portfolio = data;

			for(i=0; i< data.portfolio.length; i++) {
				$scope.myPortfolio.push( {symbol:data.portfolio[i], price:data.prices[i]} );
			}
		})
		//error - callback e.g. because user is not logged on
		.error(function(data) {
			//console.info("Error Getting portfolio: " + data);
			$location.url('/');
		});


		/* ========================================================== 
		addStock()
		============================================================ */			
		$scope.addStock = function(stock) {

			$http.post('/addstock', {stock: stock} )

				//success - callback
				.success(function(data, status, headers, config) {
					$scope.stock = data;
					console.info("In POST Success stock added: " + JSON.stringify(data));
					
					//Empty array and javascript object		
					$scope.portfolio = {};		//JS object
					$scope.myPortfolio = [];	//JS Array

			
		
					$http.get('/portfolio')
						//success - callback
						.success(function(data, status, headers, config) {
	
							$scope.portfolio = data;
								
							console.log("pORTfolio: "+JSON.stringify($scope.portfolio));		//TEST
							console.info("In POST Success stock added: " + JSON.stringify(data));

							for(i=0; i< data.portfolio.length; i++) {
								$scope.myPortfolio.push( {symbol:data.portfolio[i], price:data.prices[i]} );
							}
							//console.log("**myPortfolio= " +$scope.myPortfolio);

						})
						//error - callback
						.error(function(data) {
							console.info("Error Getting portfolio: " + data);
						})
				})

				//error - callback
				.error(function(data) {
					console.info("Error Posting stock: " + data);
				})
			};
})



/*================================================
MarketCtrl - Controller
=============================================== */
.controller('MarketCtrl', function ($scope, $rootScope, $http, $location, socket) {

	//Going to store exchange data as an array of objects
	$scope.dataObj = {};			//JS object
	$scope.dataArr = [];			//JS Array
	var gotInitData = false;
	var loaded = false;				//only process trades after initial data load has occurred

   /*
	* Request Exchange Data from server
	*/
	socket.emit('requestData', {});


   /*
	* Get 'initial' Exchange Data from server
	*/
	socket.on('initExchangeData', function (data, cb) {
		$scope.dataObj = data;
		for(i=0; i< data.exchangeData.length; i++) {
			$scope.dataArr.push( data['exchangeData'][i]  );
		}
		
	   /*
		* Got init Exchange Data from server
		*/
		socket.emit('gotInitData', {});

	});


   /*
	* Socket tells us that we have saved 'initial' Exchange Data into array
	* i.e. when we can use the array data
	*/
	socket.on('gotInitDataAck', function () {

		// for(i=0; i< 5; i++) {						//TEST
		// 	console.log("XdataArr= ["+i+"]"+JSON.stringify($scope.dataArr[i]));		//TEST
		// }

/* TEST
		console.log("st: "+$scope.dataArr[0].st);//TEST
		console.log("tp: "+$scope.dataArr[0].tp);//TEST
		console.log("tv: "+$scope.dataArr[0].tv);//TEST
		console.log("b5p: "+$scope.dataArr[0].b5p);//TEST
		console.log("b5v: "+$scope.dataArr[0].b5v);//TEST
		console.log("b4p: "+$scope.dataArr[0].b4p);//TEST
		console.log("b4v: "+$scope.dataArr[0].b4v);//TEST
		console.log("b3p: "+$scope.dataArr[0].b3p);//TEST
		console.log("b3v: "+$scope.dataArr[0].b3v);//TEST
		console.log("b2p: "+$scope.dataArr[0].b2p);//TEST
		console.log("b2v: "+$scope.dataArr[0].b2v);//TEST
		console.log("b1p: "+$scope.dataArr[0].b1p);//TEST
		console.log("b1v: "+$scope.dataArr[0].b1v);//TEST
		console.log("a1p: "+$scope.dataArr[0].a1p);//TEST
		console.log("a1v: "+$scope.dataArr[0].a1v);//TEST
		console.log("a2p: "+$scope.dataArr[0].a2p);//TEST
		console.log("a2v: "+$scope.dataArr[0].a2v);//TEST
		console.log("a3p: "+$scope.dataArr[0].a3p);//TEST
		console.log("a3v: "+$scope.dataArr[0].a3v);//TEST
		console.log("a4p: "+$scope.dataArr[0].a4p);//TEST
		console.log("a4v: "+$scope.dataArr[0].a4v);//TEST
		console.log("a5p: "+$scope.dataArr[0].a5p);//TEST
		console.log("a5v: "+$scope.dataArr[0].a5v);//TEST
*/
	});


   /*
	* Now have initial exchange data saved in an array of objects
	*/
	loaded = true; 				//flag to indicate we have got the initial data


   /*
	* Get updated Exchange data as a JS object
	* Note one stock at a time is send i.e. 1 array item
	*/
	socket.on('exchangeData', function(deltas) {
		//console.log("got exchangeData deltas= "+JSON.stringify(deltas)); //TEST
		
		$scope.dataObj = deltas;
		//console.log("deltas.st= "+ deltas.st); //TEST

	   /*
		* Search array of objects - want to find index of array where values have changed
		*/
		var searchTerm = deltas.st;  	//reference the stock by .st value
    	var index = -1;					//invalid index
		
		for(var i = 0; i < $scope.dataArr.length; i++) {
    		if ($scope.dataArr[i].st === searchTerm) {
        		index = i;								//now know the index
        		$scope.dataArr[index] = deltas;			//update the array data at the index
        		break;
    		}
		}
	})

})


/*================================================
ChatCtrl - Controller
================================================ */
.controller('ChatCtrl', function ($scope, $rootScope, $http, $location, socket) {

	
	$scope.message = "";
	$scope.chatArea = "";
	$scope.users = "";
	$scope.time = "";
	$scope.messages = [];

  	
  	socket.on('time', function (data, cb) {
    	$scope.time = data;
    	console.log("Time= "+data);
    	cb({data:"some data"}); //???????????????
 	});



	//When click Join Button
	$scope.joinChat = function() {
		console.log("Hit joinChat() Button"); //TEST
		socket.emit('joined', {}, function(data) {
			console.log(data); //------------------------
		});
	};


   /*
	* Send message - activated by send message button
	*/
	$scope.sendMessage = function() {
		console.log("Hit Send() Button"); //TEST
		console.log("$scope.message= "+$scope.message); //TEST
		socket.emit('send:message', {message: $scope.message}, function(data) {
		console.log(data); //------------------------			
		});
	};


   /*
	* Get Message - add to messages array [contains data.user and data.text]
	*/
	socket.on('send:message', function (data) {
    	$scope.messages.push(data);
  	});


   /*
	* Join - New user joins
	*/
	socket.on('user:join', function (data) {

	   /*
		* Send to all other users i.e. that have online[] already - only need the new users name
		*/
		if (data.user) {

			if(data.user)
				console.log("data.users= "+data.users); //TEST


			console.log("data.user= "+data.user); //TEST
			$('#users').append('<span class="label label-success" id="username-' + data.user + '">' + data.user + '</span>');
		}

	   /*
		* Only send to the new user that joins 
		*/
		if (data.users) {
			if(data.user)
				console.log("data.user= "+data.user); //TEST

			console.log("data.users= "+data.users); //TEST

			var userHtml = '';
			for (var i=0; i < data.users.length; i++) {
				userHtml += '<span class="label label-success" id="username-' + data.users[i] + '">' + data.users[i] + '</span>';
			}
			$('#users').html(userHtml);
		}
	});


   /*
	* userGone - locate tag and use jQuery remove on it
	* user tag appears in HTML as <span id ="username-mick" class label label-success"> 
	* Here we remove the html span element using the id value
	*/
	socket.on('userGone', function (data) {
		console.log("in ctrl userGone");
    	$('#username-' + data.username).remove();
  	});

 	

 	$scope.messages = [];

  	$scope.sendMessage = function () {
    	socket.emit('send:message', {
      		message: $scope.message
    	});

	    // add the message to our model locally
	    $scope.messages.push({
	      	user: $scope.name,
	      	text: $scope.message
	    });

	    // clear message box
	    $scope.message = '';
  	};
 
})


/*================================================
AccountCtrl - Controller
================================================ */
.controller('AccountCtrl', function ($scope, $rootScope, $http, $location, socket) {
	
	$scope.email = "";
	$scope.username = "";

	socket.emit('getAccountDetails', {}, function(data) {
		console.log(data);	
	});

   /*
	* Get userAccount info from DB
	*/
	socket.on('userDetails', function(data) {
		console.log("**Data: "+JSON.stringify(data));
		$scope.email = data.userDetails.email;
		$scope.username = data.userDetails.username;
		// console.log("userDetails** email: "+data.userDetails.email);
	});



   /*
	* Send message - activated by send message button
	*/
	$scope.updateAccount = function() {
		console.log("Hit updateAccount() Button"); //TEST
		console.log("$scope.email= "+$scope.email); //TEST

		socket.emit('updateAccount', {email: $scope.email}, function(data) {
			console.log(data); //------------------------			
		});
	};

	socket.on('updateSuccess', function(data) {
		console.log("updateSuccess");
	})
});
