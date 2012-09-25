// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));
var userId = parseInt(FootballPool.URL.getHash("userId", null));
var potFactor = 1;
var pot = 18;

// show loading...

$("#loading-indicator").fadeIn();

var headerTemplate = _.template("<thead class=''>" +
  "<tr>" +
    "<th>Name</th>" +
    "<th class='horz-center'>Total Points</th>" +
    "<th class='horz-center'>Total Money Won</th>" +
  "</tr>" +
  "</thead>"
);

var rowTemplate = _.template("<tr>"+
     // "<td><img src='<%- FootballPool.User.getGravatar('<%= email %>', 30) %> '/></td>"+
     "<td class=''><%= name %></a></td>"+
     "<td class='horz-center'><%= winTotal %></td>"+
     "<td class='horz-center'>$<%= moneyTotal %></td>"+
     "<td class='horz-center'>[ <a href='#'>view details</a> ]</td>"+
     "</tr>");

/** View representing a table */
var TableView = Parse.View.extend({
    tagName: 'table',
    className: 'table table-striped table-condensed',

    initialize : function() {
        _.bindAll(this,'render','renderOne');
        this.render();
    },
    render: function() {
      $("#users").html('');
      this.renderHeader();  
      this.collection.each(this.renderOne);
      $("#users").append(this.$el);
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
    events: {
        'click': function() {
          userId = this.model.get("user").id;
          FootballPool.URL.setHash("id", userId); 
          userQuery.equalTo("objectId", userId);
          userStatsCollection.query.matchesQuery("user", userQuery);
          userStatsCollection.fetch(fetchBlock);
        }
    },
    render: function() {
      var html = rowTemplate(this.model.toJSON());
      this.setElement( $(html) );
      return this;
    }
});

// get users

var userQuery = new Parse.Query("User");
userQuery.equalTo("robot", false);
userQuery.ascending("firstName");

// get user picks

var userStatsCollection = FootballPool.Data.getCollection("UserStats");
userStatsCollection.query.equalTo("season", season);
userStatsCollection.query.include("user");
userStatsCollection.query.matchesQuery("user", userQuery);
userStatsCollection.comparator = function(object) {
  return object.get("user").get("firstName");
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
      object.set({"moneyTotal": moneyTotal * (pot * potFactor)});  

    });
    var tableView = new TableView({collection: collection});   
    $("#loading-indicator").fadeOut(); 
  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
};

userStatsCollection.fetch(fetchBlock);



var chart;
$(document).ready(function() {
    
    // Radialize the colors
    Highcharts.getOptions().colors = $.map(Highcharts.getOptions().colors, function(color) {
        return {
            radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    });
    
    // Build the chart
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: 'Browser market shares at a specific website, 2010'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage}%</b>',
            percentageDecimals: 1
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    formatter: function() {
                        return '<b>'+ this.point.name +'</b>: '+ this.percentage +' %';
                    }
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Browser share',
            data: [
                ['Wins',   45.0],
                ['Losses', 26.8]
            ]
        }]
    });
});






