var CHAT = {
    init: function(options) {
        this.name = options.nickname;
        this.room = options.roomId;
        this.badge = options.myBadge;

        notice.init();

        if(options.attendancePointUpdated) {
            notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
        }

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
            location.href = '/my_page';
        });

        $('#header .main_menu li').click(function() {
            var move = $(this).attr('move');
            location.href = '/' + move;
        });

        $('#header li.my_point > img').click(function() {
            location.href = '/my_page';
        });

        $('#header li.my_point > span').click(function() {
            location.href = '/my_page';
        });

        $('.user_search_input').keydown(function(e) {
            if(e.keyCode == 13) {
                $('.user_search_btn').click();
            }
        });

        $('.user_search_btn').click(function() {
            var id = $('.user_search_input').val();

            location.href = "/search?id=" + id;
        });

        $('#message-button').click(function () {
            var msg = $('#message-input').val();
            if (msg != '') {
                self.socket.emit('sendchat', {name: self.name, message: msg, badge: self.badge});
                self.writeMessage('me', self.name, msg, self.badge);
            }
            $('#message-input').focus();
        });

        $('#message-input').keypress(function (e) {
            if (e.which == 13) {
                $('#message-button').focus().click();
            }
        });

        $('.showUserList').click(function() {
            if($('.right-tabs').css('display') == 'none') {
                $('.window-area').hide();
                $('.right-tabs').fadeIn(500);
                $(this).html('채팅하기');
            } else {
                $('.right-tabs').hide();
                $('.window-area').fadeIn(500);
                $(this).html('유저 목록');
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
                    badge: self.badge
                });
            }
        });

        socket.on('system', function (data) {
            self.writeMessage('system', 'system', data.message);
        });
        socket.on('message', function (data) {
            self.writeMessage('other', data.name, data.message, data.badge);
        });

        socket.on('updateusers', function (data) {
            $('.member-list').empty();

            $('.member-list').append('<li>' + '접속자 수 : ' + data.length + '명' + '</li>');
            for (var i = 0; i < data.length; i++) {
                $('.member-list').append('<li><div class="badge_' + data[i].badge + '"></div><span class="chat_nickname"><nobr>' + data[i].name + '</nobr></span></li>');
            }
        });

        socket.on('updateLive', function (matchData) {
            if (matchData.result) {
                $('#goalsHomeTeam').html(matchData.result.goalsHomeTeam || 0);
                $('#goalsAwayTeam').html(matchData.result.goalsAwayTeam || 0);
            }

            if (matchData.status == 'FINISHED') {
                
            }
        });
    },

    writeMessage: function(type, name, message, badge) {
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
            html = '<li class="me"><div class="badge_' + badge + '"></div>' + name + ' : ' +  message + '<span class="chatTime">' + time +'</span>'+ '</li>';
            $('#message-input').val("");
        } else if (type == 'other') {
            html = '<li><div class="badge_' + badge + '"></div>' +  name + ' : ' +  message + '<span class="chatTime">' + time +'</span>'+ '</li>';
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
