'use strict';

const path = require('path');
var express = require('express');
var app = express();

app.set('view engine', 'pug');
/*
var rdb = function() {
   require('./rdb.js');
}*/
//var rethink = require("./rdb.js");
//var rdb = new rethink();
var rdb = require("./rdb.js");

var passCode = rdb.GetPassCode();

//Database stuff is done,
//Let's do some Express routes:
app.get ('/', (req, res) => {
   res.setHeader('Context-Type', 'text/html; charset=utf-8');
   //res.sendFile('./html/main.html', {root: __dirname}); //works, but I think it's ugly
   //res.sendFile(path.join(__dirname + '/html/main.html')); //better, but I want to use pug directly
   //For this to work, must have the line above: "app.set('view engine', 'pug');
   res.render(path.join(__dirname + '/pugFiles/main.pug'), {});
   //For the above, if we have any variables we want to pass in, we can put them in the brackets
   //(the brackets encapsulate the JSON object we pass to the templating engine, pug.
});

//Positional paramters
//Example url:  https://metaquest.org/IdontHaveAurl/Sue
app.get ('/IdontHaveAurl/:arbitraryString', (req, res) => {
   var name = req.params.arbitraryString;
   res.send('OK ' + name);
});

//Query string
//Example url:  https://metaquest.org/api2?name=Bob&age=40
app.get ('/api2', (req, res) => {
   var name = req.query.name;
   var age = req.query.age;
   res.send('OK ' + name + ', ' + age);
});

app.get ('/api/:pass/:tblName/:operation/:filterOrJson/:json', (req, res) => {
   var pass = req.params.pass;
   var tblName = req.params.tblName;
   var operation = req.params.operation;
   var filterOrJson = JSON.parse(req.params.filterOrJson);
   var json = JSON.parse(req.params.json);
   if (pass != null && pass == passCode && tblName != null){
     if (operation != null){
         if (operation == "query"){
             rdb.dbQuery(res, tblName, filterOrJson);
         }
         else if (operation == "new"){
             rdb.dbInsert(res, tblName, filterOrJson);
         }
         else if (operation == "update"){
             rdb.dbUpdate(res, tblName, filterOrJson, json);
         }
         else if (operation == "replace"){
             rdb.dbReplace(res, tblName, filterOrJson);
         }
         else if (operation == "delete"){
             rdb.dbDelete(res, tblName, filterOrJson);
         }
         else {
             //res.send("Invalid operation - must be one of: (query, new, update, delete, createTable, deleteTable)");
            rdb.dbGetAll(res, tblName);
         }
      }
      else {
         rdb.dbGetAll(res, tblName);
      }
   }
   else {
      res.send("?");
   }
});

app.get('/smashGlass/:pass/:database/:operation/:filter', (req, res) => {
   var pass = req.params.pass;
   var database = req.params.database;
   var operation = req.params.operation;
   var filter = req.params.filter;
   if (pass != null && pass == passCode){
      if (database != null){
         if (operation == "switch" && filter != null){
            rdb.dbSwitch(filter);
         }
         else if (operation == "listDatabases"){
            rdb.dbList(res);
         }
         else if (operation == "createDb" && filter != null){
            rdb.dbCreateDatabase(filter);
         }
         else if (operation == "deleteDb" && filter != null){
            //Perform a db backup first, send a two-factor auth first & get approval before deleting
            //https://www.rethinkdb.com/api/javascript/db_drop/
            rdb.dbDropDatabase(filter);
         }
         else if (operation == "listTables"){
            rdb.dbList(res);
         }
         else if (operation == "createTable" && filter != null){
            rdb.dbCreateTable(res, filter);
         }
         else if (operation == "deleteTable" && filter != null){
            //dbDeleteTable(res, filter);
         }
         else if (operation == "backup"){
            //Implment function for database backup to flat file
            //Probably want file chunks per X size, then compress - each database backup should have its own folder under backups
            //Backups should be stored on the separate volume
         }
         else if (operation == "restore" && filter != null){
            //0.  Maybe add a filter for this operation that will be a number, and that's how many backups back to go, or if it's a date, restore the closest backup to that date
            //1.  Create a new database named restoreFromBackup<Date><dbName>
         }
         else if (operation == "listBackups"){
            //Implement this function
         }
         else if (operation == "pruneBackups" && filter != null){
            //filter should have how many backups to keep.  Backups further back than that would be removed.
         }
      }
   }
   res.send("OK");
});

module.exports = app;

//This will let you run locally without doing the whole green-lock cert stuff,
// While also being able to be started from index.js (the greenlock server that includes this
// without starting the server on its own.
if (require.main === module) {
   app.listen(3000, function() {
       console.log(this.address());
   });
}
