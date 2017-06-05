var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'email': String,
    'nickname': String,
    'password': String,
    'authed': {'type': Boolean, 'default': false},
    'signup_auth_token': String,
    'signup_date': Date,
    'main_sport': Number, // soccer 1
    'main_league': Number,
    'rating': {'type': Number, 'default': 1500},
    'record': Object,

    'like_board': Array,
    'readyGameCnt': {'type': Number, 'default': 5},
    'point': {'type': Number, 'default': 0},
    'pointLog': [{
        'amount': Number,
        'classification': String, // charge, use, earn, attendance
        'useClassification': String, // use - system, view
        'matchId': String, // for use, earn
        'target': String, // target email for use(view), earn
        'time': Date
    }],
    'todayAttendancePoint': Boolean
});

// user - record
// {
//   total: {
//     hit: Number,
//     fail: Number
//   },
//   1: {
//     total: {
//       hit: Number,
//       fail: Number
//     },
//     426: {
//       hit: Number,
//       fail: Number
//     },
//     429: {
//       hit: Number,
//       fail: Number
//     }
//   },
//   2: {

//   },
// }


// league
// 프리미어리그 426   FA컵 429   분데스리가 430   포칼컵 432
// 에레디비지에 433   리그앙 434   라리가 436   세리에 438
// 포르투갈 439   챔스 440
// PL,FAC,BL1,DFB,DED,FL1,PD,SA,PPL,CL
// kbo kbo2017

var leagueSchema = new Schema({
    'id' : String,
    'name' : String
});

var teamSchema = new Schema({
    'id' : String,
    'leagueId': String,
    'sportsId': String,
    'name': String,
    'code': String,
    'shortName': String,
    'squadMarketValue': Number,
    'crestUrl': String
});

var matchSchema = new Schema({
    'id' : String,
    'leagueId' : String,
    'sportsId': String,
    'date' : Date,
    'matchday' : String,
    'homeTeamName' : String,
    'homeTeamId' : String,
    'awayTeamName' : String,
    'awayTeamId' : String,
    'status': String,
    'result' : {
        'goalsHomeTeam' : Number,
        'goalsAwayTeam' : Number,
        'halfTime': {
            'goalsHomeTeam' : Number,
            'goalsAwayTeam' : Number
        },
        'extraTime': {
            'goalsHomeTeam' : Number,
            'goalsAwayTeam' : Number
        },
        'penaltyShootout': {
            'goalsHomeTeam' : Number,
            'goalsAwayTeam' : Number
        }
    },
    'pickCount': {
        'home': {'type': Number, 'default': 0},
        'draw': {'type': Number, 'default': 0},
        'away': {'type': Number, 'default': 0}
    },
    'roomOpen': {'type': Boolean, 'default': false}
});

var predictionSchema = new Schema({
    'userEmail': String,
    'createTime': Date,
    'matchId': String,
    'leagueId': String,
    'sportsId': String,
    'teamList': Array,
    'confirmed': {type: Boolean, default: false},
    'confirmedTime': Date,
    'pick': String, // home || draw || away
    'result': String, // true, false, wait
    'beforeRating': Number,
    'afterRating': Number,
    'viewList': Array,
    'ratingCalculatedTime': Date
});

var boardSchema = new Schema({
    'boardNo': Number,
    'writer' : String,
    'date' : Date,
    'title': String,
    'content': String,
    'like': Number
});
//
// var ratingSchema = new Schema({
//     'comingUpMatch': [{
//         'date': Date,
//         ''
//     }]
// });

var feedbackSchema = new Schema({
    'createTime': Date,
    'email': String,
    'contents': String,
    'url': String
});

var user = mongoose.model('user', userSchema);
var league = mongoose.model('league' , leagueSchema);
var match = mongoose.model('match', matchSchema);
var team = mongoose.model('team' , teamSchema);
var board = mongoose.model('board', boardSchema);
var prediction = mongoose.model('prediction', predictionSchema);
var feedback = mongoose.model('feedback', feedbackSchema);

module.exports = {
  'user' : user,
  'league': league,
  'match' : match,
  'team' : team,
  'board': board,
  'prediction': prediction,
  'feedback': feedback
};
