/*================================================
Ref.
http://www.webdeveasy.com/interceptors-in-angularjs-and-useful-examples/
================================================ */

/*================================================
Main Module
================================================ */
angular.module('marketApp', [ 'ngRoute', 'ui.bootstrap' ,'btford.socket-io' ,'marketApp.services' ,'marketApp.modalControllers', 'marketApp.controllers', 'marketApp.userControllers', 'ngCookies'] )

.config(function ($routeProvider, $locationProvider, $httpProvider) {
    
    //==========================================================
    // Check if the user is logged in by answering to a promise
    // Wait till promise is resolved.
    // success ->user is logged in
    // otherwise redirect to login form
    //==========================================================  
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope) {
      
      // Initialize a new promise
      var deferred = $q.defer();  //returns a deferred object - either be resolved or rejected

      //Make an AJAX call to check if the user is logged in
      //$http returns a promise with 2 methods success and error
      //since returned value is a promise you can use then method to register callbacks
      $http.get('/loggedin')

      //.success(function(user) {
      .success(function(data, status, headers, config) {
      
        //Authenticated - 
        if (data !== '0') {
          $timeout(deferred.resolve, 0);
          $rootScope.isLogged = 1;
          $rootScope.username = data.username;
        }

        //Got 0 as $http response i.e. Not Authenticated
        else {
          $rootScope.message = 'You need to log in.';
          $rootScope.isLogged = 0;          
          $rootScope.username = "";
          $timeout(function(){ 
            deferred.reject(); 
          }, 0);
          
      //    $rootScope.username = "";
          $location.url('/login');
        }
      });

      return deferred.promise;
    };

    
    //============================================================
    // Interceptor to detect AJAX 401 errors (unauthorised)
    // and display login form.
    //=============================================================
    $httpProvider.responseInterceptors.push(function($q, $location) {
      return function(promise) {
        return promise
        
        .then(
          // Success: just return the response
          function(response) {
            return response;
          }, 
          // Error: check the error status to get only the 401
          function(response) {
            if (response.status === 401)
              $location.url('/');            //render login form
            return $q.reject(response);
          }
        );
      }
    });

    //================================================


    /*================================================
    Define all the Routes
    ================================================ */
    $routeProvider

      .when('/', {
        templateUrl: '/views/main.tpl.html',
      })

      .when('/admin', {
        templateUrl: 'views/admin.tpl.html',
        controller: 'AdminCtrl',
        resolve: {                  
          loggedin: checkLoggedin     //secure url
        }
      })
	
	  
      .when('/login', {
        templateUrl: 'views/login.tpl.html',
        controller: 'LoginCtrl',
        resolve: {                  
          loggedin: checkLoggedin     //secure url
        }
      })
	  
	  .when('/logout', {
        templateUrl: 'views/main.tpl.html',
        controller: 'LogoutCtrl'
      })

    .when('/about', {
        templateUrl: 'views/about.tpl.html'
      })	  

     .when('/register', {
        templateUrl: 'views/register.tpl.html',
        controller: 'RegisterCtrl'
     })
      
     .when('/portfolio', {
        templateUrl: 'views/portfolio.tpl.html',
        controller: 'PortfolioCtrl',    
        resolve: {                  
          loggedin: checkLoggedin     //secure url
        }
     })

      .otherwise({
        redirectTo: '/'
      })

})


.run(function($rootScope, $http, $location, $cookieStore) {
  $rootScope.message = '';

  // Logout function is available in any pages
  $rootScope.logout = function() {
    $rootScope.message = 'Logged out.';
    $http.post('/logout')
      .success(function(data, status, headers, config)  {
        //Removing a cookie
        //$cookieStore.remove('connect.sid'); //does not work neither does using $cookies
        $location.url('/');
      })
  };
});




