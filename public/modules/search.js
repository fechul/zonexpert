var SEARCH = {
	init: function(options) {
		var self = this;

		this.search_id = options.search_id;
		this.search_rating = parseInt(options.search_rating, 10);
		this.targetStatistics_league = [];
		this.targetStatistics_club = [];

		this.recentRates = [];
		this.recentMatches = [];

		$('.my_recent_predict_wrapper').hide();

		this.init_events();
		this.getMatchesStatistics('league', function() {
			self.setStatisticsField('league');
			self.getMatchesRecord(function() {
				self.setRecordField();
			});
		});
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
			if(value == 'league') {
				$('.statistics_table_type_name').html('리그');
				self.getMatchesStatistics('league', function() {
					self.setStatisticsField('league');
				});
			} else {
				$('.statistics_table_type_name').html('클럽');
				self.getMatchesStatistics('club', function() {
					self.setStatisticsField('club');
				});
			}
		});
	},

	//chart
	setRecordField: function() {
		var self = this;

		var recentMatches = this.recentMatches;
		var list_html = '';

		if(recentMatches && recentMatches.length) {
			for(var i = 0; i < recentMatches.length; i++) {
				list_html += '<div class="recent_predict_data_row">';

				var date = recentMatches[i].date;
				list_html += '<span class="recent_predict_data_row_date">' + (date.getFullYear()%100) + '/' + (date.getMonth()+1 < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1)) + '/' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + '</span>';
				list_html += '<span class="recent_predict_data_row_homename">' + recentMatches[i].homeTeamName + '</span>';
				list_html += '<img src="' + recentMatches[i].homeTeamImg + '"></img>';
				list_html += '<span class="recent_predict_data_row_goals">' + recentMatches[i].homeTeamGoals + ' : ' + recentMatches[i].awayTeamGoals + '</span>';
				list_html += '<img src="' + recentMatches[i].awayTeamImg + '"></img>';
				list_html += '<span class="recent_predict_data_row_awayname">' + recentMatches[i].awayTeamName + '</span>';

				if(recentMatches[i].myPredict == 'true') {
					list_html += '적중';
				} else {
					list_html += '실패';
				}

				var afterRating = parseInt(recentMatches[i].afterRating, 10);
				var ratingChange = recentMatches[i].afterRating - parseInt(recentMatches[i].beforeRating, 10);
				if(ratingChange > 0) {
					ratingChange = '+' + ratingChange;
				}
				list_html += '<span class="recent_predict_data_row_rating">' + afterRating + '(' + ratingChange + ')</span>';
				list_html += '</div>';
			}
			$('.my_recent_predict_section').append(list_html);
		}

		var ctx = $("#myChart");
		ctx.attr('height', 150);

		var labels = this.getDateList();
		var datelist = [];
		var ratelist = [];

		if(recentMatches && recentMatches.length) {
			for(var d = labels.length-1; d >= 0 ; d--) {
				datelist[d] = (labels[d].month + '/' + labels[d].day);
				var found = false;
				var max = -9999;
				for(var r = 0; r < recentMatches.length; r++) {
					var matchDate = new Date(recentMatches[r].date);
					if((matchDate.getMonth()+1) == labels[d].month && matchDate.getDate() == labels[d].day) {
						if(recentMatches[r].afterRating > max) {
							max = recentMatches[r].afterRating;
							ratelist[d] = max;
							found = true;
						}
					}
				}
				if(!found && d == labels.length-1) {
					ratelist[d] = self.search_rating;
				} else if(!found) {
					ratelist[d] = ratelist[d+1];
				}
			}
		} else {
			for(var d = labels.length-1; d >= 0 ; d--) {
				ratelist.push(self.search_rating);
			}
		}

		var data = {
		    labels: datelist,
		    datasets: [
		        {
		            label: "Rating",
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
	        },
	        onClick: 'handleClick'
	    };

		var myChart = new Chart(ctx, {
		    type: 'line',
		    data: data,
		    options: options
		});
	},

	//pie
	setStatisticsField: function(type) {
		var statisticsData = [];
		if(type == 'league') {
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

			if(type == 'league') {
				for(var i = 0; i < statisticsData.length; i++) {
					var leagueId = statisticsData[i].leagueId;
					var leagueName = statisticsData[i].leagueName;
					var leagueHit = statisticsData[i].leagueHit;
					var leagueFail = statisticsData[i].leagueFail;
					var leagueGameCnt = statisticsData[i].leagueGameCnt;
					var leagueRate = Math.floor(statisticsData[i].leagueRate);

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
								onClick: 'handleClick'
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
								onClick: 'handleClick'
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
		if(type == 'league') {
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
					if(type == 'league') {
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
					return (a.date > b.date) ? -1 : ((b.date > a.date) ? 1 : 0);
				});
			}

			self.recentMatches = recordData;
			callback();
		});
	},

	getDateList: function() {
		var now = new Date();
		var month = now.getMonth() + 1;
		var date = now.getDate();

		var datelist = [];

		if(date > 9) {
			var start = date-9;
			for(var i = start; i < date+1; i++) {
				datelist.push({
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

			if([1,3,5,7,8,10,12].indexOf(month) > -1) {
				var start = (31 - (10-date) + 1);
				for(var i = start; i < 32; i++) {
					datelist.push({
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						month: month+1,
						day: i
					});
				}
			} else if([4,6,9,11].indexOf(month) > -1) {
				var start = (30 - (10-date) + 1);
				for(var i = start; i < 31; i++) {
					datelist.push({
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						month: month+1,
						day: i
					});
				}
			} else {
				var start = (28 - (10-date) + 1);
				for(var i = start; i < 29; i++) {
					datelist.push({
						month: month,
						day: i
					});
				}
				for(var i = 1; i < date+1; i++) {
					datelist.push({
						month: month+1,
						day: i
					});
				}
			}
		}

		return datelist;
	},

	getLeagueName: function(code) {
		code = parseInt(code, 10);

		switch(code) {
			case 426:
				return '프리미어리그';
				break;
			case 429:
				return '잉글랜드FA컵';
				break;
			case 430:
				return '분데스리가';
				break;
			case 432:
				return '포칼컵';
				break;
			case 433:
				return '에레디비시';
				break;
			case 434:
				return '리그 1';
				break;
			case 436:
				return '라리가';
				break;
			case 438:
				return '세리에 A';
				break;
			case 439:
				return '포르투갈';
				break;
			case 440:
				return '챔피언스리그';
				break;
			default:
				return '-';
				break;
		}
	},

	sortStatisticsData: function(type, sortType) {
		if(type == 'league') {
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
