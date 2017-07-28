const twilio = require('twilio');

const TWILIO_SID = 'AC0b33b4eb84a76feca51628afa91e2c1e';
const TWILIO_TOKEN = 'e0cceb98d864b7e5dbd39444ae3a8a33';
const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

module.exports = [
	{
		method: 'GET',
		url: '/',
		action: (req, res) => {
			res.send('About to get right.');
		}
	},
	{
		method: 'GET',
		url: '/ice-servers',
		action: (req, res) => {
			twilioClient.api.accounts(TWILIO_SID).tokens.create({})
				.then(token => res.send(token.iceServers));
		}
	}, 
	{
		method: 'GET',
		url: '/auth/google/return',
		action: (req, res) => {
			
		}
	}
];