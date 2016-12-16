/* storageController.js - useful functions to help manage blacklist in local storage
 * @Author: David Wayman - github.com/r3dcrosse
 * @CreatedOn: 12/14/16
 *
*/

var server = 'https://newsgate.herokuapp.com/dateFilter'; // Deployed server db

// Makes post request to server for new blacklisted URLs
var makePostReq = function(dateObj) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", server, true);

  //Send the proper header information along with the request
  xhr.setRequestHeader("Content-type", "application/json");

  xhr.onreadystatechange = function(data) { //Call a function when the state changes.
    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        // Request finished. Update the blacklist here.
        var data = JSON.parse(xhr.responseText);
        updateBlacklist(data, 'blackListedURLs');
    }
  };

  xhr.send(dateObj);
};

// Initialize local storage variables for black list
var initLocalStorage = function() {
  // Initialize storage containers
  chrome.storage.local.set({ 'blackListedURLs' : [] });
  chrome.storage.sync.set({ 'userGeneratedBlacklist' : [] });
  chrome.storage.sync.set({ 'whiteListedURLs' : [] });
  chrome.storage.sync.set({ // Set's default theme
    'theme':
      { 'background-color': 'red' }
    });

  // Fill blackListedURLs with data from server
  getLastUpdated();
};

// EVENT LISTENER FOR WHEN EXTENSION IS INSTALLED OR CHROME IS UPDATED
chrome.runtime.onInstalled.addListener(initLocalStorage); // Initializes local storage variables

////////////////////////////////////////////////////////////////////////////////
// UPDATE BLACK LIST - AKA BLACKLIST SETTER FUNCTION
// @input1: An array of new URL objects to append to current black list
// @input2: Name of blacklist to update
//          OPTIONS: 'blackListedURLs', 'userGeneratedBlacklist', or 'whiteListedURLs'
////////////////////////////////////////////////////////////////////////////////
var updateBlacklist = function(newURLs, blackListToUpdate) {
  if (blackListToUpdate === 'blackListedURLs') {
    getBlacklist(function(oldURLs) {
      combineBlackList(newURLs, oldURLs, blackListToUpdate);
    });
  } else if (blackListToUpdate === 'userGeneratedBlacklist') {
    getUserlist(function(oldURLs) {
      combineBlackList(newURLs, oldURLs, blackListToUpdate);
    });
  } else if (blackListToUpdate === 'whiteListedURLs') {
    getWhitelist(function(oldURLs) {
      combineBlackList(newURLs, oldURLs, blackListToUpdate);
    });
  } else {
    console.error('COULD NOT FIND BLACK LIST TO UPDATE');
  }
};

// Helper function for updateBlackList:
// Combines old and new blacklist and saves it to local storage on chrome
var combineBlackList = function(newURLs, oldURLs, blackListToUpdate) {
  var newListURLs = oldURLs.concat(newURLs);

  if (blackListToUpdate === 'blackListedURLs') {
    setBlacklistTo(newListURLs);
  } else if (blackListToUpdate === 'userGeneratedBlacklist') {
    setUserlistTo(newListURLs);
  } else if (blackListToUpdate === 'whiteListedURLs') {
    setWhitelistTo(newListURLs);
  } else {
    console.error('COULD NOT FIND BLACK LIST TO UPDATE');
  }
};

var addToWhitelist = function(urls) {
  
};

// Function to remove array of urls from userGeneratedBlacklist
// If not found in userlist, will add to whitelist
// Handles duplicates
// Enter an array of urls
// will remove a url listed as 'soundcloud.com'
var removeUrl = function(urls) {
  var addToWhitelist = true;
  var newList;

  // remove any urls in input
  urls = urls.filter(function(e, i) {
    return urls.indexOf(e) === i;
  });

  getUserlist(function(results) {
    newList = results;
    // Remove any duplicates in storage
    newList = newList.filter(function(e, i) {
      return newList.indexOf(e) === i;
    });
    // Remove any urls given from newList
    // If none are removed, will add to whitelist
    urls.forEach(function(url) {
      var pattern = new RegExp(url);
      newList.forEach(function(userlistUrl, index) {
        if (pattern.test(userlistUrl)) {
          addToWhitelist = false;
          newList.splice(index, 1);
        }
      });
    });
    // If not found, then need to add urls to whitelist
    // Add to whitelist no matter what
    // Only add unique elements not in whitelist
    if (addToWhitelist) {
      getWhitelist(function(results) {
        // Only add urls in array that are not already in whitelist
        var uniqueUrlsToAdd = [];
        urls.forEach(function(url) {
          if (results.indexOf(url) === -1) {
            uniqueUrlsToAdd.push(url);
          }
        })
        combineBlackList(uniqueUrlsToAdd, results, 'whiteListedURLs');
        console.log('Successfully updated to whitelist');
      });
    } else {
    // Set chrome storage to newList
      chrome.storage.sync.set({ 'userGeneratedBlacklist': newList }, function() {
        console.log('Successfully removed: ', urls);
        getUserlist((results) => {console.log('new list: ', results)});
      });
    }
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

// Gets last URL that was pulled from server
// and updates the list in local storage
var getLastUpdated = function() {
  chrome.storage.local.get('blackListedURLs', function(blackListedURLs) {
    if (blackListedURLs['blackListedURLs'].length === 0) {
      // send a post request for an arbitrary date before the extension was made
      var arbitraryDate = JSON.stringify({ date: "2012-12-21T00:57:22.959Z" });
      makePostReq(arbitraryDate);
    } else {
      // get last url in currentURLs
      var lastURLobj = currentURLs[currentURLs.length - 1];
      var lastURLdate = lastURLobj.createdAt;
      makePostReq({ date: lastURLdate });
    }
  });
};

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
    console.log('Successfully updated whiteListedURLs to: ', newWhitelistArray);
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
    console.log('Successfully updated userGeneratedBlacklist to: ', newUserlistArray);
    if (callback) {
      callback();
    }
  });
};

// setter for blacklist from server
var setBlacklistTo = function(newBlacklistArray) {
  chrome.storage.local.set({ 'blackListedURLs' : newBlacklistArray }, function() {
    console.log('Successfully updated blackListedURLs');
  });
};

////////////////////////////////////////////////////////////////////////////////
//  __    __   _______  __      .______    _______ .______          _______.
// |  |  |  | |   ____||  |     |   _  \  |   ____||   _  \        /       |
// |  |__|  | |  |__   |  |     |  |_)  | |  |__   |  |_)  |      |   (----`
// |   __   | |   __|  |  |     |   ___/  |   __|  |      /        \   \
// |  |  |  | |  |____ |  `----.|  |      |  |____ |  |\  \----.----)   |
// |__|  |__| |_______||_______|| _|      |_______|| _| `._____|_______/
////////////////////////////////////////////////////////////////////////////////
                                                                     
