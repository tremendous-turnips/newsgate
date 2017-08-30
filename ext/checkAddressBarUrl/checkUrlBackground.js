////////////////////////////////////////////////////////////////////////////////
// BACKGROUND SCRIPT
// Listens for page loading on all tabs and sends the tab (via
// checkUrlAddressContentScript.js) whether the address bar
// url is in the fake site list (but not in the user whitelist)
////////////////////////////////////////////////////////////////////////////////


// DISABLER /////////////////////////////////////////////////////////////////////////////
// Tells content scripts to not kick off process if in disabled state
/////////////////////////////////////////////////////////////////////////////////////////

chrome.tabs.onUpdated.addListener(function(tabid, loadInfo) {
  getDisabledState(function(isDisabled) {
    console.log(isDisabled);
    if (!isDisabled) {
      console.log('hi');
      checkTab();
    }
  });
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.disabled === 'give') {
    getDisabledState(function(isDisabled) {
      sendResponse({disabled: isDisabled});
    })
  }
  return true;
});


function checkTab () {
  console.log('WHY IS THIS BEING CALLED');
// Listen for any changes to a tab
  chrome.tabs.onUpdated.addListener(function listener2(loadTabId, loadChangeInfo) {
    // If it is a 'loading' change.
    if (loadChangeInfo.status === 'loading') {
      // Listen again for any changes to a tab
      chrome.tabs.onUpdated.addListener(function listener(completeTabId, completeChangeInfo) {
        // If the tabId is the same from earlier and it is a 'complete' change.
        if ( completeChangeInfo.status === 'complete' && loadTabId === completeTabId ) {
          // Get the url of this tab.
          chrome.tabs.get(completeTabId, function(tab) {
            var url = filterLinks(tab.url);
            // Grab data from blacklist, userlist and whitelist. Concat blacklist and userlist,
            // filter out data from the whitelist, and check (reduce) if the url is in the
            // resulting list. Send the result to the correct tab via checkUrlContentScript.
            getBlacklist(function(blackList) {
              getUserlist(function(userList) {
               getWhitelist(function(whiteList) {
                  chrome.tabs.sendMessage(completeTabId, userList.concat(blackList)
                    .filter(function(obj) {return whiteList.indexOf(obj) === -1;})
                    .reduce(function(pre, cur) {
                      return cur.url === url ? {fake: true, urlObj: cur} : pre;
                    }, {fake: false}));
                });
              });
            // Close the original listener to prevent duplicate responses.
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.onUpdated.removeListener(listener2);
            // allListeners.push(listener);
            });
          })
        };
      });
      // chrome.tabs.onUpdated.removeListener(listener2);
    };
  });
}


// function removeListener () {
//   for (var i = 0; i < allListeners.length; i++) {
//     chrome.tabs.removeListener(allListeners[i]);
//   }
//   allListeners = [];
// }
