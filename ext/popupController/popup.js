$(document).ready(function() {
  // hide enable / disable based on state of disable
  chrome.extension.getBackgroundPage().getDisabledState(function(isDisabled) {
    if (isDisabled) {
      $('#disable').hide();
    } else {
      $('#enable').hide();
    }
  });

  // Navigate to settings page in next tab
  $('body').on('click', '#settings', function(){
    chrome.tabs.query({
      active: true
    }, tabs => {
      let index = tabs[0].index;
      chrome.tabs.create({
        url: $(this).attr('href'),
        index: index + 1
      });
    });
    return false;
  });

  // Add current url in active tab to userlist
  $('body').on('click', '#addToBlacklist', function() {
    getCurrentTabUrl(function(url) {

      // Background functions are available with chrome.extension.getBackgroundPage()
      var domain = chrome.extension.getBackgroundPage().filterLinks(url);

      // Update userGeneratedBlacklist only on unique urls
      chrome.extension.getBackgroundPage().getUserlist(function(results) {
        var pattern = new RegExp(domain);
        var unique = true;
        results.forEach(function(url) {
          if (pattern.test(url)) {
            unique = false;
          }
        });
        if (unique) {
          chrome.extension.getBackgroundPage().updateList([domain], 'userGeneratedBlacklist');
        }
      });
    });
  });

  $('body').on('click', '#removeFromBlacklist', function(){
    getCurrentTabUrl(function(url) {
      var domain = chrome.extension.getBackgroundPage().filterLinks(url);
      chrome.extension.getBackgroundPage().unBlacklist(domain);
    });
  });

  $('body').on('click', '#disable', function(){
    toggleDisable();
    // image needs to be exactly 16x16
    chrome.extension.getBackgroundPage().chrome.browserAction.setIcon({
      path: "assets/icon-disabled.png"
    });
  });


  $('body').on('click', '#enable', function(){
    toggleDisable();
    // image needs to be exactly 16x16
    chrome.extension.getBackgroundPage().chrome.browserAction.setIcon({
      path: "assets/turnip-white.png"
    });
  });

    //POLLING FOR STATS

  chrome.extension.getBackgroundPage().getDomainCountData(function(count) {
    $('.stats').text(`Fake Domains: ${count}`)
  });



});

function getCurrentTabUrl(callback) {
// Query filter to be passed to chrome.tabs.query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // One tab available in active window array
    var tab = tabs[0];
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // tabs is required to see info for other tabs
    callback(url);
  });
};


function toggleDisable() {
  $('#disable').toggle();
  $('#enable').toggle();
  // change state to disabled / enabled
  chrome.extension.getBackgroundPage().toggleDisabledState();
};