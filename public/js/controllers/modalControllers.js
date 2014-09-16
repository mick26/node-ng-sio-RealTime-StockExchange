
/*================================================
Controllers Module
================================================ */
angular.module('marketApp.modalControllers', [])


//var ModalDemoCtrl = function ($scope, $modal, $log) {
/*================================================
Controller -  ModalLoginCtrl
================================================ */
.controller('ModalLoginCtrl', function ($scope, $modal, $log, $http, $location) {
  
  /* Note: The hard coded user object has been commented out, as 
     it is now passed as an object parameter from the HTML template.
  */
  /* $scope.user = {
      user: 'name',
      password: null
  };*/

  $scope.open = function (user) {
      $scope.user = user;
      $modal.open({
          templateUrl: 'myModalLoginContent.html',
          backdrop: true,
          windowClass: 'modal',

          controller: function ($scope, $rootScope, $modalInstance, $log, user, $location, $modalStack) {
              $scope.user = user;

//              $scope.submit = function () {
              $scope.login = function () {
                  $log.log('Submiting user info.');
                  $log.log(JSON.stringify(user));


                  //POST to Server
                  $http.post('/login', $scope.user)      
                    //success


                    .success(function (data, status, headers, config) 
                    {
                      console.log("POST /login success");         //TEST
                      $rootScope.isLogged = 1;          //set logged in flag
                                         
                      $location.path("/portfolio");     
            //        $modalInstance.dismiss;           //close the modal
                    })
                      
                    //error
                    .error(function (data, status, headers, config) 
                    {
                      console.log("POST /login error"); //TEST
                      $rootScope.isLogged = 0;          //reset logged in flag
                    })

                    //$modalStack.dismissAll;
                  $modalInstance.dismiss();
              }


              $scope.cancel = function () {
                  $modalInstance.dismiss();
                  // $modalStack.dismissAll;
                 // $modalInstance.close;
               //   $location.url('/');
              };
          },
          resolve: {
              user: function () {
                  return $scope.user;
              }
          }

          // this will listen for route changes and call the callback
          //$scope.$on('$routeChangeStart', function(){
          //$modalInstance.close();
          //});
      });
  }
})


/*================================================
Controller -  ModalRegisterCtrl
================================================ */
.controller('ModalRegisterCtrl', function ($scope, $modal, $log, $http) {
  
  /* Note: The hard coded user object has been commented out, as 
     it is now passed as an object parameter from the HTML template.
  */
  /* $scope.user = {
      user: 'name',
      password: null
  };*/

  $scope.open = function (user) {
      $scope.user = user;
      $modal.open({
          templateUrl: 'myModalRegContent.html',
          backdrop: true,
          windowClass: 'modal',

          controller: function ($scope, $modalInstance, $modalStack, $log, user, $location) {
              $scope.user = user;
              //$scope.submit = function () {

              $scope.register = function () {

                  $log.log('Submiting user info.');
                  $log.log(JSON.stringify(user));

                  //POST - 
                  $http.post('/register', $scope.user) 

                    .success(function(data) {
                        // $modalInstance.dismiss('');                 
                        //$location.url('/');
                    })
                    
                    .error(function(status, data) {
                      if(status==409) {
                        //$scope.error = 'Duplicate username: Please select a different username';
                      }
                        console.log(status);
                        console.log(data);
                    });


                  $modalInstance.dismiss();
              }
              
              $scope.cancel = function () {
                  $modalInstance.dismiss();
                  //$modalStack.dismissAll;
              };
          },
          resolve: {
              user: function () {
                  return $scope.user;
              }
          }
      });
  };
});