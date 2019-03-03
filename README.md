# MLtrainer-Exchange
Template solution to serve as front-end for machine learning hardware

With many thanks to AJ O'Neal, creator of Greenlock-Express, Mosh, for his awesome Express tutorials, and the folks at RethinkDB.

INITIALIZATION OF PROJECT:

Prereq - Node.js MUST be installed.
Optional prereq - if you want to use the single Docker command to start the database, you need Docker to be installed.
    - otherwise, install the rethinkDB database engine on your OS directly.

"git clone https://github.com/aiherder78/mltrainer-exchange.git"
"cd mltrainer-exchange"

Next, edit these lines in server.js to your own email & domain:
----------------
if (!/^(www\.)?metaquest\.org$/.test(opts.domains)) {     <-- change this regex to test for your own domain:
     There's a \ before every '.' in your domain.  The $/. marks the end of the regular expression.  The /^ is the start of it.
     The "www." is marked as optional (that's what the parenthesis followed by ? does).
     
, email: 'aiherder@gmail.com'    <--- change to your own email

opts.domains = ['metaquest.org'];   <-- change to your own doma

----------------
DATABASE INSTALLATION / SETUP (this is for auto download of rethinkdb engine's Docker image):
----------------

Docker of course must be installed.
Alternatively, you can install rethinkdb directly without running in Docker, see the rethinkdb website for instructions for installation on your operating system.
To download/start the engine in docker:

"docker run -d -P --name rethink1 rethinkdb"

Now find the port it's listening on:

"docker container ls"
and/or
"ss -taulpn"

Create a new file called "rethinkDB.config"
Contents should be as follows (include the brackets but not the dashed lines - pay attention to the values below...you have to change them to your own):

-----------------------------

{

   "Port":  "the port number you found above",
   
   "Host":  "localhost",
   
   "DatabaseName":  "test",
   
   "PassCode":  "your random guid - you can just mash a bunch of keys to make it - make it long"
   
}

------------------------------
You may want to make a .gitignore file and put the name of the above file, rethinkDB.config, in it so that if you commit this to your own repo, it won't be included.

------------------------------
If you want to test this locally on your machine for development (make sure port 80 is NOT open on your OS firewall):

"nodemon app.js"  --> this is not secure if it's a publicly open port, because it will be transmitted over http instead of https

TODO:  Finish database method refactoring / putting db methods in a separate module
Possibly switch to an ORM like Thinky:  https://github.com/neumino/thinky

Notes:
DONE:
I was watching Youtube videos / tutorials on Thinky ( https://www.youtube.com/watch?v=d01rLeIjTLE ), and I found that the driver that Thinky uses, rethinkdbdash ( https://github.com/neumino/rethinkdbdash ) is much better than the one I was using (npm install rethinkdb).  Rethinkdbdash has a connection pool and automatically connects / stays available, unlike rethinkdb driver.  
I have switched out the standard rethinkdb driver for this one, as well as added a cleanup method so you can easily kill the process and not mess up the db.
