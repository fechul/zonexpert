var CHAT = {
    init: function(options) {
        this.name = options.nickname;
        this.room = options.roomId;

        this.init_events();
        this.connect_socket();
    },

    init_events: function() {
        var self = this;

        $('#header .tools .signup').click(function() {
            location.href = "/signup";
        });

        $('#header .tools .login').click(function() {
            location.href = "/login";
        });

        $('#header .tools .logout').click(function() {
            $.post('/logout', {}, function(logout) {
                if (logout.result) {
                    location.href = "/";
                } else {
                    console.log(logout);
                }
            });
        });

        $('#header .tools .my_page').click(function() {
            //마이페이지
        });

        $('#header .main_menu li').click(function() {
            var move = $(this).attr('move');
            location.href = '/' + move;
        });

        $('#message-button').click(function () {
            var msg = $('#message-input').val();
            self.socket.emit('sendchat', {name: self.name, message: msg});
            if (msg != '')
                self.writeMessage('me', self.name, msg);
            $('#message-input').focus();
        });

        $('#message-input').keypress(function (e) {
            if (e.which == 13) {
                $('#message-button').focus().click();
            }
        });


    },

    connect_socket: function() {
        var self = this;

        var socket = io();
        self.socket = socket;

        socket.on('connection', function (data) {
            if (data.type == 'connected') {
                socket.emit('connection', {
                    type: 'join',
                    name: self.name,
                    room: self.room,
                });
            }
        });

        socket.on('system', function (data) {
            self.writeMessage('system', 'system', data.message);
        });
        socket.on('message', function (data) {
            self.writeMessage('other', data.name, data.message);
        });

        socket.on('updateusers', function (data) {
            $('.member-list').empty();

            $('.member-list').append('<li>' + '접속자 수 : ' + data.length + '명' + '</li>');
            for (var i = 0; i < data.length; i++) {
                $('.member-list').append('<li>' + data[i] + '</li>');
            }
            //            $.each(data, function(key, value) {
            //                $('.users').append('<div>' + key + '</div>');
            //                console.log("username" , key);
            //            });
        });
    },

    writeMessage: function(type, name, message) {
        var html = '';
        var time = new Date();
        if (type == 'me') {
            html = '<li class="me"><div class="name"><span class="">'+name+'</span></div>' +
                '<div class="message"><p>'+message+'</p><span class="msg-time">'+time+'</span></div></li>';

        } else if (type == 'other') {
            html = '<li class=""><div class="name"><span class="">'+name+'+</span></div>' +
                '<div class="message"><p>'+message+'</p><span class="msg-time">'+time+'</span></div></li>';
        } else {
            html = '<div>'+message+'</div>';
        }
        //html = html.replace('{MESSAGE}', printName + message);
        $(html).appendTo('#chat-content');
        $('body').stop();
        $('body').animate({scrollTop: $('body').height()}, 500);
        $('#message-input').val("");

    }
    //
    // writeMessage: function(type, name, message) {
    //     var html = '<div>{MESSAGE}</div>';
    //     var printName = '';
    //     if (type == 'me') {
    //         printName = name + '(나) : ';
    //         printName.bold();
    //     } else if (type == 'other') {
    //         printName = name + ' : ';
    //     }
    //     html = html.replace('{MESSAGE}', printName + message);
    //     $(html).appendTo('.j-message');
    //     $('body').stop();
    //     $('body').animate({scrollTop: $('body').height()}, 500);
    //     $('#message-input').val("");
    //
    // }
};