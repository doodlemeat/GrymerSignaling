const restify = require('restify');
const socketio = require('socket.io');
const colors = require('colors');
const Roulette = require('./Roulette');
const twilio = require('twilio');
const corsMiddleware = require('restify-cors-middleware');
const passport = require('passport');
const GoogleStrategy = require('passport-google').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    returnURL: 'https://grymer.se/auth/google/return',
    realm: 'https://grymer.se/'
  },
  (identifier, profile, done) => {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

const cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['https://dev.grymer.se', 'https://grymer.se']
});

const TWILIO_SID = 'AC0b33b4eb84a76feca51628afa91e2c1e';
const TWILIO_TOKEN = 'e0cceb98d864b7e5dbd39444ae3a8a33';
const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
const waitForOfferTimeout = 1000;
const waitForAnswerTimeout = 1000;

const app = restify.createServer();
app.pre(cors.preflight);
app.use(cors.actual);

app.get('/ice-servers', (req, res) => {
	twilioClient.api.accounts(TWILIO_SID).tokens.create({})
		.then(token => res.send(token.iceServers));
});

const io = socketio.listen(app.server);

const roulette = new Roulette();

io.sockets.on('connection', socket => {
	roulette.setupListeners(socket);

	console.log(getSocketAddress(socket).green + ' connected'.green);
});


function getSocketAddress(socket) {
	return socket.handshake.headers['x-real-ip'];
}
app.listen(7000, () => {
  console.log('signaling server listening at %s', app.url);
})
