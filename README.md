# mltrainer-exchange
Template solution to serve as front-end for machine learning hardware

INITIALIZATION OF PROJECT:
Do this before anything else.  Prereq - you should have Node.js installed as well as rethinkdb and its javascript drivers.
From a command line at the main folder of this repo:  "npm install"

DATABASE INSTALLATION / SETUP:
RethinkDB:  requirement for running in Docker - Docker of course must be installed (alternatively, you can install rethinkdb directly without running in Docker, see the rethinkdb website for instructions)
"docker run -d -P --name rethink1 rethinkdb"
To list ports it's listening on (if on Linux):
"docker container ls"
and/or
"ss -taulpn"

Now install the javascript drivers (from the Express app main folder) so the Express app javascript can talk to the datbase:
"npm install rethinkdb"

STARTING THE SERVER:

From this folder, just do:
"node index.js"

That will run greenlock-express and pass control to the app.
This is an Express starter template.

If you want to test it locally on your machine for development / debugging (make sure port 80 is NOT open on your OS firewall), just do:
"nodemon app.js"  --> this is not secure if it's a publicly open port, because it will be transmitted over http instead of https


