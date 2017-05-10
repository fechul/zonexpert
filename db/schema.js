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
    'readyGameCnt': {'type': Number, 'default': 5}
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

var leagueSchema = new Schema({
    'id' : String,
    'name' : String
});

var teamSchema = new Schema({
    'id' : String,
    'leagueId': String,
    'name': String,
    'code': String,
    'shortName': String,
    'squadMarketValue': Number,
    'crestUrl': String
});

var matchSchema = new Schema({
    'id' : String,
    'leagueId' : String,
    'date' : Date,
    'matchday' : String,
    'homeTeamName' : String,
    'homeTeamId' : String,
    'awayTeamName' : String,
    'awayTeamId' : String,
    'status': String,
    'result' : {
        'homeTeam' : {
            'goalsHomeTeam' : String,
            'default' : 0
        },
        'awayTeam' : {
            'goalsAwayTeam' : String,
            'default' : 0
        }
    },
    'pickCount': {
        'home': {'type': Number, 'default': 0},
        'draw': {'type': Number, 'default': 0},
        'away': {'type': Number, 'default': 0}
    }
});

var predictionSchema = new Schema({
    'userEmail': String,
    'createTime': Date,
    'matchId': String,
    'leagueId': String,
    'teamList': Array,
    'confirmed': {type: Boolean, default: false},
    'confirmedTime': Date,
    'pick': String, // home || draw || away
    'result': String, // true, false, wait
    'beforeRating': Number,
    'afterRating': Number
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

var user = mongoose.model('user', userSchema);
var league = mongoose.model('league' , leagueSchema);
var match = mongoose.model('match', matchSchema);
var team = mongoose.model('team' , teamSchema);
var board = mongoose.model('board', boardSchema);
var prediction = mongoose.model('prediction', predictionSchema);

module.exports = {
  'user' : user,
  'league': league,
  'match' : match,
  'team' : team,
  'board': board,
  'prediction': prediction
};
