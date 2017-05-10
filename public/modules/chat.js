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

        $('.tools .user_search_input').keydown(function(e) {
            if(e.keyCode == 13) {
                $('.tools .user_search_btn').click();
            }
        });

        $('.tools .user_search_btn').click(function() {
            var id = $('.tools .user_search_input').val();

            location.href = "/search?id=" + id;
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
        });
    },

    writeMessage: function(type, name, message) {
        var html = '';

        var time = new Date();
        var hour = time.getHours();
        var minutes = time.getMinutes();
        var seconds = time.getSeconds();
        if(hour <10)
            hour = '0'+hour;
        if(minutes < 10)
            minutes = '0' + minutes;
        if(seconds < 10)
            seconds = '0' + seconds;
        time = hour + ':' + minutes + ':' + seconds;

        if (type == 'me') {
            html = '<li class="me">' +  name + ' : ' +  message + '<span class="chatTime">' + time +'</span>'+ '</li>';
            $('#message-input').val("");
        } else if (type == 'other') {
            html = '<li>' +  name + ' : ' +  message + '<span class="chatTime">' + time +'</span>'+ '</li>';
        } else {
            html = '<div style="padding:5px;">'+message+'</div>';
        }

        var chatContentHeight = $('#chat-content').height();
        var chatListHeight = $('.chat-list').height();
        var scrollListScrollTop = $('.chat-list').scrollTop();

        $(html).appendTo('#chat-content');

        if((chatContentHeight - chatListHeight)*0.95 <= scrollListScrollTop) {
            $('.chat-list').stop();
            $('.chat-list').animate({scrollTop: chatContentHeight}, 100);
        } else {
            $('.chat-list').stop();
        }
    }
};