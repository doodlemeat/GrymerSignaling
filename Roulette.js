const _ = require('lodash');
const Room = require('./room');

module.exports = class {
	constructor() {
		this._rooms = [];
		
		this._handleDisconnect = this._handleDisconnect.bind(this);
		this._handleOfferCreated = this._handleOfferCreated.bind(this);
		this._handleAnswerCreated = this._handleAnswerCreated.bind(this);
		this._handleAnswer = this._handleAnswer.bind(this);
		this._handleIceCandidate = this._handleIceCandidate.bind(this);
		this._handleNext = this._handleNext.bind(this);
		this._handleSearch = this._handleSearch.bind(this);
		this._handleStopSearch = this._handleStopSearch.bind(this);
	}
	
	setupListeners(socket) {
		socket.on('disconnect', _.partial(this._handleDisconnect, socket));
		socket.on('offer-created', _.partial(this._handleOfferCreated, socket));
		socket.on('answer-created', _.partial(this._handleAnswerCreated, socket));
		socket.on('answer', _.partial(this._handleAnswer, socket));
		socket.on('ice-candidate', _.partial(this._handleIceCandidate, socket));
		socket.on('next', _.partial(this._handleNext, socket));
		socket.on('search', _.partial(this._handleSearch, socket));
		socket.on('stop-search', _.partial(this._handleStopSearch, socket));
	}
	
	_handleDisconnect(socket) {
		console.log('_handleDisconnect');
		this._handleStopSearch(socket);
		console.log(this._getSocketAddress(socket).red + ' disconnected'.red);
	}
	
	_handleOfferCreated(socket, sdp) {
		console.log('_handleOfferCreated');
		const room = this._getCurrentRoom(socket);
		
		if(!room) return;
		
		if(room.clientA && room.clientB) {
			console.log(this._getSocketAddress(room.clientA).yellow, 'created an offer, sending to'.yellow, this._getSocketAddress(room.clientB).yellow);
			room.clientB.emit('create-answer', sdp);
		}
	}
	
	_handleAnswerCreated(socket, sdp) {
		console.log('_handleAnswerCreated');
		const room = this._getCurrentRoom(socket);
		
		if(!room) return;
		
		if(room.clientA && room.clientB) {	
			console.log(this._getSocketAddress(room.clientB).cyan, 'answering'.cyan, this._getSocketAddress(room.clientA).cyan);
			room.clientA.emit('answer', sdp);
		}
	}
	
	_handleAnswer(socket, sdp) {
		console.log('_handleAnswer');
		for(let i = 0; i < this._rooms.length; ++i) {
			if(this._rooms[i].clientA.id === socket.id) {
				this._rooms[i].clientB.emit('answer', sdp);
				break;
			} else if(this._rooms[i].clientB.id === socket.id) {
				this._rooms[i].clientA.emit('answer', sdp);
				break;
			}
		}
	}
	
	_handleIceCandidate(socket, data) {
		console.log('_handleIceCandidate');
		for(let i = 0; i < this._rooms.length; ++i) {
			if(this._rooms[i].clientA && this._rooms[i].clientA.id === socket.id && this._rooms[i].clientB) {
				this._rooms[i].clientB.emit('ice-candidate', data.candidate);
				break;
			} else if(this._rooms[i].clientB && this._rooms[i].clientB.id === socket.id && this._rooms[i].clientA) {
				this._rooms[i].clientA.emit('ice-candidate', data.candidate);
				break;
			}
		}
	}
	
	_handleNext(socket) {
		console.log('_handleNext');
		
		// tell my partner(if I have one) that I hangup
		// look for new partners for me
		// look for new partners for me partner
		
		const room = this._getCurrentRoom(socket);
		if(!room) return;
		
		if(!room.full) return;
		
		const indexOfRoom = this._rooms.findIndex(room => room.isMemberOf(socket));
		console.log('	indexOfRoom:', indexOfRoom);
		this._rooms.splice(indexOfRoom, 1);
		
		if(room.isA(socket)) {
			if(room.getB())
				room.getB().emit('remote-hangup');
			this._handleSearch(socket);
		}
		
		if(room.isB(socket)) {
			if(room.getA())
				room.getA().emit('remote-hangup');
			this._handleSearch(socket);
		}
		
		if(room.isA(socket) && room.getB()) {
			this._handleSearch(room.getB());
		}
		
		if(room.isB(socket) && room.getA()) {
			this._handleSearch(room.getA());
		}
	}
	
	_handleSearch(socket) {
		console.log('_handleSearch');
		const room = this._findRoomToJoin();
		if(!room) {
			console.log('	Creating own room');
			this._createRoom(socket);
			return;
		}
		
		if(room.isMemberOf(socket)) {
			return;
		}
		
		console.log('	Joining room');
		room.join(socket);
		room.start();
	}
	
	_handleStopSearch(socket) {
		console.log('_handleStopSearch');
		const room = this._getCurrentRoom(socket);
		if(!room) return;
		
		const indexOfRoom = this._rooms.findIndex(room => room.isMemberOf(socket));
		console.log('	indexOfRoom:', indexOfRoom);
		this._rooms.splice(indexOfRoom, 1);
		
		room.leave(socket);
		
		const clientsLeft = room.getClients();
		if(clientsLeft.length === 1) {
			clientsLeft.forEach((client) => {
				this._handleSearch(client);
			});
		}
	}
	
	_createRoom(socket) {
		const room = new Room(socket);
		this._rooms.push(room);
	}
	
	_findRoomToJoin() {
		let availableRooms = this._rooms.filter(room => !room.full);
		if(availableRooms.length === 0) {
			return null;
		}
		
		return availableRooms[0];
	}
	
	_getCurrentRoom(socket) {
		for(let i = 0; i < this._rooms.length; ++i) {
			if(this._rooms[i].isMemberOf(socket)) {
				return this._rooms[i];
			}
		}
	}
	
	_getSocketAddress(socket) {
		return socket.handshake.headers['x-real-ip'];
	}
}