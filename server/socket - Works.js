
/* ========================================================== 
WORKING WITH SOCKETS

============================================================ */
var online = [];   //array to hold list of online chat users
var socket = module.exports = {};



socket.sockWorker = function(sock, io) {
  
  // io.debug=false;
  console.log("--------------------------------------------------------");
  console.log("sock.handshake.session.id= "+sock.handshake.session.id);
  console.log("sock.handshake.session._id= "+sock.handshake.session._id);
  console.log("sock.handshake.session.cookie= "+JSON.stringify(sock.handshake.session.cookie));
  console.log("sock.handshake= "+JSON.stringify(sock.handshake.session));
  console.log("sock.handshake.session.username= "+sock.handshake.session.username);
  console.log("--------------------------------------------------------");

 
  /*
  * New user Joins
  */
  sock.on('joined', function (data) {

    online.push(sock.handshake.session.username); //add new user to arrray

    console.log("**online[]= " +online);//TEST
    var users = online;

    //Send all the users to user that just joined
    sock.emit('user:join', {users: online}, function(data) {
      console.log(data);        
    });

    //broadcast to all other users - only the new users name
    sock.broadcast.emit('user:join', {user: sock.handshake.session.username });
  });



 /*
  * User sends a Message
  */
  sock.on('send:message', function (data, cb) {
    console.log("send:message");//TEST
    //Broadcast a users message to other users
    sock.broadcast.emit('send:message', {user: sock.handshake.session.username, text: data.message});
  });
         


 /*
  * Recieved when user disconnects e.g. by closing their browser
  * Disconnect user - remove user from online array using splice fn
  * broadcase disconnect message to all other users
  */
  sock.on('disconnect', function (data, cb) {

    var user = sock.handshake.session.username;
    console.log("IN DISCONNECT user= "+user);
    console.log(">online= "+online);
 
    var userIndex = online.indexOf(user);

    //user does not exist in the array
    if(userIndex == -1) {
      console.log("User does not exist")
    }
    //remove user from array
    else {
      console.log("££IN else");         //TEST
      online.splice(userIndex, 1);      //remove user from [] using splice 
      console.log("online= "+online);   //TEST
      sock.broadcast.emit('userGone', { username: user});
    }

    //setImmediate(cb);
    //cb("error", "ERR: socket disconnect");    //Add Callback
  });





  sock.on('requestData', function (data) {
    sock.emit('initExchangeData', {exchangeData: transformExchangeData(lastExchangeData)});
  });


  sock.on('updateAccount', function (data) {       
    module.exports.updateEmail(sock.handshake.session._id, data.email, function(err, numUpdates) {
      sock.emit('updateSuccess', {});
    });
  });







}   //@END module

