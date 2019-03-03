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
  console.log("Received exitCode " + exitCode + ", signal " + signal);
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
        console.log('dbCreateTable() success: ', response);
     })
     .error(function(error){
        console.log('An error occurred app.js dbCreateTable(): ', error);
     });
}

function dbDeleteTable(tblName){
   r.tableDrop(tblName)
     .run()
     .then(function(response){
        console.log('dbDeleteTable() success: ', response);
     })
     .error(function(error){
        console.log('An error occurred app.js dbDeleteTable(), table ' + tblName + ': ', error);
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

//I would never do this - if I have an id, that means I already have the object
//and may want to replace it...there's a replace method in rethinkdb / ReQL.
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

function dbQuery(res, tblName, filter){
    //r.table(tblName).filter(db.row(json).downcase().match(title.toLowerCase()));   //TODO:  Figure out how to perform lowercase match for every property
    r.table(tblName)
      .filter(db.row(filter))
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbQuery() success" + tblName + ", " + json);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error", "dbQuery() error" + tblName + ", " + json);
      });
}

function dbUpdate(res, tblName, filter, json){
    r.table(tblName)
      .filter(db.row(filter))
      .update(json)
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbUpdate() success" + tblName + ", filter:: " + filter + ", update:: " + json);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error", "dbUpdate() error" + tblName + ", filter:: " + filter + ", update::" + json);
      });
}

function sendDbMsg(res, message, methodCaller){
    console.log(methodCaller + ":: " + message);
    res.send(message);
}

function dbDelete(res, tblName, filter){
    r.table(tblName)
      .filter(db.row(filter))
      .delete()
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbDelete() success" + tblName + ", filter:: " + filter);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error during delete", "dbDelete() error" + tblName + ", filter:: " + filter);
      });
}

//Database stuff is done,
//Let's do some Express routes:
app.get ('/', (req, res) => {
   res.setHeader('Context-Type', 'text/html; charset=utf-8');
   res.send('Hello World 2!');
});

/*
//Example calling url:  https://metaquest.org/api/courses
app.get ('/api/courses', (req, res) => {
   res.send([1,2,3]);
});*/

/*
app.get('/api/teachers', (req, res) => {
   dbGetAll('teachers', res);
});*/

//Example calling url:  https://metaquest.org/api/courses/3
/*
app.get ('/api/courses/:id', (req, res) => {
   res.send(req.params.id);
});*/

/*
//Example calling url:  https://metaquest.org/api/courses/2019/3
app.get ('/api/courses/:year/:month', (req, res) => {
   res.send(req.params);
   //Can't have more than one res.send, because that returns the data to the calling browser and exits the function.
   //res.send(req.params.year);  //But you can get to the individual parameters like this if you want to use them to do something else.
   //res.send(req.params.month);
});*/

/*
//Example calling url:  https://metaquest.org/ap/course/query?myQueryParameter=3
app.get ('/api/query', (req, res) => {
   var me = req.query.me;
   console.log(me);
   res.send(req.query);
   //res.send('query received: ' + req.query);
});*/

/*
app.get ('/api/insertTeacher', (req, res) => {
   dbInsert('teachers', req.query);
   res.send('OK');
});*/

app.get ('/api/:tblName/:operation/:filterOrJson/:json', (req, res) => {
   var tblName = req.params.tblName;
   var operation = req.params.operation;
   var filterOrJson = req.params.filterOrJson;
   var json = req.params.json;
   
   if (tblName != null){
      if (operation != null){
         if (operation == "query"){
            dbQuery(res, tblName, filterOrJson);
         }
         else if (operation == "new"){
            dbInsert(res, tblName, filterOrJson);
         }
         else if (operation == "update"){
            dbUpdate(res, tblName, filterOrJson, json);
         }
         else if (operation == "replace"){
            //TODO:  implement this function
            //dbReplace(res, tblName, filterOrJson, json);
         }
         else if (operation == "delete"){
            dbDelete(res, tblName, filterOrJson);
         }
         else {
            res.send("Invalid operation - must be one of: (query, new, update, delete, createTable, deleteTable)");
         }
      }
      else {
         dbGetAll(res, tblName);
      }
   }
   else {
      res.send("?");
   }
});

app.get('/smashGlass/:database/:operation/:filter', (req, res) => {
   var database = req.params.database;
   var operation = req.params.operation;

   if (database != null){
      if (operation == "switch" && filter != null){
         //find code to switch database of connection
         //implement a separate method for that and call it here
      }
      else if (operation == "listDatabases"){
         //https://www.rethinkdb.com/api/javascript/db_list/
      }
      else if (operation == "createDb" && filter != null){
         dbCreate(filter);
      }
      else if (operation == "deleteDb" && filter != null){
         //Perform a db backup first, send a two-factor auth first & get approval before deleting
         //https://www.rethinkdb.com/api/javascript/db_drop/
      }
      else if (operation == "listTables"){
         //https://www.rethinkdb.com/api/javascript/table_list/
      }
      else if (operation == "createTable" && filter != null){
         dbCreateTable(res, filter);
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
   res.send("OK");
}

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
