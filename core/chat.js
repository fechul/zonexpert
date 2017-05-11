var io;
var chat = {};
var roomList = [];

var usernames = {};

chat.init = function (server) {
    io = require('socket.io').listen(server);
    var matchId ='';
    io.on('connection', function (socket) {
        console.log('socket connection');
        socket.emit('connection', {
            type: 'connected'
        });


        socket.on('connection', function (data) {
            if (data.type == 'join') {
                if (roomList.indexOf(data.room) > -1) {
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

            if (!usernames[socket.room || 'trash']) {
                usernames[socket.room || 'trash'] = [];
            }

            usernames[socket.room || 'trash'].push({
                name: data.name,
                badge: data.badge
            });
            console.log('ddddddd');
            io.sockets.emit('updateusers', usernames[socket.room || 'trash']);
        });

        socket.on('sendchat', function (data) {
            var room = socket.room;

            if (room) {
                socket.in(room).emit('message', data);
            }
        });

        socket.on('disconnect', function () {
            for (var i = 0; i < usernames[socket.room || 'trash'].length; i++) {
                if(usernames[socket.room || 'trash'][i].name == socket.username) {
                    usernames[socket.room || 'trash'].splice(i, 1);
                    break;
                }
            }

            io.sockets.emit('updateusers', usernames[socket.room || 'trash']);
        });
    });
};

chat.controlRoom = function() {
    if (io) {
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
    // console.log('close : ', matchId);
    db.match.update({
        'id': matchId
    }, {
        '$set': {
            'roomOpen': false
        }
    }).exec();
};

chat.closeRoomAll = function() {
    console.log('closeRoomAll');
    db.match.update({}, {
        '$set': {
            'roomOpen': false
        }
    }, {
        'multi': true
    }).exec();
};

module.exports = chat;
