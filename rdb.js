//Private
//Load the rethinkdb settings
fs = require('fs');
rethinkdbConfig = JSON.parse(fs.readFileSync('rethinkDB.config', 'utf8'));

//Public
function GetPassCode(){
	return rethinkdbConfig.PassCode;
}

//Private
//https://github.com/neumino/rethinkdbdash
//TODO:  Make a dbinit function that first checks for the dbName, creates it if it doesn't exist, then makes the connection here.
var r = require('rethinkdbdash')({
	port: rethinkdbConfig.Port,
	host: rethinkdbConfig.Host,
	db: rethinkdbConfig.DatabaseName
});

//Private
//rethinkdbdash has a connection pool that will prevent the process from exiting, so I will use node-cleanup to handle draining the pool on process kill.
//https://github.com/jtlapp/node-cleanup
var nodeCleanup = require('node-cleanup');

//Private
//Now this function will get called when the process gets killed:
nodeCleanup(function (exitCode, signal) {
	console.log("Received exitCode " + exitCode + ", signal " + signal);
	r.getPoolMaster().drain(); //from the instructions on rethinkdbdash repo:  https://github.com/neumino/rethinkdbdash
});

//Public
function dbCreateDatabase(dbName){
	r.dbCreate(dbName)
	.run()
	.then(function(response){
		sendDbMsg(res, response, "dbCreate(" + dbName + ") success");
	})
	.error(function(error){
		sendDbMsg(res, 'Got an error', "dbCreate(" + dbName + "): " + error);
	});
}

//Public
function dbDropDatabase(dbName){
	r.dbDrop(dbName)
	.run()
	.then(function(response){
		sendDbMsg(res, response, "dbDelete(" + dbName + ") success");

	})
	.error(function(error){
		sendDbMsg(res, 'Got an error', "dbDelete(" + dbName + "): " + error);
	});
}



//Public
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


//Public
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

//Public
function dbInit(){
	var tables = ['courses', 'students', 'teachers'];
	for (var i = 0; i < tables.length; i++){
		dbCreateTable(tables[i]);
	}
}

//Public
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

//Public
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

//Public
//With NoSQL type databases, you always just insert JSON objects (or an array of them) and don't have to worry about specific schema / columns on a table.  That can be good and/or bad.  You'll see.
function dbInsert(res, tblName, json){
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

//Public
//This deletes records from a table
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

//Public
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

//Public
function dbReplace(res, tblName, json){
    r.table(tblName)
      .get(json.id)
      .replace(json)
      .run()
      .then(function(response){
	 sendDbMsg(res, response, "dbGetById(" + tblName + ") success");
      })
      .error(function(error){
	 sendDbMsg(res, "Got an error", "dbGetById(): " + error);
      });
}

//Public
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

//Public
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

//Private
function sendDbMsg(res, message, methodCaller){
    console.log(methodCaller + ":: " + message);
    res.send(message);
}

module.exports.GetPassCode = GetPassCode;
module.exports.dbCreateDatabase = dbCreateDatabase;
module.exports.dbDropDatabase = dbDropDatabase;
module.exports.dbList = dbList;
module.exports.dbInit = dbInit;
module.exports.dbCreateTable = dbCreateTable;
module.exports.dbDeleteTable = dbDeleteTable;
module.exports.dbInsert = dbInsert;
module.exports.dbGetAll = dbGetAll;
module.exports.dbReplace = dbReplace;
module.exports.dbQuery = dbQuery;
module.exports.dbUpdate = dbUpdate;
