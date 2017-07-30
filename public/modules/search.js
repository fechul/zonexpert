var SEARCH = {
	init: function(options) {
		var self = this;

		this.search_id = options.search_id;
		this.isReady = options.isReady;
		this.search_rating = parseInt(options.search_rating, 10);
		this.myNickName = options.myNickName;
		this.targetStatistics_sport = [];
		this.targetStatistics_league = [];
		this.targetStatistics_club = [];

		this.recentRates = [];
		this.recentMatches = [];

		$('.my_recent_predict_wrapper').hide();

		notice.init();

		if(options.attendancePointUpdated) {
			notice.show('success', '100점의 출석 포인트가 적립되었습니다.');
		}

		this.init_events();
		this.getMatchesStatistics('sport', function() {
			self.setStatisticsField('sport');
			self.getMatchesRecord(function() {
				self.setRecordField();
			});
		});
		this.setProceedingPredict();
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

		$('.my_record_data_section .nav-tabs > li > a').click(function() {
			if($(this).parent('li').hasClass('tab_statistics')) {
				$('.my_recent_predict_wrapper').hide();
				$('.my_statistics_data_wrapper').show();
			} else {
				$('.my_statistics_data_wrapper').hide();
				$('.my_recent_predict_wrapper').show();
			}
		});

		$('#statistics_field .record_menus > button').click(function() {
			if($(this).hasClass('active')) {
				return false;
			}

			$(this).parent('.record_menus').find('button.active').removeClass('active');
			$(this).addClass('active');

			var value = $(this).attr('value');
			if(value == 'sport') {
				$('.statistics_table_type_name').html('스포츠');
				self.getMatchesStatistics('sport', function() {
					self.setStatisticsField('sport');
				});
			} else if(value == 'league') {
				$('.statistics_table_type_name').html('리그');
				self.getMatchesStatistics('league', function() {
					self.setStatisticsField('league');
				});
			} else {
				$('.statistics_table_type_name').html('팀');
				self.getMatchesStatistics('club', function() {
					self.setStatisticsField('club');
				});
			}
		});

		$(document).on('click', '.goToPredict', function() {
			if($(this).hasClass('ismine')) {
				return false;
			}
			var matchId = $(this).closest('tr').attr('matchId');
			var id = self.search_id;

			location.href = '/match/' + matchId + '?viewTargetNick=' + id;
		});
	},

	//chart
	setRecordField: function() {
		var self = this;

		var recentMatches = this.recentMatches;
		var isReady = this.isReady;
		var list_html = '';

		if(recentMatches && recentMatches.length) {
			for(var i = 0; i < recentMatches.length; i++) {

				var afterRating = parseInt(recentMatches[i].afterRating, 10);
				var beforeRating = parseInt(recentMatches[i].beforeRating, 10);
				var ratingChange = parseInt(afterRating - beforeRating, 10);
				var ratingChangeType = 'failed';
				if(ratingChange > 0) {
					ratingChange = '+' + ratingChange;
					ratingChangeType = 'success';
				}

				list_html += '<div class="recent_predict_data_row ' + (ratingChangeType == 'failed' ? 'borderFailed' : 'borderSuccess') + '">';

				var date = new Date(recentMatches[i].ratingCalculatedTime);
				var year = date.getFullYear()%100;
				var month = (date.getMonth()+1 < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1));
				var day = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());

				list_html += '<div class="recent_predict_data_row_date">' + year + '/' + month + '/' + day + '</div>';
				list_html += '<div class="recent_predict_data_row_homename">' + recentMatches[i].homeTeamName + '</div>';
				list_html += '<img src="' + recentMatches[i].homeTeamImg + '"></img>';
				list_html += '<div class="recent_predict_data_row_goals">' + recentMatches[i].homeTeamGoals + ' : ' + recentMatches[i].awayTeamGoals + '</div>';
				list_html += '<img src="' + recentMatches[i].awayTeamImg + '"></img>';
				list_html += '<div class="recent_predict_data_row_awayname">' + recentMatches[i].awayTeamName + '</div>';

				if(!isReady) {
					list_html += '<div class="recent_predict_data_row_rating">' + afterRating + '(<span class="' + ratingChangeType + '">' + ratingChange + '</span>)</div>';
				}

				if(recentMatches[i].myPredict == 'true') {
					list_html += '<div class="recent_predict_data_row_result_msg success">적중</div>';
				} else {
					list_html += '<div class="recent_predict_data_row_result_msg failed">실패</div>';
				}

				list_html += '</div>';
			}
			$('.my_recent_predict_section').append(list_html);
		}

		if(!isReady) {
			$('.noChart').hide();
			var ctx = $("#myChart");
			ctx.attr('height', 150);

			var labels = this.getDateList();
			var datelist = [];
			var ratelist = [];

			$.get('/prediction/getChartRates', {
				'date': labels,
				'search_id': self.search_id
			}, function(chartRates) {
				if(chartRates && chartRates.length) {
					ratelist = chartRates;
				} else {
					for(var n = 0; n < labels.length; n++) {
						ratelist.push(self.search_rating);
					}
				}

				var data = {
				    labels: datelist,
				    datasets: [
				        {
				            label: "레이팅",
				            fill: false,
				            lineTension: 0.0,
				            borderColor: "rgba(75,192,192,1)",
				            pointBackgroundColor: "#fff",
				            data: ratelist,
				            spanGaps: false
				        }
				    ]
				};

				var options = {
			        scales: {
			            yAxes: [{
			                ticks: {
			                    beginAtZero: false
			                }
			            }]
			        }
			    };

				var myChart = new Chart(ctx, {
				    type: 'line',
				    data: data,
				    options: options
				});
			});

			// if(recentMatches && recentMatches.length) {
			// 	beforeRating = null;
			// 	for(var d = labels.length-1; d >= 0 ; d--) {
			// 		datelist[d] = (labels[d].month + '/' + labels[d].day);
			// 		var found = false;
			// 		var lastRatingOnTheDay = null;
			// 		var lastRatingDay = null;

			// 		for(var r = 0; r < recentMatches.length; r++) {
			// 			var matchDate = new Date(recentMatches[r].ratingCalculatedTime);
			// 			if((matchDate.getMonth()+1) == labels[d].month && matchDate.getDate() == labels[d].day) {
			// 				if(!lastRatingOnTheDay) {
			// 					lastRatingOnTheDay = parseInt(recentMatches[r].afterRating, 10);
			// 					lastRatingDay = recentMatches[r].ratingCalculatedTime;
			// 					ratelist[d] = lastRatingOnTheDay;
			// 					beforeRating = recentMatches[r].beforeRating;
			// 					found = true;
			// 				} else {
			// 					if(recentMatches[r].ratingCalculatedTime > lastRatingDay) {
			// 						lastRatingOnTheDay = parseInt(recentMatches[r].afterRating, 10);
			// 						lastRatingDay = recentMatches[r].ratingCalculatedTime;
			// 						ratelist[d] = lastRatingOnTheDay;
			// 						beforeRating = recentMatches[r].beforeRating;
			// 						found = true;
			// 					}
			// 				}
			// 			}
			// 		}

			// 		if(!found && d == labels.length-1) {
			// 			ratelist[d] = self.search_rating;
			// 		} else if(!found) {
			// 			ratelist[d] = parseInt(beforeRating) || self.search_rating;
			// 		}
			// 	}
			// } else {
			// 	for(var d = labels.length-1; d >= 0 ; d--) {
			// 		ratelist.push(self.search_rating);
			// 	}
			// }

			// var data = {
			//     labels: datelist,
			//     datasets: [
			//         {
			//             label: "레이팅",
			//             fill: false,
			//             lineTension: 0.0,
			//             borderColor: "rgba(75,192,192,1)",
			//             pointBackgroundColor: "#fff",
			//             data: ratelist,
			//             spanGaps: false
			//         }
			//     ]
			// };

			// var options = {
		 //        scales: {
		 //            yAxes: [{
		 //                ticks: {
		 //                    beginAtZero: false
		 //                }
		 //            }]
		 //        }
		 //    };

			// var myChart = new Chart(ctx, {
			//     type: 'line',
			//     data: data,
			//     options: options
			// });
		} else {
			$('#myChart').hide();
			$('.noChart').show();
		}
	},

	//pie
	setStatisticsField: function(type) {
		var statisticsData = [];
		if(type == 'sport') {
			statisticsData = this.targetStatistics_sport;
		} else if(type == 'league') {
			statisticsData = this.targetStatistics_league;
		} else {
			statisticsData = this.targetStatistics_club;
		}

		$('#pie_record').empty();
		$('.statistics_row_data').remove();

		if(statisticsData && statisticsData.length) {
			$('.no_statistics_field').hide();
			var pieCnt = 0;
			var table_html = '';

			if(type == 'sport') {
				for(var i = 0; i < statisticsData.length; i++) {
					var sportsId = statisticsData[i].sportsId;
					var sportsName = statisticsData[i].sportsName;
					var sportsHit = statisticsData[i].sportsHit;
					var sportsFail = statisticsData[i].sportsFail;
					var sportsGameCnt = statisticsData[i].sportsGameCnt;
					var sportsRate = Math.floor(statisticsData[i].sportsRate);
					sportsRate = isNaN(sportsRate) ? '-' : sportsRate;

					if(pieCnt < 4) {
						var html = '<div class="pie_field"><canvas width="200" height="200" style="width:150px; height:150px" id="' + sportsId + '_pie"></canvas><label class="pieLeagueName">(' + sportsName + ')</label><label class="piePercentage">' + sportsRate + '%</label></div>';
						$('#pie_record').append(html);

						var data = {
						    labels: [
						        "적중",
						        "실패"
						    ],
						    datasets: [{
					            data: [sportsHit, sportsFail],
					            backgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ],
					            hoverBackgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ]
					        }]
						};

						var options = {
							legend: {
								onClick: function(){}
							}
					    };

						var myDoughnutChart = new Chart($('#' + sportsId + '_pie'), {
						    type: 'doughnut',
						    data: data,
						    options: options
						});
					}

					pieCnt++;

					table_html += '<tr class="statistics_row_data">';
					table_html += '<td>' + (i+1) + '</td>';
					table_html += '<td>' + sportsName + '</td>';
					table_html += '<td>' + sportsHit + '</td>';
					table_html += '<td>' + sportsFail + '</td>';
					table_html += '<td>' + sportsGameCnt + '</td>';
					table_html += '<td>' + sportsRate + '%</td>';
					table_html += '</tr>';
				}
			} else if(type == 'league') {
				for(var i = 0; i < statisticsData.length; i++) {
					var leagueId = statisticsData[i].leagueId;
					var leagueName = statisticsData[i].leagueName;
					var leagueHit = statisticsData[i].leagueHit;
					var leagueFail = statisticsData[i].leagueFail;
					var leagueGameCnt = statisticsData[i].leagueGameCnt;
					var leagueRate = Math.floor(statisticsData[i].leagueRate);
					leagueRate = isNaN(leagueRate) ? '-' : leagueRate;

					if(pieCnt < 4) {
						var html = '<div class="pie_field"><canvas width="200" height="200" style="width:150px; height:150px" id="' + leagueId + '_pie"></canvas><label class="pieLeagueName">(' + leagueName + ')</label><label class="piePercentage">' + leagueRate + '%</label></div>';
						$('#pie_record').append(html);

						var data = {
						    labels: [
						        "적중",
						        "실패"
						    ],
						    datasets: [{
					            data: [leagueHit, leagueFail],
					            backgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ],
					            hoverBackgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ]
					        }]
						};

						var options = {
							legend: {
								onClick: function(){}
							}
					    };

						var myDoughnutChart = new Chart($('#' + leagueId + '_pie'), {
						    type: 'doughnut',
						    data: data,
						    options: options
						});
					}

					pieCnt++;

					table_html += '<tr class="statistics_row_data">';
					table_html += '<td>' + (i+1) + '</td>';
					table_html += '<td>' + leagueName + '</td>';
					table_html += '<td>' + leagueHit + '</td>';
					table_html += '<td>' + leagueFail + '</td>';
					table_html += '<td>' + leagueGameCnt + '</td>';
					table_html += '<td>' + leagueRate + '%</td>';
					table_html += '</tr>';
				}
			} else {	//club
				for(var i = 0; i < statisticsData.length; i++) {
					var teamId = statisticsData[i].teamId;
					var teamName = statisticsData[i].teamName;
					var teamHit = statisticsData[i].teamHit;
					var teamFail = statisticsData[i].teamFail;
					var teamGameCnt = statisticsData[i].teamGameCnt;
					var teamRate = Math.floor(statisticsData[i].teamRate);
					teamRate = isNaN(teamRate) ? '-' : teamRate;

					if(pieCnt < 4) {
						var html = '<div class="pie_field"><canvas width="200" height="200" style="width:150px; height:150px" id="' + teamId + '_pie"></canvas><label class="pieLeagueName">(' + teamName + ')</label><label class="piePercentage">' + teamRate + '%</label></div>';
						$('#pie_record').append(html);

						var data = {
						    labels: [
						        "적중",
						        "실패"
						    ],
						    datasets: [{
					            data: [teamHit, teamFail],
					            backgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ],
					            hoverBackgroundColor: [
					                "#36A2EB",
					                "#e82335"
					            ]
					        }]
						};

						var options = {
							legend: {
								onClick: function(){}
							}
					    };

						var myDoughnutChart = new Chart($('#' + teamId + '_pie'), {
						    type: 'doughnut',
						    data: data,
						    options: options
						});
					}

					pieCnt++;

					table_html += '<tr class="statistics_row_data">';
					table_html += '<td>' + (i+1) + '</td>';
					table_html += '<td>' + teamName + '</td>';
					table_html += '<td>' + teamHit + '</td>';
					table_html += '<td>' + teamFail + '</td>';
					table_html += '<td>' + teamGameCnt + '</td>';
					table_html += '<td>' + teamRate + '%</td>';
					table_html += '</tr>';
				}
			}

			$('#statistics_table').append(table_html);

		} else {
			$('.no_statistics_field').show();
		}
	},

	getMatchesStatistics: function(type, callback) {
		var self = this;

		var alreadyHas = false;
		if(type == 'sport') {
			if(self.targetStatistics_sport && self.targetStatistics_sport.length) {
				alreadyHas = true;
			}
		} else if(type == 'league') {
			if(self.targetStatistics_league && self.targetStatistics_league.length) {
				alreadyHas = true;
			}
		} else {
			if(self.targetStatistics_club && self.targetStatistics_club.length) {
				alreadyHas = true;
			}
		}

		if(alreadyHas) {
			callback();
		} else {
			$.get('/prediction/getMatchesStatistics', {
				'search_id': self.search_id,
				'type': type	//league, club
			}, function(statisticsData) {
				if(statisticsData) {
					if(type == 'sport') {
						for(var key in statisticsData) {
							self.targetStatistics_sport.push({
								sportsId: statisticsData[key].sportsId,
								sportsName: self.getsportsName(statisticsData[key].sportsId),
								sportsHit: parseInt(statisticsData[key].hit, 10),
								sportsFail: parseInt(statisticsData[key].fail, 10),
								sportsGameCnt: parseInt(statisticsData[key].game_cnt, 10),
								sportsRate: parseFloat(statisticsData[key].rate)
							});
							self.sortStatisticsData(type, 'sportsGameCnt');
						}
					} else if(type == 'league') {
						for(var key in statisticsData) {
							self.targetStatistics_league.push({
								leagueId: statisticsData[key].leagueId,
								leagueName: self.getLeagueName(statisticsData[key].leagueId),
								leagueHit: parseInt(statisticsData[key].hit, 10),
								leagueFail: parseInt(statisticsData[key].fail, 10),
								leagueGameCnt: parseInt(statisticsData[key].game_cnt, 10),
								leagueRate: parseFloat(statisticsData[key].rate)
							});
							self.sortStatisticsData(type, 'leagueGameCnt');
						}
					} else {	//club
						for(var key in statisticsData) {
							self.targetStatistics_club.push({
								teamId: statisticsData[key].teamId,
								teamName: statisticsData[key].teamName,
								teamHit: parseInt(statisticsData[key].hit, 10),
								teamFail: parseInt(statisticsData[key].fail, 10),
								teamGameCnt: parseInt(statisticsData[key].game_cnt, 10),
								teamRate: parseFloat(statisticsData[key].rate)
							});
							self.sortStatisticsData(type, 'teamGameCnt');
						}
					}
				}
				callback();
			});
		}
	},

	getMatchesRecord: function(callback) {
		var self = this;

		$.get('/prediction/getMatchesRecord', {
			'search_id': self.search_id
		}, function(recordData) {
			if(recordData && recordData.length) {
				$('.no_record_field').hide();
				recordData.sort(function(a, b) {
					return (a.ratingCalculatedTime > b.ratingCalculatedTime) ? -1 : ((b.ratingCalculatedTime > a.ratingCalculatedTime) ? 1 : 0);
				});
			}

			self.recentMatches = recordData;
			callback();
		});
	},

	setProceedingPredict: function() {
		var self = this;

		$.get('/prediction/getProceedingPredict', {
			'search_id': self.search_id
		}, function(proceeding) {

			var isMine = (self.search_id == self.myNickName) ? 'ismine' : '';

			if(proceeding && proceeding.length) {
				var proceedingHtml = '';
				$('#my_prediction_list_table .noProceeding').hide();
				for(var i = 0; i < proceeding.length; i++) {
					var date = self.getDateString(proceeding[i].date);
					var homename = proceeding[i].homeTeamName;
					var homeimg = proceeding[i].homeTeamImg;
					var awayname = proceeding[i].awayTeamName;
					var awayimg = proceeding[i].awayTeamImg;
					var matchId = proceeding[i].matchId;

					proceedingHtml += '<tr matchId="' + matchId + '">';
					proceedingHtml += '<td>' + date + '</td>';
					proceedingHtml += '<td><img src="' + homeimg + '"></img>' + homename + '</td>';
					proceedingHtml += '<td>VS</td>';
					proceedingHtml += '<td><img src="' + awayimg + '"></img>' + awayname + '</td>';
					proceedingHtml += '<td class="goToPredict ' + isMine + '"><i class="fa fa-arrow-right"></i></td>';
					proceedingHtml += '</tr>';
				}
				$('#my_prediction_list_table').append(proceedingHtml);
			} else {
				$('#my_prediction_list_table .noProceeding').show();
			}
		});
	},

	getDateList: function() {
		var now = new Date();
		var year = now.getFullYear();
		var month = now.getMonth() + 1;
		var date = now.getDate();

		var datelist = [];

		if(date > 9) {
			var start = date-9;
			for(var i = start; i < date+1; i++) {
				datelist.push({
					year: year,
					month: month,
					day: i
				});
			}
		} else {
			if(month == 1) {
				month = 12;
			} else {
				month--;
			}

			if(month == 12) {
				var start = (31 - (10-date) + 1);
				for(var i = start; i < 32; i++) {
					datelist.push({
						year: year,
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						year: year+1,
						month: 1,
						day: i
					});
				}
			} else if([1,3,5,7,8,10].indexOf(month) > -1) {
				var start = (31 - (10-date) + 1);
				for(var i = start; i < 32; i++) {
					datelist.push({
						year: year,
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						year: year,
						month: month+1,
						day: i
					});
				}
			} else if([4,6,9,11].indexOf(month) > -1) {
				var start = (30 - (10-date) + 1);
				for(var i = start; i < 31; i++) {
					datelist.push({
						year: year,
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						year: year,
						month: month+1,
						day: i
					});
				}
			} else {
				var febDate = 28;
				if(year % 4 == 0) {
					febDate = 29;
					if(year % 100 == 0) {
						febDate = 28;
					}

					if(year % 400 == 0) {
						febDate = 29;
					}
				}

				var start = (febDate - (10-date) + 1);
				for(var i = start; i < (febDate+1); i++) {
					datelist.push({
						year: year,
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						year: year,
						month: month+1,
						day: i
					});
				}
			}
		}

		return datelist;
	},

	getLeagueName: function(code) {
		code = (code || '').toString();

		switch(code) {
			case '426':
				return '프리미어리그';
				break;
			case '429':
				return '잉글랜드FA컵';
				break;
			case '430':
				return '분데스리가';
				break;
			case '432':
				return '포칼컵';
				break;
			case '433':
				return '에레디비시';
				break;
			case '434':
				return '리그 1';
				break;
			case '436':
				return '라리가';
				break;
			case '438':
				return '세리에 A';
				break;
			case '439':
				return '포르투갈';
				break;
			case '440':
				return '챔피언스리그';
				break;
			case 'kbo2017':
				return 'KBO';
				break;
			default:
				return '-';
				break;
		}
	},

	getsportsName: function(code) {
		code = (code || '').toString();

		switch(code) {
			case '1':
				return '축구';
				break;
			case '2':
				return '야구';
				break;
			default:
				return '-';
				break;
		}
	},

	getDateString: function(date) {
		var dayArr = ['일', '월', '화', '수', '목', '금', '토'];
		date = new Date(date);
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = dayArr[date.getDay()];
		var _date = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		month = month >= 10 ? month : '0' + month
		_date = _date >= 10 ? _date : '0' + _date;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;

		var dateString = month + '.' + _date + ' (' + day + ')' + '<br>' + hours + ':' + minutes;

		return dateString;
	},

	sortStatisticsData: function(type, sortType) {
		if(type == 'sport') {
			this.targetStatistics_sport.sort(function(a, b) {
				return (a[sortType] > b[sortType]) ? -1 : ((b[sortType] > a[sortType]) ? 1 : 0);
			});
		} else if(type == 'league') {
			this.targetStatistics_league.sort(function(a, b) {
				return (a[sortType] > b[sortType]) ? -1 : ((b[sortType] > a[sortType]) ? 1 : 0);
			});
		} else {
			this.targetStatistics_club.sort(function(a, b) {
				return (a[sortType] > b[sortType]) ? -1 : ((b[sortType] > a[sortType]) ? 1 : 0);
			});
		}
	}
};
