var CHAT = {
    init: function(options) {
        this.name = options.nickname;
        this.room = options.roomId;
        this.badge = options.myBadge;
        this.sportsId = options.sportsId;
        this.leagueId = options.leagueId;
        this.email = options.email;
        this.viewTargetNick = options.viewTargetNick || null;

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
                $('.right-tabs').show();
                $(this).html('채팅하기');
            } else {
                $('.right-tabs').hide();
                $('.window-area').show();
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
            var $this = $(this);
            GET_POINT(function(user) {
                var costPoint = parseInt($('.viewCostPoint').html(), 10);
                if (user.point >= costPoint) {
                    var target = $('.eachPredictedUser.active').attr('target');
                    var pointType = $this.attr('pointType');

                    $.post('/prediction/viewOthers', {
                        matchId: self.room,
                        pointType: pointType,
                        targetNickname: target
                    }, function(result) {
                        if(result) {
                            if(result.result && result.result !== 'false') {
                                if(result.pick == 'home') {
                                    $('#predictedUserPredictResult').html('홈팀 승!');
                                } else if(result.pick == 'away') {
                                    $('#predictedUserPredictResult').html('어웨이팀 승!');
                                } else if(result.pick == 'draw') {
                                    $('#predictedUserPredictResult').html('무승부');
                                } else {
                                    $('#predictedUserPredictResult').html('-');
                                }
                                $('#viewBtnDiv').hide();
                                $('#isShownDiv').show();
                                $('#predictedUserPredictBox').fadeIn(2000);
                                UPDATE_POINT();
                            } else {
                                notice.show('alert', '조회에 실패했습니다.');
                            }
                        } else {
                            notice.show('alert', '조회에 실패했습니다.');
                        }
                    });
                } else {
                    notice.show('alert', '포인트가 부족합니다.');
                }
            });
        });

        $('#viewPredictionSystem').click(function() {
            GET_POINT(function(user) {
                var costPoint = 500;
                if ((user.freePoint >= costPoint) || (user.point >= costPoint)) {
                    $('#viewPredictionSystem').hide();
                    $('.systemChoicePointTypeBtn').show();
                    $('.systemCurrentPoint.free').html(user.freePoint);
                    $('.systemCurrentPoint.currency').html(user.point);
                } else {
                    notice.show('alert', '포인트가 부족합니다.');
                }
            });
        });

        // $('.choicePointTypeBtn').click(function() {
        //     var target = $('.eachPredictedUser.active').attr('target');
        //     var pointType = $(this).attr('pointType');
        //
        //     $.post('/prediction/viewOthers', {
        //         matchId: self.room,
        //         pointType: pointType
        //     }, function(result) {
        //         if(result) {
        //             if(result.result && result.result !== 'false') {
        //                 if(result.pick == 'home') {
        //                     $('#predictedUserPredictResult').html('홈팀 승!');
        //                 } else if(result.pick == 'away') {
        //                     $('#predictedUserPredictResult').html('어웨이팀 승!');
        //                 } else if(result.pick == 'draw') {
        //                     $('#predictedUserPredictResult').html('무승부');
        //                 } else {
        //                     $('#predictedUserPredictResult').html('-');
        //                 }
        //                 $('#viewBtnDiv').hide();
        //                 $('#isShownDiv').show();
        //                 $('#predictedUserPredictBox').fadeIn(2000);
        //                 UPDATE_POINT();
        //             } else {
        //                 notice.show('alert', '조회에 실패했습니다.');
        //             }
        //         } else {
        //             notice.show('alert', '조회에 실패했습니다.');
        //         }
        //     });
        // });

        $('.systemChoicePointTypeBtn').click(function() {
            var pointType = $(this).attr('pointType');

            $.post('/prediction/system', {
                matchId: self.room,
                pointType: pointType
            }, function(result) {
                console.log(result);
                // if(result) {
                //     if(result.result && result.result !== 'false') {
                //         if(result.pick == 'home') {
                //             $('#predictedUserPredictResult').html('홈팀 승!');
                //         } else if(result.pick == 'away') {
                //             $('#predictedUserPredictResult').html('어웨이팀 승!');
                //         } else if(result.pick == 'draw') {
                //             $('#predictedUserPredictResult').html('무승부');
                //         } else {
                //             $('#predictedUserPredictResult').html('-');
                //         }
                //         $('#viewBtnDiv').hide();
                //         $('#isShownDiv').show();
                //         $('#predictedUserPredictBox').fadeIn(2000);
                //         UPDATE_POINT();
                //     } else {
                //         notice.show('alert', '조회에 실패했습니다.');
                //     }
                // } else {
                //     notice.show('alert', '조회에 실패했습니다.');
                // }
            });
        });

        $(document).on('click', '.predict_in_chat:not(.confirmed)', function() {
            var $this = $(this);
            var toggle = false;

            if ($this.hasClass('basketed')) {
                toggle = true;
            }

            var matchId = self.room;
            var leagueId = self.leagueId;

            $.ajax({
                'url': '/prediction/basket',
                'type': toggle ? 'DELETE' : 'POST',
                'data': {
                    'matchId': matchId,
                    'leagueId': leagueId
                },
                'dataType': 'json',
                'success': function(result) {
                    if (result) {
                        if ($this.hasClass('basketed')) {
                            $this.removeClass('basketed');
                        } else {
                            $this.addClass('basketed');
                        }

                        PREDICTION_SHORTCUT.setData();
                        $('.prediction_shortcut_button_container').eq(0).animate({right: '+=3px'}, 40)
                                                                        .animate({right: '-=6px'}, 40)
                                                                        .animate({right: '+=6px'}, 40)
                                                                        .animate({right: '-=6px'}, 40)
                                                                        .animate({right: '+=6px'}, 40)
                                                                        .animate({right: '-=3px'}, 40);
                    } else {
                        console.log('err');
                    }

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

            if (matchData.status == 'IN_PLAY') {
                $('#chatMatchStatus').html('<span class="status_live">LIVE</span>');
            } else if (matchData.status == 'FINISHED') {
                $('#chatMatchStatus').html('종료');
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
        var viewTargetNick = this.viewTargetNick;
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
                if(viewTargetNick) {
                    $('.tab_container .goToOtherPredictLi').click();
                    var predictList = $('.eachPredictedUser');
                    $.each(predictList, function(idx) {
                        if($(predictList[idx]).attr('target') == viewTargetNick) {
                            predictList[idx].click();
                        }
                    });
                }
            } else {
                predictedUserList.append('<p class="noPredictedUser" style="border-bottom:0px;">예측한 사용자가 없습니다.</p>');
            }
        });
    },

    setUserPredictData: function(target) {
        var sportsId = this.sportsId;
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

                $('.viewCostPoint').html(data.costPoint);

                $('.predictedUserInfo_nick').html(data.nickname);
                $('.predictedUserInfo_rank').html(data.totalRank + '위');
                $('.predictedUserInfo_rating').html(parseInt(data.rating, 10));

                $('.predictedUserInfo_tier').removeClass('badge_ready')
                                            .removeClass('badge_bronze')
                                            .removeClass('badge_silver')
                                            .removeClass('badge_gold')
                                            .removeClass('badge_platinum')
                                            .removeClass('badge_diamond');

                if (data.readyGameCnt && data.readyGameCnt > 0) {
                    $('.predictedUserInfo_tier').addClass('badge_ready');
                    $('.predictedUserInfo_tierName').html('배치중');
                } else {
                    $('.predictedUserInfo_tier').addClass(data.tierClassName);
                    $('.predictedUserInfo_tierName').html(data.tierName);
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

                if(data.record && data.record[sportsId]) {
                    if(data.record[sportsId][leagueId]) {
                        if(data.record[sportsId][leagueId].hit) {
                            leagueHit = data.record[sportsId][leagueId].hit;
                        }
                        if(data.record[sportsId][leagueId].fail) {
                            leagueFail = data.record[sportsId][leagueId].fail;
                        }
                    }
                }
                $('.predictedUserInfo_leagueRecord').html(leagueHit + ' / ' + leagueFail + ' (' + (leagueHit + leagueFail == 0 ? '-' : ((leagueHit/(leagueHit+leagueFail))*100).toFixed(2)) + '%)');

                var pick = data.pick;

                if(pick) {
                    if(pick == 'home') {
                        $('#predictedUserPredictResult').html('홈팀 승!');
                    } else if(pick == 'away') {
                        $('#predictedUserPredictResult').html('어웨이팀 승!');
                    } else if(pick == 'draw') {
                        $('#predictedUserPredictResult').html('무승부');
                    } else {
                        $('#predictedUserPredictResult').html('-');
                    }

                    $('#viewBtnDiv').hide();
                    $('#isShownDiv').show();
                    $('#predictedUserPredictBox').show();
                } else {
                    $('#isShownDiv').hide();
                    $('#viewBtnDiv').show();
                }
                $('.userPredictData').show();
            }
        });
    },

    setPredictButtonCondition: function(result, predictions) {
        for (i = 0; i < predictions.length; i++) {
            if (predictions[i].matchId == this.room) {
                if (result) {
                    $('.predict_in_chat.basketed').removeClass('basketed').addClass('confirmed');
                }

                break;
            }
        }
    }
};
