
/*================================================
Controllers Module
================================================ */
angular.module('marketApp.userControllers', [])




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


/**********************************************************************
 * Logout controller
 **********************************************************************/
.controller('LogoutCtrl', function ($scope, $http, $location, $rootScope) {

	//$scope.error = '';

	//For Flash Messages
	$scope.all = function () {
	  $scope.info();
	  $scope.warn();
	  $scope.success();
	  $scope.error();
	};


	$http.post('/logout') 
	//success
	.success(function (data, status, headers, config) 
	{
		$rootScope.message = 'Logged Out Successfully';
		$rootScope.isLogged = 0; 
		$rootScope.username = "";   

		$location.url('/');
	})

	//error
	.error(function (data, status, headers, config) 
	{
	//console.log("/logout ERROR");

	//    alert(data);
	});
});