////////////////////////////////////////////////////////////////////////////////
// BACKGROUND SCRIPT
// Update the user's blacklist every 6 hours.
////////////////////////////////////////////////////////////////////////////////

chrome.alarms.create('updateBlacklist', {delayInMinutes: 1, periodInMinutes: 1});

// chrome.alarms.onAlarm.addListener(function() {
//   console.log('Alarm initiated!');
//   updateBlacklist();
// });
