var CHAT = {
    init: function(options) {
        this.name = options.nickname;
        this.room = options.roomId;
        this.badge = options.myBadge;
        this.sportsId = options.sportsId;
        this.leagueId = options.leagueId;
        this.email = options.email;

        notice.init();

        if(options.attendancePointUpdated) {
            notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
        }

        this.init_events();
        this.connect_socket();
        this.setPredictionUserList();
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

        $(document).on('click', '.eachPredictedUser', function() {
            if(!$(this).hasClass('active')) {
                $('#predictedUserPredictBox').hide();
                $('.eachPredictedUser').removeClass('active');
                $(this).addClass('active');
                var target = $(this).attr('target');

                self.setUserPredictData(target);
            }
        });

        $('#viewThisUsersPredict').click(function() {
            var target = $('.eachPredictedUser.active').attr('target');

            $.post('/prediction/viewOthers', {
                targetNickname: target,
                matchId: self.room
            }, function(result) {
                if(result) {
                    if(result.result && result.result !== 'false') {
                    $('#viewBtnDiv').hide();
                    $('#isShownDiv').show();
                    $('#predictedUserPredictBox').fadeIn(500);
                    $('#my_current_point').html(parseInt($('#my_current_point').text(), 10)-100);
                    $('#mobile_my_current_point').html(parseInt($('#mobile_my_current_point').text(), 10)-100);
                    } else {
                        notice.show('alert', '조회에 실패했습니다.');
                    }
                } else {
                    notice.show('alert', '조회에 실패했습니다.');
                }
            });
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
    },

    setPredictionUserList: function() {
        var matchId = this.room;
        var sportsId = this.sportsId;
        var predictedUserList = $('.predictedUsersList');
        predictedUserList.empty();

        $.get('/prediction/getUserList', {
            'matchId': matchId,
            'sportsId': sportsId
        }, function(userList) {

            if(userList && userList.length) {
                var userListHtml = '';

                for(var i = 0; i < userList.length; i++) {
                    userListHtml += '<div class="eachPredictedUser" target="' + userList[i].nickname + '">';

                    if(userList[i].readyGameCnt && userList[i].readyGameCnt > 0) {
                        userListHtml += '<div class="predictedUserBadge badge_ready"></div>';
                    } else {
                        if(userList[i].myTotalRate <= 3) {
                            userListHtml += '<div class="predictedUserBadge badge_diamond"></div>';
                        } else if(3 < userList[i].myTotalRate && userList[i].myTotalRate <= 10) {
                            userListHtml += '<div class="predictedUserBadge badge_platinum"></div>';
                        } else if(10 < userList[i].myTotalRate && userList[i].myTotalRate <= 30) {
                            userListHtml += '<div class="predictedUserBadge badge_gold"></div>';
                        } else if(30 < userList[i].myTotalRate && userList[i].myTotalRate <= 70) {
                            userListHtml += '<div class="predictedUserBadge badge_silver"></div>';
                        } else if(70 < userList[i].myTotalRate) {
                            userListHtml += '<div class="predictedUserBadge badge_bronze"></div>';
                        }
                    }

                    userListHtml += '<span class="predictedUserInfo"><span class="predictedUserNickname">' + userList[i].nickname + '</span>&nbsp&nbsp&nbsp&nbsp<span class="predictedUserRating">' +  parseInt(userList[i].rating, 10) + '</span></span>';
                    userListHtml += '</div>';
                }

                predictedUserList.append(userListHtml);
            } else {
                predictedUserList.append('<p class="noPredictedUser" style="border-bottom:0px;">예측한 사용자가 없습니다.</p>');
            }
        });
    },

    setUserPredictData: function(target) {
        var sporstId = this.sportsId;
        var leagueId = this.leagueId;
        var matchId = this.room;
        var myEmail = this.email;

        $.get('/prediction/getUserInfo', {
            'target': target,
            'matchId': matchId,
            'sportsId': sportsId
        }, function(data) {
            if(data && data.length) {
                data = data[0];

                $('.predictedUserInfo_nick').html(data.nickname);
                $('.predictedUserInfo_rank').html(data.totalRank + '위');
                $('.predictedUserInfo_rating').html(parseInt(data.rating, 10));

                $('.predictedUserInfo_tier').removeClass('badge_ready')
                                            .removeClass('badge_bronze')
                                            .removeClass('badge_silver')
                                            .removeClass('badge_gold')
                                            .removeClass('badge_platinum')
                                            .removeClass('badge_diamond');
                if(data.readyGameCnt && data.readyGameCnt > 0) {
                    $('.predictedUserInfo_tier').addClass('badge_ready');
                    $('.predictedUserInfo_tierName').html('배치중');
                } else {
                    if(data.rating < 1200) {
                        $('.predictedUserInfo_tier').addClass('badge_bronze');
                        $('.predictedUserInfo_tierName').html('브론즈');
                    } else if(1200 <= data.rating && data.rating < 1400) {
                        $('.predictedUserInfo_tier').addClass('badge_silver');
                        $('.predictedUserInfo_tierName').html('실버');
                    } else if(1400 <= data.rating && data.rating < 1600) {
                        $('.predictedUserInfo_tier').addClass('badge_gold');
                        $('.predictedUserInfo_tierName').html('골드');
                    } else if(1600 <= data.rating && data.rating < 1800) {
                        $('.predictedUserInfo_tier').addClass('badge_platinum');
                        $('.predictedUserInfo_tierName').html('플래티넘');
                    } else if(1800 <= data.rating) {
                        $('.predictedUserInfo_tier').addClass('badge_diamond');
                        $('.predictedUserInfo_tierName').html('다이아');
                    }
                }

                var totalHit = 0;
                var totalFail = 0;
                if(data.record) {
                    if(data.record.total) {
                        if(data.record.total.hit) {
                            totalHit = data.record.total.hit;
                        }
                        if(data.record.total.fail) {
                            totalFail = data.record.total.fail;
                        }
                    }
                }
                $('.predictedUserInfo_totalRecord').html(totalHit + ' / ' + totalFail + ' (' + (totalHit + totalFail == 0 ? '-' : ((totalHit/(totalHit+totalFail))*100).toFixed(2)) + '%)');

                var leagueHit = 0;
                var leagueFail = 0;
                if(data.record) {
                    if(data.record[leagueId]) {
                        if(data.record[leagueId].hit) {
                            leagueHit = data.record[leagueId].hit;
                        }
                        if(data.record[leagueId].fail) {
                            leagueFail = data.record[leagueId].fail;
                        }
                    }
                }
                $('.predictedUserInfo_leagueRecord').html(leagueHit + ' / ' + leagueFail + ' (' + (leagueHit + leagueFail == 0 ? '-' : ((leagueHit/(leagueHit+leagueFail))*100).toFixed(2)) + '%)');

                if(data.pick == 'home') {
                    $('#predictedUserPredictResult').html('홈팀 승!');
                } else if(data.pick == 'away') {
                    $('#predictedUserPredictResult').html('어웨이팀 승!');
                } else {
                    $('#predictedUserPredictResult').html('무승부');
                }

                if(data.viewList && data.viewList.length) {
                    if(data.viewList.indexOf(myEmail) > -1) {
                        $('#viewBtnDiv').hide();
                        $('#isShownDiv').show();
                        $('#predictedUserPredictBox').show();
                    } else {
                        $('#isShownDiv').hide();
                        $('#viewBtnDiv').show();    
                    }
                } else {
                    $('#isShownDiv').hide();
                    $('#viewBtnDiv').show();
                }
            }
        });
    }
};
