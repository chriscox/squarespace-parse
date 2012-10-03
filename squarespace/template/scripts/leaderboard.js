// show loading...

$("#loading-indicator").fadeIn();

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var view = FootballPool.URL.getHash("view", "overall");

var headerTemplate = _.template("<thead class=''>" +
  "<tr>" +
    "<th rowspan='2' class='horz-center'>#</th>" +
    "<th rowspan='2' class=''>Player</th>" +
    "<% if (view == 'overall') { %>" +
      "<th colspan='17' class='horz-center'>Points per Week</th>" +
    "<% } else { %>" +
      "<th colspan='17' class='horz-center'>Money per Week</th>" +
    "<% } %>" + 
    "<th rowspan='2' class='horz-center'>Total</th>" +   
  "</tr>" +
  "<tr>" +
    "<% for (var i=1; i<=17; i++) { %> <th class='horz-center'><%= i %></th> <% } %>" +
  "</tr>" +
  "</thead>"
);

var rowTemplate = _.template("<tr>" +
  "<td class='horz-center'><%= playerIndex %></td>" +
  "<td><%= name %></td>" +
  "<% if (view == 'overall') { %>" +
    "<% for (var i=1; i<=17; i++) { %> <td class='horz-center'><%= (winsByWeek['w' + i]) ? winsByWeek['w' + i] : '' %></td> <% } %>" +
  "<% } else { %>" +
    "<% for (var i=1; i<=17; i++) { %> <td class='horz-center'><%= (moneyByWeek['w' + i]) ? '$' + moneyByWeek['w' + i] : '' %></td> <% } %>" +
  "<% } %>" +
  "<% if (view == 'overall') { %>" +
    "<td class='horz-center'><%= winTotal %></td>" +
  "<% } else { %>" +
    "<td class='horz-center'>$<%= moneyTotal %></td>" +
  "<% } %>" +  
  "</tr>"
);

/** View representing a table */
var TableView = Parse.View.extend({
    tagName: 'table',
    className: 'table table-striped table-bordered table-condensed',

    initialize : function() {
        _.bindAll(this,'render','renderOne');
        this.render();
    },
    render: function() {
      $("#leaderboard").html('');   
      this.renderHeader();   
      this.collection.each(this.renderOne);
      $("#leaderboard").append(this.$el);
      return this;
    },
    renderHeader: function() {
      var header = new HeaderView();
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
    var html = headerTemplate();
    this.setElement( $(html) );
    return this;
  }
});

/** View representing a row of that table */
var RowView = Parse.View.extend({  
    render: function() {

      if (view == "money") {
        if (this.model.get("user").get("robot")) {
          return this;
        }
      }    

      var html = rowTemplate(this.model.toJSON());
      this.setElement( $(html) );
      return this;
    }
});


// get users
var userStatsCollection = FootballPool.Data.getCollection("UserStats");
userStatsCollection.query.equalTo("season", season);
userStatsCollection.query.include("user");
userStatsCollection.comparator = function(object) {
  return -object.get("total");
};

var fetchBlock = {

  success: function(collection) {    

    collection.each(function(object) {
      object.set("name", object.get("user").get("firstName") + " " + object.get("user").get("lastName").substring(0,1));   

      // set win total
      var winTotal = 0;
      var wins = object.get("winsByWeek");
      for (week in wins) {
        winTotal += wins[week];
      }
      object.set({"winTotal": winTotal});  

      // set money total
      var moneyTotal = 0;
      var moneyWins = object.get("moneyByWeek");
      for (week in moneyWins) {
        moneyTotal += moneyWins[week];
      }
      object.set({"moneyTotal": moneyTotal});        

      object.set({"total": (view == "overall") ? winTotal : moneyTotal}); 

    });
    
    collection.sort();
    collection.each(function(object) {
      object.set({"playerIndex": collection.indexOf(object)+1});
    });

    var tableView = new TableView({collection: collection});    
    $("#loading-indicator").fadeOut();
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
};

// fetch data

userStatsCollection.fetch(fetchBlock);


$(function(){

  // set active button

  $(".view-selector").removeClass("active");
  $("#" + view).addClass("active");

  // change view

  $(".view-selector").click(function(e){
    $(".view-selector").removeClass("active");
    $(e.target).addClass("active");
    FootballPool.URL.setHash("view", e.target.id);  
    view = e.target.id;
    $("#loading-indicator").fadeIn();
    userStatsCollection.fetch(fetchBlock);
  });

});

