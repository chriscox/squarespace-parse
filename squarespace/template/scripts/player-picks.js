// show loading...

$("#loading-indicator").fadeIn();

var headerTemplate = _.template("<thead class=''>" +
  "<tr>" +
    "<th rowspan='2' class='horz-center'>#</th>" +
    "<th>Name</th>" +
    "<th class='horz-center'>Wins</th>" +
    "<% for (var i=0; i<models.length; i++) { %>" +
      "<th class='horz-center teams'>" +
        "<div><%= models[i].get('homeTeam').get('abbr') %></div>" +
        "<div class='small'>AT</div>" +
        "<div><%= models[i].get('awayTeam').get('abbr') %></div>" +
      "</th>" +
    "<% } %>" +
  "</tr>" +
  "</thead>"
);

var rowTemplate = _.template("<tr>"+
  "<td class='horz-center'><%= playerIndex %></td>" +
  "<td class=''><%= name %></td>"+
  "<td class='horz-center'><%= wins %></td>"+
  "<% for (var i=0; i<teams.length; i++) { %>" +
    "<td class='horz-center'><%= teams[i] %></td>" +
  "<% } %>" +
  "</tr>");

var TableView = Parse.View.extend({
    tagName: 'table',
    className: 'table table-striped table-condensed table-bordered',

    initialize : function() {
        _.bindAll(this,'render','renderOne');
        this.render();
    },
    render: function() {
      $("#player-picks-grid").html('');
      this.renderHeader(this.options.games);
      this.collection.each(this.renderOne);
      $("#player-picks-grid").append(this.$el);
      return this;
    },
    renderHeader: function(model) {      
      var header = new HeaderView({model:model});
      this.$el.append(header.render().$el);
      return this;
    },
    renderOne : function(model) {
      var row = new RowView({model:model});
      this.$el.append(row.render().$el);
      return this;
    }
});

var HeaderView = Parse.View.extend({  
  render: function() {
    var html = headerTemplate(this.model);
    this.setElement( $(html) );
    return this;
  }
});

var RowView = Parse.View.extend({  
    render: function() {
      var html = rowTemplate(this.model.toJSON());
      this.setElement( $(html) );
      return this;
    }
});

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));

// get games

var gameQuery = new Parse.Query("Games");
gameQuery.equalTo("season", season);
gameQuery.equalTo("week", week);
gameQuery.ascending("date");
gameQuery.include("homeTeam");
gameQuery.include("awayTeam");

// get users

var userQuery = new Parse.Query("User");
userQuery.ascending("firstName");

// get user picks

var userPickCollection = FootballPool.Data.getCollection("UserPick");
userPickCollection.query.equalTo("season", season);
userPickCollection.query.equalTo("week", week);
userPickCollection.query.include("user");
userPickCollection.query.include("teams");
userPickCollection.query.include("games");
userPickCollection.query.limit(1000);
userPickCollection.query.matchesQuery("user", userQuery);
userPickCollection.comparator = function(object) {
  return object.get("user").get("firstName");
};

var fetchBlock = {

  success: function(userPicks) {

    // create indexed array of picks by user id

    userPicks.each(function(object) {
      object.set("userId", object.get("user").id);
    });

    var arr = _.toArray(userPicks);
    var attr = _.pluck(arr, 'attributes');
    var picksByUserId = _.groupBy(attr, 'userId');

    // get games
    gameQuery.collection().fetch({
      success: function(games) {

        // get users

        userQuery.collection().fetch({          
          success: function(users) {

            console.log("loading...");

            users.each(function(user){

              var picks = picksByUserId[user.id];
              var teams = new Array();
              var wins = "";

              games.each(function(game){
                var index = games.indexOf(game);

                if (picks == null) {
                  teams.push("");
                
                } else {

                  var match = false;
                  _.each(picks, function(pick) {

                    if (pick.games.id == game.id) {                      
                      if (game.get('final')){
                        if (pick.teams.id == game.get('teamWonBySpread').id) {
                          teams.push("<span class='player-pick winner'>" + pick.teams.attributes.abbr + "</span>");
                          wins++;
                        } else {
                          teams.push("<span class='player-pick'>" + pick.teams.attributes.abbr + "</span>");
                        }
                      } else {
                        teams.push("<span class='player-pick'>" + pick.teams.attributes.abbr + "</span>");
                      }                     
                      match = true;
                    } 
                  });

                  if (!match) {
                    teams.push("");
                  }
                }

              });
              user.set("wins", wins);
              user.set("teams", teams);
              user.set("name", user.get("firstName") + " " + user.get("lastName").substring(0,1));
              user.set({"playerIndex": users.indexOf(user)+1});
              user.set({"userId": user.id});

            });
            var tableView = new TableView({collection: users, games: games});   
            $("#loading-indicator").fadeOut(); 
          }, 
          error:function(users, error) {
            $("#loading-indicator").fadeOut();
          }
        });
        $("#loading-indicator").fadeOut();
      },
      error: function(games, error){
        $("#loading-indicator").fadeOut();
      }      
    });
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
};

userPickCollection.fetch(fetchBlock);


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
      gameQuery.equalTo("week", week);
      userPickCollection.query.equalTo("week", week);
      userPickCollection.fetch(fetchBlock);
    }
  }
});

var weekList = new WeekList();
$("#weekPicker").append(weekList.el);
