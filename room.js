const util = require('util');

const RoomStatus = {
	NOT_STARTED: 1,
	WAITING_FOR_OFFER: 2,
	WAITING_FOR_ANSWER: 3,
	STARTED: 4
};

class Room {
  constructor(clientA = undefined, clientB = undefined) {
    this.clientA = clientA;
    this.clientB = clientB;
    this.full = this.clientA && this.clientB ? true : false;
	this.status 
  }
  
  join(client) {
	  this.addClient(client);
  }

  addClient(client) {
    if(this.clientA === undefined) {
      this.clientA = client;
    } else if(this.clientB === undefined) {
      this.clientB = client;
    }
	
	if(this.clientA && this.clientB) {
		this.full = true;
	}
  }

	start() {
		this.clientA.emit('action', { type: 'CREATE_OFFER' });
	}
  
	leave(socket) {
		if(this.clientA && this.clientA.id === socket.id) {
			this.clientA = undefined;
			if(this.clientB) {
				this.clientB.emit('action', { type: 'REMOTE_HANGUP' });
			}
			this.full = false;
			this.destroy = true;
		} else if(this.clientB && this.clientB.id === socket.id) {
			this.clientB = undefined;
			if(this.clientA) {
				this.clientA.emit('action', { type: 'REMOTE_HANGUP' });
			}
			this.full = false;
			this.destroy = true;
		}
	}
	
	hasClients() {
		return this.clientA || this.clientB;
	}
	
	getClients() {
		const clients = [];
		
		if(this.clientA) clients.push(this.clientA);
		if(this.clientB) clients.push(this.clientB);
		
		return clients;
	}
  
  // return true if socket exists in this room
  contains(socket) {
	return (this.clientA && this.clientA.id === socket.id) || (this.clientB && this.clientB.id === socket.id);
  }
	
	isA(socket)  {
		return this.clientA && this.clientA.id === socket.id;
	}
	
	isB(socket) {
		return this.clientB && this.clientB.id === socket.id;
	}
	
	getA() {
		return this.clientA;
	}
	
	getB() {
		return this.clientB;
	}
  
	isMemberOf(socket) {
		return this.contains(socket);
	}
}

module.exports = Room;
