var chat = {};

var usernames = [];

chat.init = function (server) {
    io = require('socket.io').listen(server);

    var matchId ='' ;
    io.on('connection', function (socket) {
        socket.emit('connection', {
            type: 'connected'
        });


        socket.on('connection', function (data) {

            // db.match.find({
            //     'matchId' : data.room
            // }),function(err, data){
            //     if(data && data.length){
            //         console.log('match', data);
            //     }else{
            //         console.log('err',err);
            //     }
            //
            // };

            if (data.type == 'join') {
                socket.join(data.room);
                socket.room = data.room;
                socket.emit('system', {
                    message: '채팅방에 오신 것을 환영합니다.'
                });
                socket.emit('system', {
                    message: data.name + '님이 접속하셨습니다.'
                });
            }
            socket.username = data.name;
            usernames.push(data.name);
            io.sockets.emit('updateusers', usernames);
            for(var i =0 ; i < usernames.length ; i++){
                console.log('user list' , usernames[i]);
            }
        });

        socket.on('sendchat', function (data) {
            var room = socket.room;
            console.log('room number', room);

            if (room) {
                socket.broadcast.to(room).emit('message', data);
            }
        });

//         socket.on('switchRoom', function (newroom) {
// // 현재 룸을 떠난다(현재 접속한 룸은 세션에 저장되어 있다)
//             socket.leave(socket.room);
// // 새로운 룸에 입장한다. 새로운 룸 이름은 함수 파라미터로 전달된다.
//             socket.join(newroom);
//             socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
//             // 이전 룸에 대해, 사용자가 떠났단느 메시지를 브로드캐스팅한다.
//             socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
// // 소켓 세션의 룸이름을 갱신한다.
//             socket.room = newroom;
//             socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
//             socket.emit('updaterooms', rooms, newroom);
//         });
        socket.on('disconnect', function () {

            if(usernames.indexOf(socket.username) > -1) {
                usernames.splice(usernames.indexOf(socket.username), 1);
            }

            io.sockets.emit('updateusers', usernames);

        });

    });

};

module.exports = chat;
