var chat = {};
chat.io;
chat.roomList = [];
chat.usernames = {};
chat.init = function (server) {
    chat.io = require('socket.io').listen(server);
    var matchId ='';
    chat.io.on('connection', function (socket) {
        console.log('socket connection');
        socket.emit('connection', {
            type: 'connected'
        });


        socket.on('connection', function (data) {
            if (data.type == 'join') {
                if (chat.roomList.indexOf(data.room) > -1) {
                    socket.room = data.room
                } else {
                    socket.room = null;
                }

                socket.room = data.room;
                socket.join(socket.room || 'trash');

                if (socket.room) {
                    socket.emit('system', {
                        message: '채팅방에 오신 것을 환영합니다.'
                    });
                } else {
                    socket.emit('system', {
                        message: '이 채팅방은 사용할 수 없습니다.'
                    });
                }

            }

            socket.username = data.name;

            if (!chat.usernames[socket.room || 'trash']) {
                chat.usernames[socket.room || 'trash'] = [];
            }

            var alreadyIn = false;
            if(chat.usernames[socket.room]) {
                for(var i = 0; i < chat.usernames[socket.room].length; i++) {
                    if(chat.usernames[socket.room][i].name == data.name) {
                        alreadyIn = true;
                        break;
                    }
                }
            }

            if(!alreadyIn) {
                chat.usernames[socket.room || 'trash'].push({
                    name: data.name,
                    badge: data.badge
                });
            }

            chat.io.sockets.emit('updateusers', chat.usernames[socket.room || 'trash']);
        });

        socket.on('sendchat', function (data) {
            var room = socket.room;

            if (room) {
                socket.in(room).emit('message', data);
            }
        });

        socket.on('disconnect', function () {
            if (chat.usernames[socket.room || 'trash']) {
                for (var i = 0; i < chat.usernames[socket.room || 'trash'].length; i++) {
                    if(chat.usernames[socket.room || 'trash'][i].name == socket.username) {
                        chat.usernames[socket.room || 'trash'].splice(i, 1);
                        break;
                    }
                }
            }

            chat.io.sockets.emit('updateusers', chat.usernames[socket.room || 'trash']);
        });
    });
};

chat.controlRoom = function() {
    if (chat.io) {
        var roomList = this.roomList;
        var matchList = [];
        matchList = matchList.concat(__matchList.TIMED);
        matchList = matchList.concat(__matchList.IN_PLAY);
        matchList = matchList.concat(__matchList.FINISHED);

        roomList = matchList;

        db.match.update({
            'id': {
                '$in': roomList
            }
        }, {
            'roomOpen': true
        }, {
            'multi': true
        }).exec(function() {
            db.match.update({
                'id': {
                    '$nin': roomList
                }
            }, {
                'roomOpen': false
            }, {
                'multi': true
            }).exec(function() {
                // console.log('roomList : ', roomList);
            });
        });
    }
};

chat.openRoom = function(matchId) {
    // console.log('open : ', matchId);
    db.match.update({
        'id': matchId
    }, {
        '$set': {
            'roomOpen': true
        }
    }).exec();
};

chat.closeRoom = function(matchId) {
    db.match.update({
        'id': matchId
    }, {
        '$set': {
            'roomOpen': false
        }
    }).exec();
};

chat.closeRoomAll = function() {
    db.match.update({}, {
        '$set': {
            'roomOpen': false
        }
    }, {
        'multi': true
    }).exec();
};

chat.sendMsgToRoom = function(_matchId, msg) {
    chat.io.in(_matchId).emit('updateLive', msg);
};

module.exports = chat;
