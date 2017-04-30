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




var league = mongoose.model('league' , leagueSchema);
var fixture = mongoose.model('fixture' , fixtureSchema);
var team = mongoose.model('team' , teamSchema);

module.exports = {
  league : league,
  fixture : fixture,
  team : team
};

// var models = require('./schema');
// ...
// models.User.findOne(.
