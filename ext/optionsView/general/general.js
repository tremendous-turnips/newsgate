general = angular.module('options.general', []);

general.controller('generalController', function($scope, General) {

  $scope.remainingTimeLeft = {};
  $scope.remainingTimeLeft.data = 'Currently enabled'; 

  // Watch for changes in model
  $scope.$watch('minutes', function(minutes) {
    if (minutes !== undefined) {
      General.disable(minutes);
    }
  })

  var getTimeLeft = function() {
    chrome.extension.getBackgroundPage().getDisabledState(function(isDisabled) {
      chrome.extension.getBackgroundPage().chrome.alarms.getAll(function(alarms) {

        // Get the disableAlarm
        var disableAlarm = null;
        alarms.forEach(function(alarm) {
          if (alarm.name === 'disableAlarm') {
            disableAlarm = alarm;
          }
        })

        // Check if currently disabled or exists a disabledAlarm
        if (disableAlarm || isDisabled) {
          var d = new Date();
          var ms = d.getTime();
          
          // Set timeLeft to arbitrarily large time if we know in disabled state but no alarm has been set
          var timeLeft = disableAlarm ? (disableAlarm.scheduledTime - ms) / 60000 : 1000000; 
          
          // Display to user 'Disabled indefinitely' if either selected through settings or through popup
          if (timeLeft > 60) {
            $scope.remainingTimeLeft.data = 'Disabled indefinitely';
          } else {
            // Display to user remaining disabled time if there exists an alarm of less then 60 minutes
            timeLeft = parseFloat(Math.round(timeLeft * 100) / 100).toFixed(0); 
            $scope.remainingTimeLeft.data = `Fake news on the prowl for ${timeLeft} more minutes`;;
          }
        } else {
          $scope.remainingTimeLeft.data = 'Currently enabled';
        }
      }); 
    });  
  }

  getTimeLeft();
  // Poll for every half minute for live update on disabled time left
  setInterval(function() { getTimeLeft(); $scope.$apply() }, 500);
});
