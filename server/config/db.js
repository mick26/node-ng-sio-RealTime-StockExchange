/* ========================================================== 
P46
The process object - a way to interact with native environment
============================================================ */

/* ========================================================== 
External Modules/Packages Required
============================================================ */
var mongodb = require('mongodb');


var Db = mongodb.Db;
var Connection = mongodb.Connection;
var Server = mongodb.Server;

var envHost = process.env['MONGO_NODE_DRIVER_HOST'];
var envPort = process.env['MONGO_NODE_DRIVER_PORT']; 
var host = envHost != null ? envHost: 'localhost';
var port = envPort != null ? envPort: Connection.DEFAULT_PORT;


var db = new Db('nockmarket', new Server(host, port, {}), {native_parser:false, safe: true} );


module.exports = {

  find: function(name, query, limit, callback) {
    db.collection(name).find(query).sort({_id: -1}).limit(limit).toArray(callback);
  },
  findOne: function(name, query, callback) {
    db.collection(name).findOne(query, callback);
  },
  insert: function(name, items, callback) {
    db.collection(name).insert(items, callback);
  },
  insertOne: function(name, item, callback) {
    module.exports.insert(name, item, function(err, items) {
      callback(err, items[0]);
    });
  },

  //open connection to DB
  open: function(callback) {
    db.open(callback);
  },

  //to add stock to portfolio push data onto array
  push: function(name, id, updateQuery, callback) {
    db.collection(name).update({_id: id}, {$push: updateQuery}, {safe:true}, callback);      
  },

  //Update data using $set - needed to modify user data on DB
  updateById: function(name, id, updateQuery, callback) {
    db.collection(name).update({_id: id}, {$set: updateQuery}, {safe:true}, callback);        
  }

} 