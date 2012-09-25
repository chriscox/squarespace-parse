// login

if (!FootballPool.User.isLoggedIn()) {
  FootballPool.URL.loginRedirect("user-picks");
}

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));
var override = false;

function showSaveError(show) {
  if (show) {
    $("#save-error").show();
  } else {
    $("#save-error").hide();
  }
}

function makeQuickPicks() {
  var option = $("#quickPicker select").val();
  gameCollection.each(function(game) {
    if (!override) {
      if (game.get("final")){
        return;
      }
    }

    var gameId = game.id;
    var teamId;

    if (option == "home") {    
      teamId = game.get("homeTeam").id;

    } else if (option == "away") {
      teamId = game.get("awayTeam").id;

    } else if (option == "favored") {      
     
      if (game.get("awaySpread") > game.get("homeSpread")) {
        teamId = game.get("awayTeam").id;
      } else {
        teamId = game.get("homeTeam").id;
      }      

    } else if (option == "underdogs") {

      if (game.get("awaySpread") < game.get("homeSpread")) {
        teamId = game.get("awayTeam").id;
      } else {
        teamId = game.get("homeTeam").id;
      }   

    } else if (option == "random") {

      var random = Math.floor((Math.random()*2)+1);
      if (random == 1) {
        teamId = game.get("awayTeam").id;
      } else {
        teamId = game.get("homeTeam").id;
      }

    }
    // save pick
    addUserPick(gameId, teamId);

  });
}


// show loading...

$("#loading-indicator").fadeIn();

// get user picks

var UserPick = Parse.Object.extend("UserPick");
var queryPicks = new Parse.Query(UserPick);

queryPicks.equalTo("user", user);
queryPicks.equalTo("season", season);
queryPicks.equalTo("week", week);

var UserPickCollection = Parse.Collection.extend({
  model: UserPick,
  query: queryPicks
});

var userPickIndex = new Array();
var userPickCollection = new UserPickCollection;
var userPickFetchBlock = {
  success: function(collection) {
    collection.each(function(object) {
      // create keyed index
      var gameId = object.get("game");
      var teamId = object.get("team");
      userPickIndex[gameId] = teamId;
    });
    gameCollection.fetch(gameFetchBlock);
    $("#pick-count").text(collection.length);
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
}



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
  // sort by date
  return object.get("date");
};
var gameFetchBlock = {
  success: function(collection) {
    // console.log(collection.length);
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
      }

      object.set({"gameId": object.id});
      object.set({"gameIndex": collection.indexOf(object)+1});

      var gameDate = new Date(object.get("date"));
      var now = new Date();
      var gameDatePlus15Mins = new Date(object.get("date"));
      gameDatePlus15Mins.setMinutes(gameDatePlus15Mins.getMinutes() + 15);

      object.set({"gameDate": gameDate});


      if (override) {
        object.set({"locked": ""});
      } else {
        object.set({"locked": (now > gameDatePlus15Mins) ? "locked" : ""});
      }

      // set user picked teams for each game
      var teamId = userPickIndex[object.id];
      object.set({"userPick": (teamId) ? teamId : ""});

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
      $("#loading-indicator").fadeIn();
      week = parseInt($(e.target).text());
      FootballPool.URL.setHash("week", week);         
      $(".week-selector").removeClass("active");
      $(e.target).addClass("active");
      queryPicks.equalTo("week", week);
      queryGames.equalTo("week", week);
      userPickCollection.fetch(userPickFetchBlock);    
    }
  }
});

// Quick Picks

var QuickPickList = Parse.View.extend({
  tagName: 'select',
  events: { 'change': 'selectionChanged'},
  initialize: function(){
    _.bindAll(this, 'render');
    this.render();
  },
  render: function() {
    $(this.el).append(' \
      <option value="0">Quick Picks...</option> \
      <option value="home">Home Teams</option> \
      <option value="away">Away Teams</option> \
      <option value="favored">Favored</option> \
      <option value="underdogs">Underdogs</option> \
      <option value="random">Random</option>');
    return this;
  },
  selectionChanged:function(e) {
    var val = e.target.value;
    if (val != 0) {

      var response = confirm("You are about to select all " + val.charAt(0).toUpperCase() + val.slice(1) + " teams.");
      if (response == true) {
        makeQuickPicks();
      }
    }
  }
});

// Add User Picks

var userPickSaveBlock = {
  success: function(userPick) {
    userPickCollection.fetch(userPickFetchBlock);
    showSaveError(false);
    $("#saving-indicator").fadeOut();
  },
  error: function(userPick, error) {
    showSaveError(true);
    console.log(error);
    $("#saving-indicator").fadeOut();
  }  
}

function addUserPick(gameId, teamId) {

  // check if logged in

  if (!FootballPool.User.isLoggedIn()) {
    showSaveError(true);
    return;
  }

  // update UI immediately

  $("#saving-indicator").fadeIn();
  $(".gameId-" + gameId).removeClass("selected");
  $("#cell-" + gameId + "-" + teamId).addClass("selected");

  

  // lookup picks for game
  if (userPickIndex[gameId] == null) {

    // new  pick
    var userPick = new UserPick();
    userPick.set("user", user);
    userPick.set("game", gameId);
    userPick.set("team", teamId);
    userPick.set("week", week);
    userPick.set("season", season);

    var PickedGame = Parse.Object.extend("Games");
    var pickedGame = new PickedGame();
    pickedGame.id = gameId;
    userPick.set("games", pickedGame);

    var PickedTeam = Parse.Object.extend("Teams");
    var pickedTeam = new PickedTeam();
    pickedTeam.id = teamId;
    userPick.set("teams", pickedTeam);

    userPick.save(null, userPickSaveBlock);

  } else {

    // existing pick 

    userPickCollection.each(function(userPick) {
      if (gameId == userPick.get("game")) {
        userPick.set("team", teamId);
        userPick.save(null, userPickSaveBlock);
      }
    });   
  }
}


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

    $("#user-picks-grid").kendoGrid({
      selectable: "multiple cell",
      columns: [
        {title:"Game", width:40, template: indexTemplate({
          gameIndex:"${gameIndex}",
          locked:"${locked}"
        })},
        {title:"Date", width:100, template: dateTemplate({
          date:"#= kendo.toString(new Date(gameDate.iso),'ddd, MMM d, yyyy') #",
          time:"#= kendo.toString(new Date(gameDate.iso),'hh:mm tt') #"
        })},
        {title:"Away Team", width:270, template: teamTemplate({
          gameId:"${gameId}", 
          teamId:"${awayTeamModel.id}",
          teamSpread:"${awayTeamModel.spread}",
          teamName:"${awayTeamModel.name}", 
          teamNickName:"${awayTeamModel.nickName}",            
          selected:"${(userPick == awayTeamModel.id) ? 'selected' : ''}",
          locked:"${locked}"
        })},
        {title:"Home Team", width:270, template: teamTemplate({
          gameId:"${gameId}", 
          teamId:"${homeTeamModel.id}", 
          teamSpread:"${homeTeamModel.spread}",
          teamName:"${homeTeamModel.name}", 
          teamNickName:"${homeTeamModel.nickName}",          
          selected:"${(userPick == homeTeamModel.id) ? 'selected' : ''}",
          locked:"${locked}"
        })}
      ],
      dataSource: {
        data: this.collection.toJSON()            
      }
    });

    return this;

  }
});

var weekList = new WeekList();
$("#weekPicker").append(weekList.el);

var quickPickList = new QuickPickList();
$("#quickPicker").append(quickPickList.el);

if (FootballPool.User.isAdministrator()) {

  var userId = FootballPool.URL.getQuery("userId");
  if (userId) {

    var NewUser = Parse.Object.extend("User");
    var query = new Parse.Query(NewUser);
    query.get(userId, {
      success: function(newUser) {
        override = true;

        var name = newUser.get("firstName") + " " + newUser.get("lastName");
        $("#user-picks").prepend("<div id='logged-as-user'><strong>IMPORTANT:</strong><br/>You are viewing picks for player "+name+".</br/>Any picks updated here will be saved for this player.</div>");
        
        userPickIndex = new Array();
        user = newUser;
        queryPicks.equalTo("user", newUser);
        userPickCollection.fetch(userPickFetchBlock);  
      },
      error: function(user, error) {
        override = false;
      }
    });
  } else {
    // get picks
    userPickCollection.fetch(userPickFetchBlock);
  }
} else {
  // get picks
  userPickCollection.fetch(userPickFetchBlock);
}

