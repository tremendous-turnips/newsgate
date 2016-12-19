var setAlarm = function(name, min, cb) {
  // Create alarm and ensure there are no other outstanding alarms
  chrome.alarms.clear('disableAlarm', function() {
    chrome.alarms.create(name, { delayInMinutes: min });
    if (cb) {
      cb();
    }    
  });
}

// Add listener to alarm
chrome.alarms.onAlarm.addListener(function alarmListener(alarm) {
  if (alarm.name === 'disableAlarm') {
    setDisabledState(false, function() {
      console.log('Reverted back to enabled');
      chrome.extension.getBackgroundPage().chrome.browserAction.setIcon({ path: "assets/turnip-white.png" });
    });
  }
});
