var async = require('async');

exports.get = function(user_email, callback) {
	db.board.find({}).sort({boardNo: -1}).lean().exec(function(err, data) {
		data = JSON.stringify(data);
		data = JSON.parse(data);
		if(data && data.length) {
			async.map(data, function(board, async_cb){ 
				db.user.find({
					'email': board.writer
				}, {
					'nickname': 1,
					'tier_code': 1
				}).limit(1).exec(function(_err, userdata) {
					if(_err) {
						console.log("board get list err: ", _err);
					} else {
						if(userdata && userdata.length) {
							userdata = userdata[0];
						}
						board.nickname = userdata.nickname;
						board.tier_code = userdata.tier_code;
						
						db.user.find({
							'email': user_email
						}, {
							'like_board': 1
						}).limit(1).exec(function(myerr, mydata) {
							if(mydata && mydata.length) {
								mydata = mydata[0]
								if(mydata.like_board.indexOf(board.boardNo) > -1) {
									board.i_like = true;
								} else {
									board.i_like = false;
								}
							}
							async_cb();
						});
					}
				});
			}, function(async_err) {
				callback(data);
			});
		} else {
			callback(null);
		}
	});
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

