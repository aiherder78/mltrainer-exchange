'use strict';

var express = require('express');
var app = express();

//Database related config:
//https://github.com/neumino/rethinkdbdash
var rethinkdbHost = 'localhost';
var rethinkdbDatabaseName = 'test';
var rethinkdbPort = 32772;

//TODO:  Make a dbinit function that first checks for the dbName, creates it if it doesn't exist, then makes the connection here.
var r = require('rethinkdbdash')({
   port: rethinkdbPort,
   host: rethinkdbHost,
   db: rethinkdbDatabaseName
});

//rethinkdbdash has a connection pool that will prevent the process from exiting, so I will use node-cleanup to handle draining the pool on process kill.
//https://github.com/jtlapp/node-cleanup
var nodeCleanup = require('node-cleanup');

//Now this function will get called when the process gets killed:
nodeCleanup(function (exitCode, signal) {
  //I don't care about either of the arguments, but that's from the repo's example.
  r.getPoolMaster().drain(); //from the instructions on rethinkdbdash repo:  https://github.com/neumino/rethinkdbdash
});


//This will cause problems if I try to do it with the rest - the way the examples I've seen for rethinkdbdash work,
//The context needs to be given an existing database or none at all - with none, you can do this. 
/*
function dbCreate(dbName){
   r.dbCreate(dbName)
     .run()
     .then(function(response){
        console.log(response);
     }
     .error(function(error){
        console.log('An error occurred during database creation at app.js dbCreate(): ', error);
     });
}*/

//This will have to be called to run, I think I'll make an Express route for it, and we can initialize the database from our browsers by calling that url.
function dbInit(){
   tables = ['courses', 'students', 'teachers'];
   for (var i = 0; i < tables.length; i++){
     dbTableCreate(tables[i]);
   }
}

function dbTableCreate(tblName){
   r.tableCreate(tblName, { primaryKey: 'id' })
     .run()
     .then(function(response){
        console.log('dbTableCreate() success: ', response);
     })
     .error(function(error){
        console.log('An error occurred app.js dbTableCreate(): ', error);
     });
}

//With NoSQL type databases, you always just insert JSON objects (or an array of them) and don't have to worry about specific schema / columns on a table.  That can be good and/or bad.  You'll see.
function dbInsert(tblName, json){
   r.table(tblName)
     .insert(json)
     .run()
     .then(function(response){
        console.log('dbInsert() success: ', response);
     })
     .error(function(error){
        console.log('An error occurred at app.js dbInsert(): ', error);
     });
}

function dbGetAll(tblName){
   r.table(tblName)
     .run()
     .then(function(response){
        console.log('dbGetAll() success: ', response);
     })
     .error(function(error){
        console.log('An error occurred at app.js dbGetAll(' + tblName + '): ', error);
     });
}

function dbGetById(tblName, id){
    r.table(tblName)
      .get(id)
      .run()
      .then(function(response){
        console.log('dbGetById() success: ', response);
      })
      .error(function(error){
        console.log('An error occurred at app.js dbGetById(' + tblName + '): ', error);
      });
}

//I don't know how to do this yet just using the rethinkdbdash driver
/*
//json should have an id property set to the id of the corresponding db row.
function dbUpdate(tblName, json){
}*/

//I'm hoping I don't have to do anything really weird with writable streams
/*
//json should have id property set to corresponding db row.
function dbDelete(tblName, json){
}*/

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

app.get('/api/teachers', (req, res) => {
   res.send(dbGetAll('teachers'));
});

//Example calling url:  https://metaquest.org/api/courses/3
/*
app.get ('/api/courses/:id', (req, res) => {
   res.send(req.params.id);
});*/

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

app.get ('/api/dbinit', (req, res) => {
   dbInit();
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
