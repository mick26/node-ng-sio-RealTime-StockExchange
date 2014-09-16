


var tradeRoutes = require('./routes/tradeRoutes.js');
var authRoutes = require('./routes/authRoutes.js');
var nocklib = require('./lib/nocklib.js');
//==================================================================
// ROUTES


module.exports = function(app) 
{

	/*================================================================
	- $http get
	=================================================================*/
	app.get('/', tradeRoutes.getIndex);
	app.get('/api/trades', tradeRoutes.getTrades);


	/*================================================================
	USER AUTHENTICATION
	=================================================================*/

	app.get('/api/user/:username', authRoutes.getUser);
	app.get('/portfolio', nocklib.ensureAuthenticated, authRoutes.portfolio);

	app.post('/addstock', authRoutes.addStock);
	app.post('/register', authRoutes.register);
	app.post('/login', authRoutes.login);

	app.post('/logout', authRoutes.logout);
	app.get('/loggedin', authRoutes.loggedin);	//checks if logged in or not

};
