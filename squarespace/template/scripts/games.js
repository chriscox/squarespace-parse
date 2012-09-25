// show loading...

$("#loading-indicator").fadeIn();

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));

// get user picks

var UserPick = Parse.Object.extend("UserPick");
var queryPicks = new Parse.Query(UserPick);
queryPicks.equalTo("season", season);
queryPicks.equalTo("week", week);
queryPicks.include("user");
queryPicks.limit(1000);

var UserPickCollection = Parse.Collection.extend({
  model: UserPick,
  query: queryPicks
});

var gameIndex = new Array();
var teamIndex = new Array();
var playerIndex = new Array();

var userPickCollection = new UserPickCollection;
var userPickFetchBlock = {
  success: function(collection) {
    // get game and team indexes

    collection.each(function(object) {

      var gameId = object.get("game");
      var teamId = object.get("team");
      teamIndex[teamId] = new Array();
      gameIndex[gameId] = teamIndex;
    });

    // now add picks to index

    collection.each(function(object) {

      var gameId = object.get("game");
      var teamId = object.get("team");
      var user = object.get("user");

      // don't include robots

      if (user != null && user.get("robot") != true) {

        var name = user.get("firstName") + " " + user.get("lastName").substring(0,1); 

        var pick = new Object();
        pick.id = user.id;
        pick.name = name;

        gameIndex[gameId][teamId].push(pick);
      }
    });

    gameCollection.fetch(gameFetchBlock);
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
}
userPickCollection.fetch(userPickFetchBlock);


// get games

var Game = Parse.Object.extend("Games");
var queryGames = new Parse.Query(Game);
queryGames.equalTo("week", week);
queryGames.equalTo("season", season);
queryGames.include("awayTeam");
queryGames.include("homeTeam");

var GameCollection = Parse.Collection.extend({
  model: Game,
  query: queryGames
});

var gridView;
var gameCollection = new GameCollection;
gameCollection.comparator = function(object) {
  return object.get("date");
};

var gameFetchBlock = {
  success: function(collection) {

    collection.each(function(object) {

      // set teams for each game

      var teamTypes = FootballPool.Utils.getTeamTypes();
      for (var i = 0; i < teamTypes.length; i++) {

        var team = object.get(teamTypes[i]);
        var model = new Object();
        model.id = team.id;
        model.name = team.get("name");
        model.nickName = team.get("nickName");
        var spread = (i==0) ? object.get("awaySpread") : object.get("homeSpread");        
        model.spread = (spread > 0) ? spread + " +" : "";

        object.set( (i==0) ? {"awayTeamModel": model} : {"homeTeamModel": model} );

        // set user picked teams for each game

        if (gameIndex[object.id] != null && gameIndex[object.id][team.id] != null) {
          var picks = gameIndex[object.id][team.id];
          var text = (picks.length > 1) ? picks.length + " players" :  picks.length + " player";
          var hasPicks = (picks.length > 0) ? "active" : ""; 
          object.set( (i==0) ? {"awayPicks":text} : {"homePicks":text} );
          object.set( (i==0) ? {"hasAwayPicks":hasPicks} : {"hasHomePicks":hasPicks} );

          object.set( (i==0) ? {"awayPicks1":picks} : {"homePicks1":picks} );

         } else {
          // no games picked          
          object.set( (i==0) ? {"awayPicks":""} : {"homePicks":"" } );
          object.set( (i==0) ? {"hasAwayPicks":""} : {"hasHomePicks":""} );
          object.set( (i==0) ? {"awayPicks1":""} : {"homePicks1":""} );
        }

      }

      object.set({"gameId": object.id});
      object.set({"gameIndex": collection.indexOf(object)+1});
      object.set({"gameDate": new Date(object.get("date"))});

      // game winner
      if (typeof object.get("teamWonByScore") === "undefined") {
        object.set({"awayGameWinner": ""});
        object.set({"homeGameWinner": ""});
      } else {
        object.set({"awayGameWinner": (object.get("teamWonByScore").id == object.get("awayTeam").id) ? "game-winner" : ""});
        object.set({"homeGameWinner": (object.get("teamWonByScore").id == object.get("homeTeam").id) ? "game-winner" : ""});
      }

      // spread winner   
      if (typeof object.get("teamWonBySpread") === "undefined") {
        object.set({"awaySpreadWinner": ""});
        object.set({"homeSpreadWinner": ""});
      } else {
        object.set({"awaySpreadWinner": (object.get("teamWonBySpread").id == object.get("awayTeam").id) ? "spread-winner" : ""});
        object.set({"homeSpreadWinner": (object.get("teamWonBySpread").id == object.get("homeTeam").id) ? "spread-winner" : ""});
      }

    });    
    gridView = new GridView({collection:collection});
    $("#games-count").text(collection.length);
    $("#loading-indicator").fadeOut();
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
}

// Week selector

var WeekList = Parse.View.extend({
  events: { 'click': 'selectionChanged'},
  initialize: function(){
    _.bindAll(this, 'render');
    this.render();
  },

  render: function() {
    for (var i=1; i<=17; i++) {
      var isActive = (week == i) ? "active" : "";
      var elem = $(this.el).append("<div class='week-selector " + isActive + "'>" + i + "</div><div class='week-selector-spacer'>|</div>");
    }     
    return this;
  },

  selectionChanged: function(e) {
    if ($(e.target).hasClass("week-selector")) {
      var week = parseInt($(e.target).text());
      $("#loading-indicator").fadeIn();
      
      FootballPool.URL.setHash("week", week);         
      $(".week-selector").removeClass("active");
      $(e.target).addClass("active");
      queryPicks.equalTo("week", week);
      queryGames.equalTo("week", week);
      userPickCollection.fetch(userPickFetchBlock);    
    }
  }
});

var GridView = Parse.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');               
    this.render();
  },

  render: function(){
    // console.log(JSON.stringify(this.collection.toJSON()));


    var indexTemplate = kendo.template($("#indexTemplate").html());
    var dateTemplate = kendo.template($("#dateTemplate").html());
    var teamTemplate = kendo.template($("#teamTemplate").html());
    var scoreTemplate = kendo.template($("#scoreTemplate").html());
    var spreadTemplate = kendo.template($("#spreadTemplate").html());
    var spreadWinnerTemplate = kendo.template($("#spreadWinnerTemplate").html());
    var playerTemplate = kendo.template($("#playerTemplate").html());

    $("#games-grid").kendoGrid({
      selectable: "multiple cell",
      columns: [
        {title:"#", width:40, template: indexTemplate({gameIndex:"${gameIndex}"})},
        {title:"Date", width:130, template: dateTemplate({
          date:"#= kendo.toString(new Date(gameDate.iso),'ddd, MMM d, yyyy') #",
          time:"#= kendo.toString(new Date(gameDate.iso),'h:mm tt') #"
        })},
         {title:"Teams", width:240, template: teamTemplate({
          gameId:"${gameId}", 
          awayTeamId:"${awayTeamModel.id}",
          awayTeamName:"${awayTeamModel.name}", 
          awayTeamNickName:"${awayTeamModel.nickName}",    
          homeTeamId:"${homeTeamModel.id}",
          homeTeamName:"${homeTeamModel.name}", 
          homeTeamNickName:"${homeTeamModel.nickName}"      
        })},
        {title:"Score", width:58, template: scoreTemplate({
          awayScore:"${awayScore}", 
          homeScore:"${homeScore}",
          awayGameWinner:"${awayGameWinner}", 
          homeGameWinner:"${homeGameWinner}"
        })},
        {title:"Spread", width:58, template: spreadTemplate({
          awaySpread:"${awaySpread}",
          homeSpread:"${homeSpread}"
        })},
        {title:"Spread<br/>Winner", width:64, template: spreadWinnerTemplate({
          awaySpreadWinner:"${awaySpreadWinner}", 
          homeSpreadWinner:"${homeSpreadWinner}"
        })},
        {title:"Player Picks", template: playerTemplate({
          awayPicks:"${awayPicks}",
          homePicks:"${homePicks}",
          hasAwayPicks:"${hasAwayPicks}",
          hasHomePicks:"${hasHomePicks}",
          gameId:"${gameId}",
          awayTeamId:"${awayTeamModel.id}",
          homeTeamId:"${homeTeamModel.id}"
        })}
      ],
      dataSource: {
        data: this.collection.toJSON()            
      }
    });

    $(".game-cell input").click(function(e){

      $("#game-players").fadeOut("fast", function(){
        var el = $(e.target);      
        
        var gameId = el.parents(".game-cell").attr("id").substring(12); //player-cell-F3bJ7ZQAhf      
        var teamId = el.attr("id").substring(10); //team-cell-i0RNkEiLky

        var players = gameIndex[gameId][teamId];
        var htmlString = "";
        for (var i=0; i<players.length; i++) {
          htmlString += "<li><a href='#'>" + players[i].name + "</a></li>";
        }
        $("#player-list").html(htmlString);
        $("#game-players").css({'top': el.position().top + 40 + 'px'}).fadeIn("fast");
      });
      return false;
    });


    return this;

  }
});

var weekList = new WeekList();
$("#weekPicker").append(weekList.el);








