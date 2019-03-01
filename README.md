# mltrainer-exchange
Template solution to serve as front-end for machine learning hardware

INITIALIZATION OF PROJECT:

Prereq - you should have Node.js installed.

From a command line at the main folder of this repo:  "npm install greenlock-express express rethinkdb".

Description of the above commmand:  greenlock-express is the module that handles getting certificates from Let's Encrypt when the index.js starts.  Express handles the url routes.  RethinkDB installs the javascript drivers so the script can talk to the database engine.

Next, edit these lines in index.js to your own email & domain:

if (!/^(www\.)?metaquest\.org$/.test(opts.domains)) {     <-- change this regex to test for your own domain:
     There's a \ before every '.' in your domain.  The $/. marks the end of the regular expression.
     
, email: 'aiherder@gmail.com'    <--- change to your own email

opts.domains = ['metaquest.org'];   <-- change to your own domain

DATABASE INSTALLATION / SETUP:
RethinkDB:  requirement for running in Docker - Docker of course must be installed.
Alternatively, you can install rethinkdb directly without running in Docker, see the rethinkdb website for instructions.
To download/start the engine in docker, no other steps required:  

"docker run -d -P --name rethink1 rethinkdb"

To list ports it's listening on (if on Linux):

"docker container ls"
and/or
"ss -taulpn"

Edit index.js again and change the value of rethinkdbPort to the port that rethinkDB's docker container port 28015 is mapped to.

STARTING THE SERVER:

From this folder, just do:

"node index.js"
That will run greenlock-express and its listener and then pass control to app.js

app.js is an Express starter template (I watched Mosh's latest video on the subject) with some rethinkDB methods added on - note that at this time, I still have some work to do on the db connection method before that will work - right now it's blowing up and spitting out a ton of errors into the log when the dbinit route is called.  After I do that refactoring, I will refactor the database methods into a different module and get rid of the routes directly exposing the database.

If you want to test it locally on your machine for development / debugging (make sure port 80 is NOT open on your OS firewall):

"nodemon app.js"  --> this is not secure if it's a publicly open port, because it will be transmitted over http instead of https


