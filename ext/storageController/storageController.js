/* storageController.js - useful functions to help manage blacklist in storage
 * @Author: David Wayman - github.com/r3dcrosse
 * @CreatedOn: 12/14/16
*/
////////////////////////////////////////////////////////////////////////////////
// SERVER info for blacklist database & post request function
////////////////////////////////////////////////////////////////////////////////
var server = 'https://newsgate.herokuapp.com/dateFilter'; // Deployed server db

// Makes post request to server for new blacklisted URLs
var updateBlacklistRequest = function(dateObj) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", server, true);

  //Send header information about dateObj along with the request
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xhr.onreadystatechange = function(data) { //Call a function when the state changes.
    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
      // Request finished. Update the blacklist here.
      var data = JSON.parse(xhr.responseText);
      updateList(data, 'blackListedURLs', function() {
        chrome.browserAction.setIcon({ path: "assets/turnip-white.png" });
      });
    }
  };
  xhr.send(dateObj);
};

////////////////////////////////////////////////////////////////////////////////
// UPDATE BLACKLIST IN USER'S LOCAL STORAGE
////////////////////////////////////////////////////////////////////////////////
var updateBlacklist = function() {
  chrome.storage.local.get('blackListedURLs', function(response) {
    if (response.blackListedURLs.length === 0) {
      // send a post request for an arbitrary date before the extension was made
      var arbitraryDate = JSON.stringify({ date: "2012-12-21T00:57:22.959Z" });
      updateBlacklistRequest(arbitraryDate);
    } else {
      // Gets last URL that was pulled from server
      // get last url in currentURLs
      var lastURLobj = response.blackListedURLs[response.blackListedURLs.length - 1];
      var lastURLdate = lastURLobj.createdAt;
      updateBlacklistRequest({ date: lastURLdate });
    }
  });
};


////////////////////////////////////////////////////////////////////////////////
// CHROME LOCAL & SYNC STORAGE INITIALIZATION
////////////////////////////////////////////////////////////////////////////////
// Initialize local storage variables for black list
var initLocalStorage = function() {
  // Initialize storage containers
  chrome.storage.local.set({ 'blackListedURLs' : [] });
  chrome.storage.sync.set({ 'userGeneratedBlacklist' : [] });
  chrome.storage.sync.set({ 'whiteListedURLs' : [] });

  // Set the default theme -- this is also set in themes.js
  chrome.storage.sync.set({
    'theme': {
      fake:   'defaultTheme-fake',
      satire: 'defaultTheme-satire',
      biased: 'defaultTheme-biased',
      themeName: 'default'
    }
  });
  chrome.storage.sync.set({ 'disabled' : false });
  // Fill blackListedURLs with data from server
  updateBlacklist();
};

////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENER FOR WHEN THE EXTENSION IS INSTALLED OR CHROME IS UPDATED
chrome.runtime.onInstalled.addListener(initLocalStorage); // Initializes local storage variables
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// UPDATE LISTS - AKA LIST SETTER FUNCTION
// @input1: An array of new URL objects to append to the specified list
// @input2: Name of list to update
//    OPTIONS: 'blackListedURLs', 'userGeneratedBlacklist', or 'whiteListedURLs'
////////////////////////////////////////////////////////////////////////////////
var updateList = function(newURLs, listToUpdate, callback) {
  if (listToUpdate === 'blackListedURLs') {
    getBlacklist(function(oldURLs) {
      combineList(newURLs, oldURLs, listToUpdate, callback);
    });
  } else if (listToUpdate === 'userGeneratedBlacklist') {
    getUserlist(function(oldURLs) {
      combineList(newURLs, oldURLs, listToUpdate, callback);
    });
  } else if (listToUpdate === 'whiteListedURLs') {
    getWhitelist(function(oldURLs) {
      combineList(newURLs, oldURLs, listToUpdate, callback);
    });
  } else {
    console.error('COULD NOT FIND BLACK LIST TO UPDATE');
  }
};

////////////////////////////////////////////////////////////////////////////////
//  __    __   _______  __      .______    _______ .______          _______.
// |  |  |  | |   ____||  |     |   _  \  |   ____||   _  \        /       |
// |  |__|  | |  |__   |  |     |  |_)  | |  |__   |  |_)  |      |   (----`
// |   __   | |   __|  |  |     |   ___/  |   __|  |      /        \   \
// |  |  |  | |  |____ |  `----.|  |      |  |____ |  |\  \----.----)   |
// |__|  |__| |_______||_______|| _|      |_______|| _| `._____|_______/
////////////////////////////////////////////////////////////////////////////////

// Helper function for updateList
// Combines old and new blacklist and saves it to local storage on chrome
var combineList = function(newURLs, oldURLs, blackListToUpdate, callback) {
  var newListURLs = oldURLs.concat(newURLs);

  if (blackListToUpdate === 'blackListedURLs') {
    setBlacklistTo(newListURLs, callback);
  } else if (blackListToUpdate === 'userGeneratedBlacklist') {
    setUserlistTo(newListURLs, callback);
  } else if (blackListToUpdate === 'whiteListedURLs') {
    setWhitelistTo(newListURLs, callback);
  } else {
    console.error('COULD NOT FIND BLACK LIST TO UPDATE');
  }
};

// Helper function to add a url string to the white list
var addToWhitelist = function(url, cb) {
  getWhitelist(function(results) {
    results = _.uniq(results);
    combineList([url], results, 'whiteListedURLs');
    cb();
  });
};

// Function to remove url string from user list and adds to white list
// Handles duplicates and filters to just domain name
var unBlacklist = function(url, cb) {
  url = filterLinks(url); // Strips 'https://' off url
  getUserlist(function(results) {
    results = _.uniq(results);
    results.forEach(function(result, index) {
      if (url === result) {
        results.splice(index, 1);
      }
    });
    setUserlistTo(results, function() {
      addToWhitelist(url,cb);
    });
  });
};

// Toggles disabledState, does callback if any
// @input1: (optional) callback
var toggleDisabledState = function(callback) {
  getDisabledState(function(isDisabled) {
    setDisabledState(!isDisabled, function() {
      if (callback) {
        callback();
      }
    });
  });
};

////////////////////////////////////////////////////////////////////////////////
//   _______  _______ .___________.___________. _______ .______          _______.
//  /  _____||   ____||           |           ||   ____||   _  \        /       |
// |  |  __  |  |__   `---|  |----`---|  |----`|  |__   |  |_)  |      |   (----`
// |  | |_ | |   __|      |  |        |  |     |   __|  |      /        \   \
// |  |__| | |  |____     |  |        |  |     |  |____ |  |\  \----.----)   |
//  \______| |_______|    |__|        |__|     |_______|| _| `._____|_______/
//
////////////////////////////////////////////////////////////////////////////////

// Getter for server blacklist
var getBlacklist = function(callback) {
  chrome.storage.local.get('blackListedURLs', function(localStorage) {
    var blacklist = localStorage['blackListedURLs'];
    callback(blacklist);
  });
};

// Getter for user generated blacklist
var getUserlist = function(callback) {
  chrome.storage.sync.get('userGeneratedBlacklist', function(syncStore) {
    var userBlacklist = syncStore['userGeneratedBlacklist'];
    callback(userBlacklist);
  });
};

// Getter for whitelist
var getWhitelist = function(callback) {
  chrome.storage.sync.get('whiteListedURLs', function(syncStore) {
    var whitelist = syncStore['whiteListedURLs'];
    callback(whitelist);
  });
};

// Gets disabled setting re DOM rendering and banner
var getDisabledState = function(callback) {
  chrome.storage.sync.get('disabled', function(result) {
    callback(result.disabled);
  });
};

var getDomainCountData = function(callback) {
  chrome.storage.sync.get('domainCount', function(result) {
    callback(result.domainCount);
  });
};

var getTheme = function(callback) {
  chrome.storage.sync.get('theme', function(syncStore) {
    callback(syncStore['theme']);
  });
}
////////////////////////////////////////////////////////////////////////////////
//      _______. _______ .___________.___________. _______ .______          _______.
//     /       ||   ____||           |           ||   ____||   _  \        /       |
//    |   (----`|  |__   `---|  |----`---|  |----`|  |__   |  |_)  |      |   (----`
//     \   \    |   __|      |  |        |  |     |   __|  |      /        \   \
// .----)   |   |  |____     |  |        |  |     |  |____ |  |\  \----.----)   |
// |_______/    |_______|    |__|        |__|     |_______|| _| `._____|_______/
////////////////////////////////////////////////////////////////////////////////

// setter for white list to be everything in newWhitelistArray
// @input1: An array that will be the new white list
// @input2: (optional) callback with no arguments to be executed after storage is set
var setWhitelistTo = function(newWhitelistArray, callback) {
  chrome.storage.sync.set({ 'whiteListedURLs' : newWhitelistArray }, function() {
    if (callback) {
      callback();
    }
  });
};

// setter for user generated blacklist
// @input1: An array that will be the new white list
// @input2: (optional) callback with no arguments to be executed after storage is set
var setUserlistTo = function(newUserlistArray, callback) {
  chrome.storage.sync.set({ 'userGeneratedBlacklist' : newUserlistArray }, function() {
    console.log('Successfully updated blackListedURLs in local storage to ', newUserlistArray);

    if (callback) {
      callback();
    }
  });
};

// setter for blacklist from server
// @input1: An array that will be the new white list
var setBlacklistTo = function(newBlacklistArray, callback) {
  chrome.storage.local.set({ 'blackListedURLs' : newBlacklistArray }, function() {
    console.log('Successfully updated blackListedURLs in local storage');
    if (callback) {
      callback();
    }
  });
};

// Sets disabled setting re DOM rendering and banner
// @input1: (optional) callback
var setDisabledState = function(boolean, callback) {
  chrome.storage.sync.set({ 'disabled' : boolean });
  if (callback) {
    callback();
  }
};

// Sets theme object in sync storage
// @input1: Theme object that will be the theme
var setThemeTo = function(theme, cb) {
  chrome.storage.sync.set(theme, function() {
    if (cb) {
      cb();
    }
  });
};

var setDomainCountDataTo = function(domainCount) {
  chrome.storage.sync.set({"domainCount": domainCount }, function (){
  })
}
