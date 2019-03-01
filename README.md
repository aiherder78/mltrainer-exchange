# mltrainer-exchange
Template solution to serve as front-end for machine learning hardware

With many thanks to AJ O'Neal, creator of Greenlock-Express, Mosh, for his awesome Express tutorials, and the folks at RethinkDB.

INITIALIZATION OF PROJECT:

Prereq - you should have Node.js installed.

"git clone https://github.com/aiherder78/mltrainer-exchange.git"
"cd mltrainer-exchange"

Next, edit these lines in server.js to your own email & domain:
----------------
if (!/^(www\.)?metaquest\.org$/.test(opts.domains)) {     <-- change this regex to test for your own domain:
     There's a \ before every '.' in your domain.  The $/. marks the end of the regular expression.
     
, email: 'aiherder@gmail.com'    <--- change to your own email

opts.domains = ['metaquest.org'];   <-- change to your own domain
----------------
Edit app.js and change rethinkDBPort value to your rethinkDB engine's port (default is 28015)
----------------
Now for the final command:
"npm start"


--------------------

DATABASE INSTALLATION / SETUP (this is for auto download of rethinkdb engine's Docker image):

Docker of course must be installed.
Alternatively, you can install rethinkdb directly without running in Docker, see the rethinkdb website for instructions for installation on your operating system.
To download/start the engine in docker:

"docker run -d -P --name rethink1 rethinkdb"

To list ports it's listening on (if on Linux):

"docker container ls"
and/or
"ss -taulpn"

Edit app.js again and change the value of rethinkdbPort to the port that rethinkDB's docker container port 28015 is mapped to.
---------------

app.js is an Express starter template (I watched Mosh's latest video on the subject) with some rethinkDB methods added on - note that at this time, I still have some work to do on the db connection method before that will work - right now it's blowing up and spitting out a ton of errors into the log when the dbinit route is called.  After I do that refactoring, I will refactor the database methods into a different module and get rid of the routes directly exposing the database.

If you want to test it locally on your machine for development / debugging (make sure port 80 is NOT open on your OS firewall):

"nodemon app.js"  --> this is not secure if it's a publicly open port, because it will be transmitted over http instead of https

TODO:  Finish database method refactoring / putting it in a module
https://stackoverflow.com/questions/30142041/create-a-database-if-is-needed-in-rethinkdb

TODO:  Maybe delete all the database methods and just use an ORM like Thinky:  https://github.com/neumino/thinky
           -->  I could move my functions to a separate module and then include thinky instead.
