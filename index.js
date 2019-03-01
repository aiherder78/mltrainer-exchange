/*
    This comes from the awesome creator of green-lock express, AJ O'Neal.
    https://git.coolaj86.com/coolaj86/greenlock-express.js  (git clone this if you want to follow the tutorials below, or you can just use this repo as it's already all done)
    //https://www.youtube.com/watch?v=e8vaR4CEZ5s&t=332s
    https://www.youtube.com/watch?v=bTEn93gxY50&t=181s
    Automatically does the certificate handshake with Let's Encrypt and passes control to the Express app (app.js).
    No further action is required from the admin, before or after, in order to setup an account.  You just get hassle-free / free site certificates, automatically.
    Make sure to change the email and domain to your own (line 19 and 21 below, and make sure to change the regex in line 14 to match your domain).
*/
'use strict';

function approveDomains(opts, certs, cb) {
   console.log(opts);

   if (!/^(www\.)?metaquest\.org$/.test(opts.domains)) {
      cb(new Error("no config found for '" + opts.domain + "'"));
      return;
   }

   opts.email = 'aiherder78@gmail.com';
   opts.agreeTos = true;
   opts.domains = ['metaquest.org'];

   cb(null, { options: opts, certs: certs });
}

var greenlock = require('greenlock-express').create({
//require('../').create({    //this assumes a relative directory, not doing this any more

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, stop and switch to staging
  // https://acme-staging-v02.api.letsencrypt.org/directory

  // You MUST change this to a valid email address
, email: 'aiherder@gmail.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, //approvedDomains: [ 'metaquest.org' ]
  approveDomains: function (opts, certs, cb) {
     approveDomains(opts, certs, cb);
 }

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: './keys'

, app: function (req, res) {
    require('./app.js')(req, res);
  }

// Get notified of important updates and help me make greenlock better
//, communityMember: true

//, debug: true


});

var server = greenlock.listen(80, 443);