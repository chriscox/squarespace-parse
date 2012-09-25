// login

if (!FootballPool.User.isLoggedIn()) {
  FootballPool.URL.loginRedirect("setup-games");
} else if (!FootballPool.User.isAdministrator()) {
  window.location = "/not-found";
} 

function showSaveError(show) {
  if (show) {
    $("#save-error").show();
  } else {
    $("#save-error").hide();
  }
}

// show loading...

$("#loading-indicator").fadeIn();

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));

// get teams

var Team = Parse.Object.extend("Teams");
var TeamCollection = Parse.Collection.extend({
  model:Team
});

var teamWrapper = kendo.backboneModel(Team);
var teamCollectionWrapper = kendo.backboneCollection(teamWrapper);
var teamCollection = new TeamCollection;
teamCollection.fetch();

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
        object.set( (i==0) ? {"awayTeamModel": model} : {"homeTeamModel": model} );

      }
      object.set({"gameId":object.id});
    });

    gridView = new GridView({collection:collection});    
    $("#games-count").text(collection.length);
    $("#loading-indicator").fadeOut();
  },
    error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
}
gameCollection.fetch(gameFetchBlock);


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
      queryGames.equalTo("week", week);  
      gameCollection.fetch(gameFetchBlock);
    }
  }
});

// Add Game

var gameSaveBlock = {
  success: function(game) {
    console.log("success");
    gameCollection.fetch(gameFetchBlock);
    showSaveError(false);
    $("#saving-indicator").fadeOut();
  },
  error: function(game, error) {
    console.log(error);
    showSaveError(true);
    $("#saving-indicator").fadeOut();
  }  
}

// Add game

var AppView = Parse.View.extend({
  events: { 'click': 'addNewGame'},
    addNewGame: function(){

      $("#saving-indicator").fadeIn();

      var game = new Game();
      game.set("season", season);
      game.set("week", week);
      game.set("date", new Date(gameDate.el.value));
      game.set("homeTeam", $("#homeTeamPicker").data("kendoComboBox").dataItem().backbone);
      game.set("awayTeam", $("#awayTeamPicker").data("kendoComboBox").dataItem().backbone);
      game.set("homeScore", 0);
      game.set("awayScore", 0);
      game.set("homeSpread", 0);
      game.set("awaySpread", 0);
      game.set("final", false);

      game.save(null, gameSaveBlock);
    }
});


var GridView = Parse.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');            
    this.render();
  },

  render: function(){
     // console.log(JSON.stringify(this.collection.toJSON()));

    $("#setup-games-grid").kendoGrid({
      editable: true,
      columns: [
        // {title:"GameId", width:100, field:"gameId"},
        {title:"Date", field:"date.iso",
          template:'#= kendo.toString(new Date(date.iso),"MM/dd/yyyy") #'//,
          // editor: function (container, options) {
          //   $('<input id=\"' + options.field + '\" />').appendTo(container).kendoDatePicker({ format: "MM/dd/yyyy" });
          //   var datePicker = $("#date").data("kendoDatePicker");
          //   datePicker.bind('close', function (e) {
          //       var datepicker = e.sender.element.kendoDatePicker()
          //       var d = new Date(datepicker.val());
          //   });
          // }
        },
        {title:"Time", field:"date.iso", template:'#= kendo.toString(new Date(date.iso),"hh:mm tt") #'},
        {title:"Away Team", field:"awayTeamModel.name"},
        {title:"Away<br/>Spread", field:"awaySpread"},
        {title:"Away<br/>Score", field:"awayScore"},
        {title:"Home Team", field:"homeTeamModel.name"},
        {title:"Home<br/>Spread", field:"homeSpread"},    
        {title:"Home<br/>Score", field:"homeScore"},
        {title:"Final", field:"final"}             
      ],
      dataSource: {
        schema: {
            model: {
              id:"id"
            //   fields: {
            //     gameId: { editable: false },
            //     date: { editable: true },
            //     homeTeamModel:{ editable:false }
            //     // ProductName: { validation: { required: true } },
            //     // UnitPrice: { type: "number", validation: { required: true, min: 1} },
            //     // Discontinued: { type: "boolean" },
            //     // UnitsInStock: { type: "number", validation: { min: 0, required: true } }
            //   }
            }
        },
        data: this.collection.toJSON()

      },
      edit: function(e) {
        // console.log("editing...");
        // console.log(e);
        // var grid = $("#setup-games-grid").data("kendoGrid");
        // grid.cancelRow();
        // e.container.cancelRow();
      },
      save: function(e) {
        // console.log("saving...");
        // console.log(e);
        // console.log(e.values);
        // return;

        var obj = e.values;
        for (key in obj){

          if ((key == "awaySpread") || (key == "awayScore") || (key == "homeSpread") || (key == "homeScore") || (key == "final")) {

            console.log("will update");
            var selectedGame = gameCollection.get(e.model.gameId);
            
            if (selectedGame) {

              selectedGame.set(key, obj[key]);
              selectedGame.unset("gameId");
              selectedGame.unset("awayTeamModel");
              selectedGame.unset("homeTeamModel");

              selectedGame.save(null, {
                success: function(game){
                  console.log("saved");

                  if (key == "final") {

                    FootballPool.Utils.updateUserStats(season, week, function(success, error){

                      console.log(success);
                      console.log(error);
                    });

                    
                  }

                },
                error: function(game, error){
                  console.log(error);
                }
              });


              // console.log(selectedGame);
            }

            break;
          }

        }

      }
    });

    return this;

  }
});

// DateTime selector

var GameDate = Parse.View.extend({

  initialize: function(){
    _.bindAll(this, 'render');
    this.render();
  },

  render: function() {
    $(this.el).kendoDateTimePicker ({
      change: this.onChange,
      parseFormats: ["MM/dd/yyyy"]
    }).data("kendoDateTimePicker");
    return this;
  },

  onChange: function(e) {
    console.log(e.sender._value);
  }
});

// Team selector

var TeamPicker = Parse.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');         
    this.collection.bind('reset', this.render);
  },

  render:function () {

    $(this.el).kendoComboBox({
      placeholder: (this.el.id == "homeTeamPicker") ? "Select home team..."  : "Select away team...",
      dataTextField: "name",
      dataValueField: "name",
      suggest: true,
      dataSource: {
        schema: {
            model: teamWrapper
        },
        data: new teamCollectionWrapper(teamCollection)
      }
    });
    return this;
  },

  onChange: function(e) {
    console.log(e.sender._value);
  },

  selectedTeam : function() {
    return $(this.el).dataItem();
  }
});

var weekList = new WeekList();
$("#weekPicker").append(weekList.el);

var gameDate = new GameDate({el:$("#dateTimePicker")});   
var homeTeam = new TeamPicker({collection:teamCollection, el:$("#homeTeamPicker")});
var awayTeam = new TeamPicker({collection:teamCollection, el:$("#awayTeamPicker")});
var app = new AppView({el:$("#addGame")});


function calcScores(){
 console.log("calcScores");
}

$("#calculate-scores").click(function() {
 
  calcScores();
});




