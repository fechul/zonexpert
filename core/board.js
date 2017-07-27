var async = require('async');
var user = require('./user.js');

exports.get = function(params, callback) {
	var myEmail = params.myEmail;
	var boardNo = params.boardNo;

	db.board.find({
		'boardNo': boardNo
	}).limit(1).lean().exec(function(err, boardData) {
		if(boardData && boardData.length) {
			boardData = boardData[0];

			if(myEmail) {
        		db.user.find({
            		'email': myEmail
            	}, {
            		'like_board': 1,
            		'readyGameCnt': 1
            	}).limit(1).exec(function(myDataErr, myData) {
            		if(myData && myData.length) {
            			myData = myData[0];
            		}

            		db.comment.find({
        				'boardNo': boardNo
        			}).sort({commentNo:1}).lean().exec(function(_err, _data) {
        				boardData.comments = _data;

        				db.user.find({
	                        'email': boardData.writer
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
	                            boardData.nickname = userdata.nickname;
	                            boardData.readyGameCnt = userdata.readyGameCnt;
	                           
	                            if(myData) {
	                                if(myData.like_board.indexOf(boardNo) > -1) {
	                                    boardData.i_like = true;
	                                } else {
	                                    boardData.i_like = false;
	                                }
	                            }
	                        }
	                        callback(boardData);
	                    });
        			});
            	});
        	} else {
        		db.comment.find({
    				'boardNo': boardNo
    			}).sort({commentNo:1}).lean().exec(function(_err, _data) {
    				boardData.comments = _data;
    				db.user.find({
                        'email': boardData.writer
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
                            boardData.nickname = userdata.nickname;
                            boardData.i_like = false;
                            boardData.readyGameCnt = userdata.readyGameCnt;
                        }
                        callback(boardData);
                    });
    			});
        	}
		} else {
			callback(null);
		}
	});
};

exports.getList = function(params, callback) {
	var _get = function(query) {
		db.board.find(query, {
			'boardNo': 1,
		    'writer' : 1,
		    'date' : 1,
		    'title': 1,
		    'like': 1
		}).sort({boardNo: -1}).lean().exec(function(err, data) {
			async.map(data, function(board, async_cb) {
				db.user.find({
                    'email': board.writer
                }, {
                    'nickname': 1,
                    'readyGameCnt': 1
                }).limit(1).exec(function(_err, userdata) {
                    if(_err) {
                        console.log("board getList err: ", _err);
                    } else {
                        if(userdata && userdata.length) {
                            userdata = userdata[0];
                        }
                        board.nickname = userdata.nickname;
                        board.readyGameCnt = userdata.readyGameCnt;

                        db.comment.count({
                        	'boardNo': board.boardNo
                        }, function(__err, length) {
                        	board.commentsCnt = length;
                        	async_cb();
                        });
                    }
                });
			}, function(async_err) {
				callback(data);
			});
		});
	};

	var _query = {};
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

exports.comment = function(options, callback) {
	var boardNo = options.boardNo;
	var content = options.content;
	var writer = options.writer;
	var commentNo = 1;

	if(!content || !content.length) {
		callback({
			result: false,
			code: 11
		});
	} else {
		db.comment.find({
			'boardNo': boardNo
		}).sort({'commentNo': -1}).limit(1).exec(function(err, data) {
			if(data && data.length) {
				commentNo = data[0].commentNo + 1;
			}

			var new_comment = new db.comment({
				'boardNo': boardNo,
				'content': content,
				'writer': writer,
				'date': new Date(),
				'commentNo': commentNo
			});

			new_comment.save(function(_err) {
				if(err) {
					console.log("comment write db save err: ", _err);
					callback({
						result: false,
						code: 1
					});
				} else {
					callback({
						result: true
					});
				}
			});
		});
	}
};

exports.check = function(options, callback) {
	var boardNo = options.boardNo;

	db.board.find({
		'boardNo': boardNo
	}).limit(1).lean().exec(function(err, data) {
		if(data && data.length) {
			callback(true);
		} else {
			callback(false);
		}
	});
};

exports.getComments = function(options, callback) {
	var boardNo = options.boardNo;

	db.comment.find({
		'boardNo': boardNo
	}).sort({commentNo: -1}).exec(function(err, comments) {
		if(comments && comments.length) {
			comments = JSON.stringify(comments);
			comments = JSON.parse(comments);
			async.mapSeries(comments, function(comment, async_cb) {
				db.user.find({
					'email': comment.writer
				}, {
					'nickname': 1,
					'readyGameCnt': 1
				}).limit(1).lean().exec(function(userErr, userData) {
					comment.writerNick = userData[0].nickname;
					var key = 'rating_rank';
					user.countAllUsers('onlyRanked', function(userCount) {
						redis_client.zrevrank(key, comment.writer, function(err, rankData) {
							if(!err) {
								var myTotalRate = (((rankData+1) / userCount)*100).toFixed(2);
								comment.writerTier = '';

								if(userData[0].readyGameCnt && userData[0].readyGameCnt > 0) {
									comment.writerTier = 'badge_ready';
								} else {
									if(myTotalRate <= 3) {
										comment.writerTier = 'badge_diamond';
									} else if(3 < myTotalRate && myTotalRate <= 10) {
										comment.writerTier = 'badge_platinum';
									} else if(10 < myTotalRate && myTotalRate <= 30) {
										comment.writerTier = 'badge_gold';
									} else if(30 < myTotalRate && myTotalRate <= 70) {
										comment.writerTier = 'badge_silver';
									} else if(70 < myTotalRate) {
										comment.writerTier = 'badge_bronze';
									}
								}
							}
							async_cb();
						});
					});
				});
			}, function(async_err) {
				callback(comments);
			});
		} else {
			callback(comments);
		}
	});
};


