'use strict';

var express = require('express');
var app = express();

//This is our db context / driver and config vars,
//We'll connect it to the database immediately so we have access to the db in our functions below.
var rethinkdb = require('rethinkdb');
var rethinkdbHost = 'localhost';
var rethinkdbDatabaseName = 'test';
var rethinkdbPort = 32772;
var connection = null;

//This will have to be called to run, I think I'll make an Express route for it, and we can initialize the database from our browsers by calling that url.
function databaseInit(){
   //connectDatabase();
   dbCreateTables(['courses', 'students', 'teachers']);
}

//This runs immediately, storing the db connection in the connection var above.
function connectDatabase(){
   connection =  rethinkdb.connect({host: rethinkdbHost, port: rethinkdbPort}, function(err, conn) {
      if (err) throw err;
   });
}

function dbCreateTables(tableList){
   var arrayLength = tableList.length;
   //Loop through the list of tables and create each table in the database
   connectDatabase();
   for (var i = 0; i < arrayLength; i++){    //https://stackoverflow.com/questions/3010840/loop-through-an-array-in-javascript
      rethinkdb(rethinkdbDatabaseName).tableCreate(tableList[i]).run(/*connection*/ connectDatabase(), function(err, result){
         if (err) throw err;
         console.log(JSON.stringify(result, null, 2));   //https://www.rethinkdb.com/docs/guide/javascript
      });
   }
   connection.close();
}

//With NoSQL type databases, you always just insert JSON objects (or an array of them) and don't have to worry about specific schema / columns on a table.  That can be good and/or bad.  You'll see.
function dbInsert(tableName, json){
   connectDatabase();
   rethinkdb.table(tableName).insert(json).run(connection, function(err, result) {
     if (err) throw err;
     console.log(JSON.stringify(result, null, 2));
     //return JSON.stringify(result, null, 2);
   });
   connection.close();
}

function dbGetAll(tableName){
   connectDatabase();
   result = rethinkdb.run(connection, function(err, cursor) {
      if (err) throw err;
      cursor.toArray(function(err, result) {
         if (err) throw err;
         //console.log(JSON.stringify(result, null, 2));
         //return JSON.stringify(result, null, 2);  //????
      });
   });
   connection.close();
   return result;
}

function dbQuery(tableName, propertyName, valueToFilterBy){
   rethinkdb.table(tableName).filter(rethinkdb.row(propertyName).eq(valueToFilterBy)).
     run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
           if (err) throw err;
           //console.log(JSON.stringify(result, null, 2));
           return JSON.stringify(result, null, 2);
        });
    });
}

function dbGetById(tableName, id){
   rethinkdb.table(tableName).get(id).
     run(connection, function(err, result) {
        if (err) throw err;
        return JSON.stringify(result, null, 2);
    });
}

//function dbUpdateById(tableName, id, json){
//Need more update functions - see documentation and above examples
//Then we need to make routes to them so we can send values...that and to the dbInsert as well.

//Database stuff is done,
//Let's do some Express routes:
app.get ('/', (req, res) => {
   res.setHeader('Context-Type', 'text/html; charset=utf-8');
   res.send('Hello World 2!');
});

//Example calling url:  https://metaquest.org/api/courses
app.get ('/api/courses', (req, res) => {
   res.send([1,2,3]);
});

//Example calling url:  https://metaquest.org/api/courses/3
app.get ('/api/courses/:id', (req, res) => {
   res.send(req.params.id);
});

//Example calling url:  https://metaquest.org/api/courses/2019/3
app.get ('/api/courses/:year/:month', (req, res) => {
   res.send(req.params);
   //Can't have more than one res.send, because that returns the data to the calling browser and exits the function.
   //res.send(req.params.year);  //But you can get to the individual parameters like this if you want to use them to do something else.
   //res.send(req.params.month);
});

//Example calling url:  https://metaquest.org/ap/course/query?myQueryParameter=3
app.get ('/api/query', (req, res) => {
   var me = req.query.me;
   console.log(me);
   res.send(req.query);
   //res.send('query received: ' + req.query);
});

app.get ('/api/insertStudent', (req, res) => {
   dbInsert('student', req.query);
   res.send('OK');
});

app.get ('/api/insertCourse', (req, res) => {
   dbInsert('course', req.query);
   res.send('OK');
});



app.get ('/api/insertTeacher', (req, res) => {
   dbInsert('teacher', req.query);
   res.send('OK');
});

app.get ('/api/initdb', (req, res) => {
   databaseInit();
   res.send('OK');
});
app.get ('/api/dbConnTest', (req, res) => {
    console.log(JSON.stringify(connectDatabase(), null, 2));
    res.send('OK');
});

module.exports = app;

if (require.main === module) {
   app.listen(3000, function() {
       console.log(this.address());
   });
}

//This will let you run locally without doing the whole green-lock cert stuff,
// While also being able to be started from index.js (the greenlock server that includes this
// without starting the server on its own.
