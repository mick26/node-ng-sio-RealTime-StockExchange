
'use strict';

/* Services */
angular.module('marketApp.services', [])


/*
 * Make the socket instance
 */
.factory('socket', function (socketFactory) {
	return socketFactory();
})