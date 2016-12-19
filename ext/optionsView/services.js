services = angular.module('options.services', []);

services.factory('Blacklist', function() {

});


services.factory('Themes', function() {

});


services.factory('General', function() {
  
  // Disable for x minutes
  var disable = function(min, cb) {

    // If chose enabled, then change icon to enabled, set state to enabled and clear all if any alarms
    if (min === 0) {
      chrome.extension.getBackgroundPage().chrome.browserAction.setIcon({ path: "assets/turnip-white.png" },
        () => {
          chrome.extension.getBackgroundPage().setDisabledState(false, () => {
          chrome.extension.getBackgroundPage().chrome.alarms.clear('disableAlarm', () => {
            if (cb) {
              cb();
            }
          });
        });      
      });
    } else {
      
      // If chose a disabled time period, then set state to disabled and set an alarm
      chrome.extension.getBackgroundPage().chrome.browserAction.setIcon({ path: "assets/icon-disabled.png" }, 
        () => {
          chrome.extension.getBackgroundPage().setDisabledState(true, () => {  
            // Set alarm at background level
            chrome.extension.getBackgroundPage().setAlarm('disableAlarm', min, cb);
          });  
        });
    } 
  }

  return {
    disable: disable
  };

});
