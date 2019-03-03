'use strict';

var express = require('express');
var app = express();

//Load the rethinkdb settings
var fs = require('fs');
var rethinkdbConfig = JSON.parse(fs.readFileSync('rethinkDB.config', 'utf8'));

//Database related config:
//var rethinkdbHost = 'localhost';
//var rethinkdbDatabaseName = 'test';
//var rethinkdbPort = 28015 or whatever port that is mapped to on your host from the container if you are using Docker - see the README on the mltrainer-exchange repo for instructions;
var passCode = rethinkdbConfig.PassCode;  //This provides a thin layer of extra security to keep out newb hackers

//https://github.com/neumino/rethinkdbdash
//TODO:  Make a dbinit function that first checks for the dbName, creates it if it doesn't exist, then makes the connection here.
var r = require('rethinkdbdash')({
   port: rethinkdbConfig.Port,
   host: rethinkdbConfig.Host,
   db: rethinkdbConfig.DatabaseName
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
        sendDbMsg(res, response, "dbCreate(" + dbName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbCreate(" + dbName + "): " + error);
     });
}

function dbDelete(dbName){
   r.dbDrop(dbName)
     .run()
     .then(function(response){
        sendDbMsg(res, response, "dbDelete(" + dbName + ") success");

     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbDelete(" + dbName + "): " + error);
     });
}

//https://www.rethinkdb.com/api/javascript/db_list/
function dbList(res){
   r.dbList()
     .run()
     .then(function(response){
        sendDbMsg(res, response, "dbList() success");
     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbList(): " + error);
     });
}

//Not sure about this one
//It may instead just be a matter of setting r.db = dbName
//I saw one example in response to a question on stackoveflow:  https://stackoverflow.com/questions/43229735/how-to-mock-rethinkdb-for-unit-test-my-daos-in-nodejs/45758781#45758781
function dbSwitch(dbName){
   r.use(dbName)
     .run()
     .then(function(response){
        sendDbMsg(res, 'Switch db success', "dbSwitch(" + dbName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbSwitch(" + dbName + "): " + error);
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
        sendDbMsg(res, 'Create table success', "dbCreateTable(" + tblName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbCreateTable(" + tblName + "): " + error);
     });
}

function dbDeleteTable(tblName){
   r.tableDrop(tblName)
     .run()
     .then(function(response){
        sendDbMsg(res, 'Delete table success', "dbDeleteTable(" + tblName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, 'Got an error', "dbDeleteTable(" + tblName + "): " + error);
     });
}

//With NoSQL type databases, you always just insert JSON objects (or an array of them) and don't have to worry about specific schema / columns on a table.  That can be good and/or bad.  You'll see.
function dbInsert(tblName, json){
   r.table(tblName)
     .insert(json)
     .run()
     .then(function(response){
        sendDbMsg(res, 'Insert success', "dbInsert(" + tblName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, "Got an error", "dbInsert(" + tblName + "): " + error);
     });
}

function dbGetAll(tblName, res){
   const noRows = "No rows exist.";
   r.table(tblName)
     .run()
     .then(function(response){
        if (response != null && response.length > 0){
           res.send(noRows);
        }
        sendDbMsg(res, response, "dbGetAll(" + tblName + ") success");
     })
     .error(function(error){
        sendDbMsg(res, "Got an error", "dbGetAll(" + tblName + "): " + error);
     });
}

//I would never do this - if I have an id, that means I already have the object
//and may want to replace it...there's a replace method in rethinkdb / ReQL.
function dbGetById(res, tblName, id){
    r.table(tblName)
      .get(id)
      .run()
      .then(function(response){
         sendDbMsg(res, response, "dbGetById(" + tblName + ") success");
      })
      .error(function(error){
         sendDbMsg(res, "Got an error", "dbGetById(): " + error);
      });
}

function dbQuery(res, tblName, filter){
    //r.table(tblName).filter(db.row(json).downcase().match(title.toLowerCase()));   //TODO:  Figure out how to perform lowercase match for every property
    r.table(tblName)
      .filter(db.row(filter))
      .run()
      .then(function(response){
         sendDbMsg(res, JSON.stringify(response), "dbQuery() success" + tblName + ", " + filter);
      })
      .error(function(error){
         sendDbMsg(res, "Got an error", "dbQuery() error" + tblName + ", " + filter);
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

app.get ('/api/:pass/:tblName/:operation/:filterOrJson/:json', (req, res) => {
   var tblName = req.params.tblName;
   var operation = req.params.operation;
   var filterOrJson = req.params.filterOrJson;
   var json = req.params.json;
   if (pass != null && pass == passCode && tblName != null){
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

app.get('/smashGlass/:pass/:database/:operation/:filter', (req, res) => {
   var database = req.params.database;
   var operation = req.params.operation;

   if (pass != null && pass == passCode){
      if (database != null){
         if (operation == "switch" && filter != null){
            dbSwitch(filter);
         }
         else if (operation == "listDatabases"){
            dbList();
         }
         else if (operation == "createDb" && filter != null){
            dbCreate(filter);
         }
         else if (operation == "deleteDb" && filter != null){
            //Perform a db backup first, send a two-factor auth first & get approval before deleting
            //https://www.rethinkdb.com/api/javascript/db_drop/
         }
         else if (operation == "listTables"){
            dbList(res);
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
