Overview
--------
This is a [Squarespace](http://www.squarespace.com) V6 template I created that uses [Parse.com](http://parse.com) as the backend database. Since Squarespace is a hosted platform, site owners and developers do not have access to the backend server code. Therefore, creating database-driven apps have been notorisouly difficult due to cross-domain issues. 

Parse implements [Cross-origin resource sharing (CORS)](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing), which allows interaction with a databse regardless of the domain.  

So… I created this site to explore what's possible.

Demo
----

Example Site: [Mike's NFL Pool](http://mikespool.squarespace.com/games/)


[Mikes NFL Pool](http://mikespool.squarespace.com) is a fun football pool site I created for my father-in-law. You can view the site or even login as a guest user and play along.

Quick Summary of Steps
----------------------
1. Be sure to have your site template up and running using the [Squarespace Development Kit instructions](http://developers.squarespace.com/2-step-signup/).
2. Create an account as [Parse.com](http://parse.com). They provide a free basic plan. Once you sign up, create a new app and fill in the appropriate information.
3. Use Parse's online Data Browser to build your database. There are more advanced methods you can use later once you're more familiar with the setup.
4. Download the Parse [Javascript API](http://parse.com/docs/downloads), and add required files to your Squarespace site. Review their [Javascript API](http://parse.com/docs/js_guide) guide 
5. Include other required files. [jQuery](http://jquery.com/) and [underscore.js](http://underscorejs.org/)
6. Utilize the parse-backbone framework to interact with your new database.

Javascript Dependancies
-----------------------
1. [jQuery](http://jquery.com/)
2. [Parse.com](http://parse.com)
3. [Underscore.js](http://underscorejs.org/)

Further Help
------------
Visit the [Squarespace Answers](http://answers.squarespace.com) guide for further information. I created a specific answer regarding this demo in that guide available [here](http://answers.squarespace.com/questions/171/how-do-i-connect-a-developer-site-to-a-database).



	
