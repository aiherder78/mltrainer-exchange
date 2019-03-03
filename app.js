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


function dbCreate(dbName){
   r.dbCreate(dbName)
     .run()
     .then(function(response){
        console.log(response);
     })
     .error(function(error){
        console.log('An error occurred during database creation at app.js dbCreate(): ', error);
     });
}

function dbInit(){
   var tables = ['courses', 'students', 'teachers'];
   for (var i = 0; i < tables.length; i++){
     dbCreateTable(tables[i]);
   }
}

function dbCreateTable(tblName){
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

function dbGetAll(tblName, res){
   var returnResponse = "No rows exist.";
   r.table(tblName)
     .run()
     .then(function(response){
        if (response != null && response.length > 0){
           returnResponse = JSON.stringify(response);
        }
        console.log('dbGetAll() success on table: ' + tblName + ', ' + returnResponse);
        res.send(returnResponse);
     })
     .error(function(error){
        consoleLog = 'An error occurred at app.js dbGetAll(' + tblName + '): ', error;
        console.log(consoleLog);

        returnResponse = 'An error occurred attempting to retrieve the table';
        res.send(returnResponse);
     });
}

function dbGetById(res, tblName, id){
    r.table(tblName)
      .get(id)
      .run()
      .then(function(response){
        console.log('dbGetById() success: ', response);
        res.send(JSON.stringify(response));
      })
      .error(function(error){
         sendDbMsg(res, "Got an error", "dbGetById() " + error);
      });
}

//TODO:  Maybe I should just use Thinky....

function dbQuery(res, tblName, json){
    //r.table(tblName).filter(db.row(json).downcase().match(title.toLowerCase()));   //TODO:  Figure out how to perform lowercase match for every property
    r.table(tblName)
      .filter(db.row(json))
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbQuery() success for " + tblName + ", " + json);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error during query", "dbQuery() error on " + tblName + ", " + json);
      });
}

function dbUpdate(tblName, filter, json){
    r.table(tblName)
      .filter(db.row(filter))
      .update(json)
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbUpdate() success for " + tblName + ", filter:: " + filter + ", update:: " + json);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error during query", "dbUpdate() error on " + tblName + ", filter:: " + filter + ", update::" + json);
      });
}

function sendDbMsg(res, message, methodCaller){
    console.log(methodCaller + ":: " + message);
    res.send(message);
}

function dbDelete(tblName, filter){
    r.table(tblName)
      .filter(db.row(filter))
      .delete()
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbDelete() success for " + tblName + ", filter:: " + filter);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error during delete", "dbDelete() error on " + tblName + ", filter:: " + filter);
      });
}

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
   dbGetAll('teachers', res);
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

app.get('/api/createTable/:tableName', (req, res) => {
   if (req.params.tableName != null){
      dbCreateTable(req.params.tableName); 
   }
   res.send('OK');
});

app.get ('/api/getall/:tableName', (req, res) => {
   var tblName = req.params.tableName;
   if (tblName != null){
      dbGetAll(tblName, res);
   }
   else {
      res.send('Please specify a table name');
   }
});

app.get ('/api/insertStudent', (req, res) => {
   dbInsert('students', req.query);
   res.send('OK');
});

app.get ('/api/insertCourse', (req, res) => {
   dbInsert('courses', req.query);
   res.send('OK');
});

app.get ('/api/insertTeacher', (req, res) => {
   dbInsert('teachers', req.query);
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
