Y.use('squarespace-image-loader', 'squarespace-gallery-stacked', 'history-hash', function(Y) {
  Y.on('domready', function() {


    // center align dropdown menus
    Y.all('#topNav .subnav').each( function(n){
      n.setStyle('marginLeft', -(parseInt(n.getComputedStyle('width'),10)/2) + 'px' );
    });

    
    body = Y.one('body');
    bodyWidth = parseInt(body.getComputedStyle('width'),10);


    // Load hero image
    var heroImage = Y.one('#bannerImage img[data-image]');
    if (bodyWidth >= 800) {
      new Y.Squarespace.Loader({
        img:heroImage
      });
    } else {
      Y.one('#bannerImage').setStyle('height', Y.one('#header').getComputedStyle('height'));
      new Y.Squarespace.Loader({
        img:heroImage
      });
    }
    

    Y.on('resize', function() {
      bodyWidth = parseInt(body.getComputedStyle('width'),10);
      if (bodyWidth >= 800) {
        Y.one('#bannerImage').setStyle('height', Static.SQUARESPACE_CONTEXT.tweakJSON['@bannerImageHeight']);
        if (heroImage) {
          heroImage.fire('refresh');
        }
        
      } else {
        Y.one('#bannerImage').setStyle('height', Y.one('#header').getComputedStyle('height'));
        if (heroImage) {
          heroImage.fire('refresh');
        }
      }
      
    });


    // SIDEBAR min-height set

    function setPageHeight() {
      var sidebarHeight;
      if (Y.one('#sidebar')) {
        sidebarHeight = Y.one('#sidebar').getComputedStyle('height');
      }
      if (sidebarHeight) {
        Y.one('#page').setStyle('minHeight', sidebarHeight);
      }
    }

    // run on page load
    setPageHeight();

    // run when sidebar width is tweaked
    if (Y.Squarespace.Management) {
      Y.Squarespace.Management.on('tweak', function(f){
        if (f.getName() == '@blogSidebarWidth' ) {
          setPageHeight();
        }
      });
    }

    Y.one('#canvas').setStyle('opacity', 1);

    // Mobile Nav ///////////////////////////////////

     Y.one('#mobileMenuLink a').on('click', function(e){
       var mobileMenuHeight = parseInt(Y.one('#mobileNav .wrapper').get('offsetHeight'),10);
       if (Y.one('#mobileNav').hasClass('menu-open')) {
         new Y.Anim({ node: Y.one('#mobileNav'), to: { height: 0 }, duration: 0.5, easing: 'easeBoth' }).run();
         new Y.Anim({ node: Y.one('#bannerImage'), to: { top: 0 }, duration: 0.5, easing: 'easeBoth' }).run();
       } else {
         new Y.Anim({ node: Y.one('#mobileNav'), to: { height: mobileMenuHeight }, duration: 0.5, easing: 'easeBoth' }).run();
         new Y.Anim({ node: Y.one('#bannerImage'), to: { top: mobileMenuHeight }, duration: 0.5, easing: 'easeBoth' }).run();
       }
       
       Y.one('#mobileNav').toggleClass('menu-open');
     });
    

  
  });


  // GLOBAL FUNCTIONS

  var body, bodyWidth;

  function pageLoader() {

    if (window.location.hash) {

      // set active on projectPages
      Y.one('#page').addClass('page-open');

      // clear current active if appropriate
      if (Y.one('#projectPages .active-project')){
        Y.one('#projectPages .active-project').removeClass('active-project');
      }
    
      // set active page
      var activePage = '#page-' + window.location.hash.split('#')[1];
      Y.one(activePage).addClass('active-project');
      
      // set active thumb
      var activeThumb = '#thumb-' + window.location.hash.split('#')[1];
      Y.one(activeThumb).addClass('active-project');

      // run image loader on active project page images
      new Y.Squarespace.Loader({
        img: Y.all('#projectPages .active-project img[data-image]')
      });
    
    } else { // no url hash

      // clear active on projectPages
      Y.one('#page').removeClass('page-open');

      // remove active class from all project pages/thumbs
      Y.all('div.active-project').removeClass('active-project');

    }
  }

  function thumbClickHandler() {

    Y.one('#projectThumbs').delegate('click', function(e){

      // set active on projectPages
      Y.one('#page').addClass('page-open');

      // extract project ID from thumb id
      var projectId = e.currentTarget.getAttribute('id').split('thumb-')[1];
      
      // set project Id to url hash
      window.location.hash = '#' + projectId;
      
      // remove active class from all project pages/thumbs
      Y.all('div.active-project').removeClass('active-project');
      
      // set active class on target thumb
      e.currentTarget.addClass('active-project');
      
      // set active class on target page
      var activePage = '#page-' + projectId;
      Y.one(activePage).addClass('active-project');
      
      // run image loader on active project page images
      new Y.Squarespace.Loader({
        img: Y.all('#projectPages .active-project img[data-image]')
      });

      scrollToTop();
      
    }, 'div.project');

  }


  function scrollToTop() {
    var scrollNodes = Y.UA.gecko ? 'html' : 'body';
    new Y.Anim({ node: scrollNodes, to: { scroll: [0,0] }, duration: 0.2, easing: 'easeBoth' }).run();
  }

  function lazyOnResize(f,t) {
    var timer;
    Y.one('window').on('resize', function(e){
      if (timer) { timer.cancel(); }
      timer = Y.later(t, this, f);
    });
  }

});