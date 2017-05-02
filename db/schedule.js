var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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




var league = mongoose.model('league' , leagueSchema);
var team = mongoose.model('team' , teamSchema);

module.exports = {
  league : league,
  team : team
};

// var models = require('./schema');
// ...
// models.User.findOne(.
