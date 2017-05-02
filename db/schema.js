var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'id': String,
    'email': String,
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

var user = mongoose.model('user', userSchema);
var league = mongoose.model('league' , leagueSchema);
var team = mongoose.model('team' , teamSchema);

module.exports = {
<<<<<<< HEAD:db/schedule.js
  league : league,
  team : team
=======
  'user' : user,
  'league': league,
  'fixture' : fixture,
  'team' : team
>>>>>>> 375765c4c0075a0c215152c12b599fbdeb0902f1:db/schema.js
};
