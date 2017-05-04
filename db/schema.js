var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'email': String,
    'nickname': String,
    'password': String,
    'authed': {'type': Boolean, 'default': false},
    'signup_auth_token': String,
    'signup_date': Date,
    'nickname': String,
    'main_sport': Number, // soccer 1
    'main_league': Number,

    'rating': {'type': Number, 'default': 1500},
    'record': Object,

    'like_board': Array
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

var leagueSchema = new Schema({
    'id' : String,
    'name' : String
});

var teamSchema = new Schema({
    'id' : String,
    'rank' : String,
    'team' : String,
    'playedGames' : String,
    'imageURI' : String,
    'points' : String,
    'goals' : String,
    'goalsAgainst' : String,
    'goalDifference' : String
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
    }
});

var prediectionSchema = new Schema({
    'user_email': String,
    'create_time': Date,
    'match_id': String,
    'league_id': String,
    'pick': String, // home || draw || away
    'result': {type: String, default: 'wait'}, // true, false, wait
    'before_rating': Number,
    'after_rating': Number
});

var basketSchema = new Schema({
    'userEmail': String,
    'createTime': Date,
    'matchId': String,
    'leagueId': String,
    'pick': String
});

var boardSchema = new Schema({
    'boardNo': Number,
    'writer' : String,
    'date' : Date,
    'title': String,
    'content': String,
    'like': Number
});

var user = mongoose.model('user', userSchema);
var league = mongoose.model('league' , leagueSchema);
var match = mongoose.model('match', matchSchema);
var basket = mongoose.model('basket', basketSchema);
var team = mongoose.model('team' , teamSchema);
var board = mongoose.model('board', boardSchema);

module.exports = {
  'user' : user,
  'league': league,
  'match' : match,
  'basket': basket,
  'team' : team,
  'board': board
};
