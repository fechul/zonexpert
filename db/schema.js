var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'id': String,
    'email': String,
    'password': String,
    'authed': {'type': Boolean, 'default': false},
    'signup_auth_token': String,
    'signup_date': Date,
    'like_board': Array,
    'tier_code': Number,
    'nickname': String
});

var leagueSchema = new Schema({
  'id' : String,
  'name' : String,

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
  'leagueId' : String,
  'id' : String,
  'date' : Date,
  'matchday' : String,
  'homeTeamName' : String,
  'homeTeamId' : String,
  'awayTeamName' : String,
  'awayTeamId' : String,
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
var team = mongoose.model('team' , teamSchema);
var board = mongoose.model('board', boardSchema);

module.exports = {

  'user' : user,
  'league': league,
  'fixture' : fixture,
  'team' : team,
  'board': board
};
