//
// When updating finalized games, calculate game winners and spread winners
//

Parse.Cloud.beforeSave("Games", function(request, response) {
  var gameFinal = request.object.get("final");
  if (gameFinal) {

    var spreadWinner = getSpreadWinner(request.object);
    if (spreadWinner == null) {
      request.object.unset("teamWonBySpread");
    } else {
      request.object.set("teamWonBySpread", spreadWinner);
    }
    
    var scoreWinner = getScoreWinner(request.object);
    if (scoreWinner == null) {
      request.object.unset("teamWonByScore");
    } else {
      request.object.set("teamWonByScore", scoreWinner);
    }
    
  } else {
    request.object.unset("teamWonBySpread");
    request.object.unset("teamWonByScore");
  }
  response.success();
});


//
// Update user stats
//

Parse.Cloud.beforeSave("UserStats", function(request, response) {
  if (!Parse.User.current().get("administrator")) {
    response.error("You must be an Administrator to perform this update.");  
  } else {
    response.success();
  }
});


//
//   Private Functions
//

function getSpreadWinner(game) {

  // returns team that wins by beating spread

  var homeTeam = game.get("homeTeam");
  var awayTeam = game.get("awayTeam");
  var homeSpread = game.get("homeSpread");
  var awaySpread = game.get("awaySpread");
  var homeScore = game.get("homeScore");
  var awayScore = game.get("awayScore");

  if (awaySpread > 0 && homeSpread == 0) {

    return ((awayScore - awaySpread - 0.1) > homeScore) ? awayTeam : homeTeam;

  } else if (homeSpread > 0 && awaySpread == 0) {

    return (awayScore > (homeScore - homeSpread - 0.1)) ? awayTeam : homeTeam;

  } else if (awaySpread == 0 && homeSpread == 0) {
    if (awayScore == homeScore) {
      return null;
    } else {
      return (awayScore > homeScore) ? awayTeam : homeTeam;
    }
  }
}

function getScoreWinner(game) {

  // returns team that wins game by score

  var homeTeam = game.get("homeTeam");
  var awayTeam = game.get("awayTeam");
  var homeScore = game.get("homeScore");
  var awayScore = game.get("awayScore");
  if (awayScore == homeScore) {
    return null;
  } else {
    return (awayScore > homeScore) ? awayTeam : homeTeam;
  }
}




