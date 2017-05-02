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
  'id' : Number,
  'name' : String,

});

var teamSchema = new Schema({
  'id' : Number,
  'rank' : Number,
  'team' : String,
  'playedGames' : Number,
  'imageURI' : String,
  'points' : Number,
  'goals' : Number,
  'goalsAgainst' : Number,
  'goalDifference' : Number
});

var fixtureSchema = new Schema({
  'competitionId' : Number,
  'id' : Number,
  'date' : Date,
  'matchday' : Number,
  'homeTeamName' : String,
  'homeTeamId' : Number,
  'awayTeamName' : String,
  'awayTeamId' : Number,
  'result' : {
      'homeTeam' : {
        'goalsHomeTeam' : Number,
        'default' : Number
      },
      'awayTeam' : {
        'goalsAwayTeam' : Number,
        'default' : Number
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
var fixture = mongoose.model('fixture' , fixtureSchema);
var team = mongoose.model('team' , teamSchema);
var board = mongoose.model('board', boardSchema);

module.exports = {
  'user' : user,
  'league': league,
  'fixture' : fixture,
  'team' : team,
  'board': board
};
