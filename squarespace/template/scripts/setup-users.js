// login

if (!FootballPool.User.isLoggedIn()) {
  FootballPool.URL.loginRedirect("setup-users");
} else if (!FootballPool.User.isAdministrator()) {
  window.location = "/not-found";
} 

// show loading...

$("#loading-indicator").fadeIn();

var headerTemplate = _.template("<thead class=''>" +
  "<tr>" +
    "<th rowspan='2' class='horz-center'>#</th>" +
    "<th>Name</th>" +
    "<th class='horz-center'>Week-<%= week %> Pick Count</th>" +
    "<th class='horz-center'></th>" +
  "</tr>" +
  "</thead>"
);

var rowTemplate = _.template("<tr>"+
     "<td class='horz-center'><%= playerIndex %></td>" +
     "<td class=''><%= name %></td>"+
     "<td class='horz-center'><%= count %></td>"+
     "<td class='login-user'><a href='/user-picks/?userId=<%= userId %>#week=<%= week %>'>[ Log In As User ]</a></td>"+
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
      $("#setup-users-grid").html('');
      this.renderHeader();  
      this.collection.each(this.renderOne);
      $("#setup-users-grid").append(this.$el);
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
      var html = rowTemplate(this.model.toJSON());
      this.setElement( $(html) );
      return this;
    }
});

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));

// get users

var userQuery = new Parse.Query("User");
userQuery.ascending("firstName");

// get user picks

var userPickCollection = FootballPool.Data.getCollection("UserPick");
userPickCollection.query.equalTo("season", season);
userPickCollection.query.equalTo("week", week);
userPickCollection.query.include("user");
userPickCollection.query.limit(1000);
userPickCollection.query.matchesQuery("user", userQuery);
userPickCollection.comparator = function(object) {
  return object.get("user").get("firstName");
};

var fetchBlock = {
  success: function(collection) {

    // create indexed array of users by Id

    collection.each(function(object) {
      object.set("userId", object.get("user").id);
    });

    var arr = _.toArray(collection);
    var attr = _.pluck(arr, 'attributes');
    var usersById = _.groupBy(attr, 'userId');

    // show each user

    userQuery.collection().fetch({
      success: function(users) {
        users.each(function(object){

          if (usersById[object.id] != null) {
            object.set("count", usersById[object.id].length);
          } else {
            object.set("count", 0);
          }
          object.set("name", object.get("firstName") + " " + object.get("lastName").substring(0,1));
          object.set({"playerIndex": users.indexOf(object)+1});
          object.set({"userId": object.id});
        });

        var tableView = new TableView({collection: users});   
        $("#loading-indicator").fadeOut(); 
      }, 
      error:function(users, error) {
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
      userPickCollection.query.equalTo("week", week);
      userPickCollection.fetch(fetchBlock);
    }
  }
});

var weekList = new WeekList();
$("#weekPicker").append(weekList.el);
