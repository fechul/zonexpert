var async = require('async');

exports.get = function(params, callback) {
	var myEmail = params.myEmail;

	var _query = {};
    var _get = function(query){
        db.board.find(query).sort({boardNo: -1}).lean().exec(function(err, data) {
            data = JSON.stringify(data);
            data = JSON.parse(data);
            if(data && data.length) {
            	if(myEmail) {
            		db.user.find({
	            		'email': myEmail
	            	}, {
	            		'like_board': 1,
	            		'readyGameCnt': 1
	            	}).limit(1).exec(function(myDataErr, myData) {
	            		async.map(data, function(board, async_cb){
		                    db.user.find({
		                        'email': board.writer
		                    }, {
		                        'nickname': 1,
		                        'readyGameCnt': 1
		                    }).limit(1).exec(function(_err, userdata) {
		                        if(_err) {
		                            console.log("board get list err: ", _err);
		                        } else {
		                            if(userdata && userdata.length) {
		                                userdata = userdata[0];
		                            }
		                            board.nickname = userdata.nickname;
		                            board.readyGameCnt = userdata.readyGameCnt;
		                           
		                            if(myData && myData.length) {
		                                myData = myData[0]
		                                if(myData.like_board.indexOf(board.boardNo) > -1) {
		                                    board.i_like = true;
		                                } else {
		                                    board.i_like = false;
		                                }
		                            }
		                        }
		                        async_cb();
		                    });
		                }, function(async_err) {
		                    callback(data);
		                });
	            	});
            	} else {
            		async.map(data, function(board, async_cb){
	                    db.user.find({
	                        'email': board.writer
	                    }, {
	                        'nickname': 1,
	                        'readyGameCnt': 1
	                    }).limit(1).exec(function(_err, userdata) {
	                        if(_err) {
	                            console.log("board get list err: ", _err);
	                        } else {
	                            if(userdata && userdata.length) {
	                                userdata = userdata[0];
	                            }
	                            board.nickname = userdata.nickname;
	                            board.i_like = false;
	                            board.readyGameCnt = userdata.readyGameCnt;
	                            async_cb();
	                        }
	                    });
	                }, function(async_err) {
	                    callback(data);
	                });
            	}
            } else {
                callback(null);
            }
        });
    };

	if (params.value && params.type) {
		if (params.type == 'title') {
            _query[params.type] = {$regex : ".*" + params.value + ".*"};
            _get(_query);
		} else {
            db.user.find({
                'nickname': params.value
            },{
            	'email': 1
            }).limit(1).exec(function(err , data){
				if(data && data.length){
					_query[params.type] = data[0].email;
					_get(_query);
				} else{
					callback(null);
				}
            });

		}
	} else{
		_get(_query);
	}


};

exports.write = function(data, callback) {
	var new_write = new db.board({
		'title': data.title,
		'content': data.content,
		'writer': data.writer,
		'date': new Date(),
		'like': 0
	});

	var boardNo = 1;

	db.board.find({},{boardNo:1}).sort({boardNo:-1}).limit(1).exec(function(err, recentBoard) {
		if(recentBoard && recentBoard.length) {
			recentBoard = recentBoard[0];
			boardNo = recentBoard.boardNo + 1;
		}
		
		new_write.boardNo = boardNo;

		new_write.save(function(err) {
			if(err) {
				console.log("board write db save err: ", err);
				callback(false);
			} else {
				callback(true);
			}
		});
	});
};

exports.del = function(data, callback) {
	var boardNo = data.boardNo;
	boardNo = parseInt(boardNo);

	db.board.find({
		'boardNo': boardNo
	}, {
		'writer': 1
	}).limit(1).exec(function(err, board_data) {
		if(board_data && board_data.length) {
			board_data = board_data[0];
			if(data.user_email !== board_data.writer) {
				callback(false);
			} else {
				db.board.remove({
					'boardNo': boardNo
				}, function(_err) {
					if(_err) {
						callback(false);
					} else {
						callback(true);
					}
				});
			}
		} else {
			callback(false);
		}
	});
};

exports.update = function(data, callback) {
	var boardNo = data.boardNo;

	db.board.find({
		'boardNo': boardNo
	}, {
		'writer': 1
	}).limit(1).exec(function(err, board_data) {
		if(board_data && board_data.length) {
			board_data = board_data[0];

			if(data.user == board_data.writer) {
				db.board.update({
					'boardNo': boardNo
				}, {
					$set: {
						'title': data.title,
						'content': data.content,
						'date': new Date()
					}
				}, function(update_err) {
					if(update_err) {
						console.log("board update db err: ", update_err);
						callback(false);
					} else {
						callback(true);
					}
				});
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
};

exports.like = function(data, callback) {
	var boardNo = data.boardNo;
	boardNo = parseInt(boardNo);

	db.user.find({
		'email': data.user_email
	}, {
		'like_board': 1
	}).limit(1).exec(function(err, userdata) {
		if(err) {
			callback(false);
		} else {
			if(userdata && userdata.length) {
				userdata = userdata[0];

				var likeboard = userdata.like_board;
				var target = likeboard.indexOf(boardNo);
				if(target > -1) {
					likeboard.splice(target, 1);
					db.user.update({
						'email': data.user_email
					}, {
						$set: {
							'like_board': likeboard
						}
					}, function(user_err, user_update_res) {
						db.board.update({
							'boardNo': boardNo
						}, {
							$inc: {
								'like': -1
							}
						}, function(board_err, board_update_res) {
							if(board_update_res) {
								callback('unlike');
							} else{
								callback(false);
							}
						});
					});


				} else {
					db.user.update({
						'email': data.user_email
					}, {
						$addToSet: {
							'like_board': boardNo
						}
					}, function(user_err, user_update_res) {
						db.board.update({
							'boardNo': boardNo
						}, {
							$inc: {
								'like': 1
							}
						}, function(board_err, board_update_res) {
							if(board_update_res) {
								callback('like');
							} else{
								callback(false);
							}
						});
					});
				}
			} else {
				callback(false);
			}
		}
	});
};


exports.get_content = function(boardNo, callback) {
	db.board.find({
		'boardNo': boardNo
	}, {
		'writer': 1,
		'title': 1,
		'content': 1
	}, function(err, data) {
		if(data && data.length) {
			data = data[0];
			callback(data);
		} else {
			callback(null);
		}
	});
};


