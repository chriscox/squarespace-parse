// login

if (!FootballPool.User.isLoggedIn()) {
  FootballPool.URL.loginRedirect("setup-users");
} else if (!FootballPool.User.isAdministrator()) {
  window.location = "/not-found";
} 

// show loading...

$("#loading-indicator").fadeIn();

// get scope

var user = FootballPool.User.getCurrentUser();
var season = FootballPool.Utils.getCurrentSeason();
var week = parseInt(FootballPool.URL.getHash("week", FootballPool.Utils.getCurrentWeek()));

// user picks

var UserPick = Parse.Object.extend("UserPick");
var queryUserPicks = new Parse.Query(UserPick);
queryUserPicks.equalTo("season", season);
queryUserPicks.limit(1000);
var UserPickCollection = Parse.Collection.extend({
  model:UserPick,
  query:queryUserPicks
});
var userPickCollection = new UserPickCollection;


// get users

var User = Parse.Object.extend("User");
var UserCollection = Parse.Collection.extend({
  model: User
});
var userCollection = new UserCollection;
userCollection.comparator = function(object) {
  return object.get("firstName");
};

var userFetchBlock = {
  success: function(collection) {

    collection.each(function(object) {    

      var picks = new Array();

      userPickCollection.each(function(userPick){        
        if (userPick.get("user").id == object.id) {

          var week = userPick.get("week");
          var count = (picks["w" + week]) ? picks["w" + week] : 0;
          picks["w" + week] = count+=1
       
        }        
      });

      // get individual counts   
      
      object.set({"w1": (picks["w1"]) ? picks["w1"] : "0"});
      object.set({"w2": (picks["w2"]) ? picks["w2"] : "0"});
      object.set({"w2": (picks["w2"]) ? picks["w2"] : "0"});
      object.set({"w3": (picks["w3"]) ? picks["w3"] : "0"});
      object.set({"w4": (picks["w4"]) ? picks["w4"] : "0"});
      object.set({"w5": (picks["w5"]) ? picks["w5"] : "0"});
      object.set({"w6": (picks["w6"]) ? picks["w6"] : "0"});
      object.set({"w7": (picks["w7"]) ? picks["w7"] : "0"});
      object.set({"w8": (picks["w8"]) ? picks["w8"] : "0"});
      object.set({"w9": (picks["w9"]) ? picks["w9"] : "0"});
      object.set({"w10": (picks["w10"]) ? picks["w10"] : "0"});
      object.set({"w11": (picks["w11"]) ? picks["w11"] : "0"});
      object.set({"w12": (picks["w12"]) ? picks["w12"] : "0"});
      object.set({"w13": (picks["w13"]) ? picks["w13"] : "0"});
      object.set({"w14": (picks["w14"]) ? picks["w14"] : "0"});
      object.set({"w15": (picks["w15"]) ? picks["w15"] : "0"});
      object.set({"w16": (picks["w16"]) ? picks["w16"] : "0"});
      object.set({"w17": (picks["w17"]) ? picks["w17"] : "0"});

      object.set({"playerIndex": collection.indexOf(object)+1});
      object.set({"userId": object.id});

    });

    gridView = new GridView({collection:collection});
    $("#loading-indicator").fadeOut();

  },
  error: function(collection, error) {
    $("#loading-indicator").fadeOut();
  }
}

var GridView = Parse.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');               
    this.render();
  },

  render: function(){
    // console.log(JSON.stringify(this.collection.toJSON()));

    var nameTemplate = kendo.template($("#nameTemplate").html());
    var countTemplate = kendo.template($("#countTemplate").html());

    $("#setup-users-grid").kendoGrid({
      selectable: "multiple cell",
      columns: [
        {title:"#", width:30, field:"playerIndex"},
        {title:"Player", template: nameTemplate({firstName:"${firstName}", lastName:"${lastName}"})},
        {title:"1", width:30, template: countTemplate({userId:"${userId}", week:"1", count:"${w1}"})},
        {title:"2", width:30, template: countTemplate({userId:"${userId}", week:"2", count:"${w2}"})},
        {title:"3", width:30, template: countTemplate({userId:"${userId}", week:"3", count:"${w3}"})},
        {title:"4", width:30, template: countTemplate({userId:"${userId}", week:"4", count:"${w4}"})},
        {title:"5", width:30, template: countTemplate({userId:"${userId}", week:"5", count:"${w5}"})},
        {title:"6", width:30, template: countTemplate({userId:"${userId}", week:"6", count:"${w6}"})},
        {title:"7", width:30, template: countTemplate({userId:"${userId}", week:"7", count:"${w7}"})},
        {title:"8", width:30, template: countTemplate({userId:"${userId}", week:"8", count:"${w8}"})},
        {title:"9", width:30, template: countTemplate({userId:"${userId}", week:"9", count:"${w9}"})},
        {title:"10", width:30, template: countTemplate({userId:"${userId}", week:"10", count:"${w10}"})},
        {title:"11", width:30, template: countTemplate({userId:"${userId}", week:"11", count:"${w11}"})},
        {title:"12", width:30, template: countTemplate({userId:"${userId}", week:"12", count:"${w12}"})},
        {title:"13", width:30, template: countTemplate({userId:"${userId}", week:"13", count:"${w13}"})},
        {title:"14", width:30, template: countTemplate({userId:"${userId}", week:"14", count:"${w14}"})},
        {title:"15", width:30, template: countTemplate({userId:"${userId}", week:"15", count:"${w15}"})},
        {title:"16", width:30, template: countTemplate({userId:"${userId}", week:"16", count:"${w16}"})},
        {title:"17", width:30, template: countTemplate({userId:"${userId}", week:"17", count:"${w17}"})},
      ],
      dataSource: {
        data: this.collection.toJSON()            
      }
    });

    return this;

  }
});


// fetch data

userPickCollection.fetch({
  success: function(userPicks){

    userCollection.fetch(userFetchBlock);

  }
});


