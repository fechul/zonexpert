var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var competitionSchema = new Schema({
  'id' : Number,
  'name' : String,
  'numberOfTeams' : Number
});

var leagueSchema = new Schema({
  'competitionId' = Number,
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

var teamSchema = new Schma({

});

var fixtureSchema = new Schema({
  'competitionId' = Number,
  'id' = Number,
  'date' = Date,
  'matchday' = Number,
  'homeTeamName' = String,
  'homeTeamId' = Number,
  'awayTeamName' = String,
  'awayTeamId' = Number,
  'result' = {
      'homeTeam' :
        {'goalsHomeTeam' : Number, 'default' = null},
      'awayTeam' :
        {'goalsAwayTeam' = Number, 'default' = null}}
});



var competition = mongoose.model('competition' , competitionSchema);
var league = mongoose.model('league' , leagueSchema);
var fixture = mongoose.model('fixture' , fixtureSchema);
var team = mongoose.model('team' , teamSchema);

module.exports = {
  competition : comeptition,
  league : league,
  fixture : fixture,
  team : team
};

// var models = require('./schema');
// ...
// models.User.findOne(.
