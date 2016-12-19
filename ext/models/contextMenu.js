/* contextMenu.js - Initializing/functionality of the context menus.
 * @Author: Evan Chang - github.com/MistrBrown
 * @CreatedOn: 12/15/16
*/

///////////////////////////////////////////////////////////////////////////
// WHITELIST CONTEXT MENU
///////////////////////////////////////////////////////////////////////////

//LISTENS FOR HOVERED ELEMENTS. CHANGING CONTEXT MENU IF HOVERED ELEMENT IS IN WHITELIST
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.text === 'sending element') {
    // console.log(request.href);
    // var domain = filterLinks(request.href) === 'google.com' ? filterGoogleDomain(request.href) : filterLinks(request.href);
    var domain = filterLinks(request.href);
    getWhitelist(function(whitelist) {
      if (_.contains(whitelist, domain)) {
        chrome.contextMenus.update("menu", {'title': 'Remove from Whitelist', 'onclick':removeUrlWhiteListParse});
      } else {
        chrome.contextMenus.update("menu", {'title': 'Add to Whitelist' , 'onclick':addUrlWhiteListParse});
      }
    });
    sendResponse({text: 'yolo'});
  }
  return true;
});

function clickHandler() {
  console.log('OOPS');
};

// FUNCTION TO REMOVE FROM WHITELIST ON CONTEXTMENU CLICK
function removeUrlWhiteListParse(word) {
  var domain = filterLinks(word.linkUrl) === 'google.com' ? filterGoogleDomain(word.linkUrl) : filterLinks(word.linkUrl);
  getWhitelist(function(whitelist) {
    setWhitelistTo(_.filter(whitelist, item => {
      return item !== domain;
    }), function () {
      //THIS IS WHERE ID CALL RENDER AGAIN
      refreshRender();
    });
  });
};


// FUNCTION TO ADD TO WHITELIST ON CONTEXTMENU CLICK

function addUrlWhiteListParse(word) {
  var domain = filterLinks(word.linkUrl) === 'google.com' ? filterGoogleDomain(word.linkUrl) : filterLinks(word.linkUrl);
  unBlacklist(domain, function() {refreshRender()});
};


// REFRESH RENDERING AFTER ADDING/REMOVING FROM WHITELIST
// HACK TO REFRESH AFTER WHITELIST UPDATED
function refreshRender() {
  // IF REMOVE
  setTimeout(function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {refresh: "refresh"}, function(response) {
      });
    });
  }, 500);
};

//HELPER FUNCTION TO FILTER GOOGLE SEARCH CHANGING HREFS (WHY!?!?)
function filterGoogleDomain(unfilteredLink) {
  var domain = unfilteredLink.split('url=');
  domain = filterLinks(domain[1]);
  domain = domain.split('%')[0];
  return domain;
};


// ADD THE CONTEXT MENU ON INSTALL
var menu;

chrome.runtime.onInstalled.addListener(function() {
  var context = "link";
  var title = "Add to Whitelist";
  chrome.contextMenus.create({
    "id": "menu",
    "title": title,
    "contexts": [context],
    "onclick" : clickHandler
  });
});


///////////////////////////////////////////////////////////////////////////
// BLACKLIST CONTEXT MENU
///////////////////////////////////////////////////////////////////////////
// CONTEXT MENU FOR ADDING INTO BLACKLIST
function contextMenuBlacklist(word) {
  var domain = filterLinks(word.linkUrl) === 'google.com' ? filterGoogleDomain(word.linkUrl) : filterLinks(word.linkUrl);
  getUserlist(function(blacklist) {
    if (_.contains(blacklist, domain)) {
      return;
    } else {
      getWhitelist(function(whitelist) {
        if (_.contains(whitelist, domain)) {
          setWhitelistTo(_.filter(whitelist, (item) => {
            return item !== domain;
          }), function(){
            refreshRender();
          });
        } else {
          updateList([domain], 'userGeneratedBlacklist');
          refreshRender();
        }
      });
      refreshRender();
    }
  })
}

// INSTALL ADD TO BLACKLIST CONTEXTMENU
chrome.runtime.onInstalled.addListener(function() {
  var context = "link";
  var title = "Add to Blacklist";
  chrome.contextMenus.create({
    "id": "blacklistMenu",
    "title": title,
    "contexts": [context],
    "onclick" : contextMenuBlacklist
  });
});
