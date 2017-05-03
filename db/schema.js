var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'email': String,
    'nickname': String,
    'password': String,
    'authed': {'type': Boolean, 'default': false},
    'signup_auth_token': String,
    'signup_date': Date
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

var user = mongoose.model('user', userSchema);
var league = mongoose.model('league' , leagueSchema);
var fixture = mongoose.model('fixture' , fixtureSchema);
var team = mongoose.model('team' , teamSchema);

module.exports = {
  'user' : user,
  'league': league,
  'fixture' : fixture,
  'team' : team
};
