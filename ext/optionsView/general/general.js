general = angular.module('options.general', []);

general.controller('generalController', function($scope, General) {

  $scope.remainingTimeLeft = {};
  $scope.remainingTimeLeft.data = 'Currently enabled'; 

  // Watch for changes in model
  $scope.$watch('minutes', function(minutes) {
    console.log('disable in controller called', minutes);
    if (minutes !== undefined) {
      General.disable(minutes, getTimeLeft.bind(this));
    }
  })

  var getTimeLeft = function() {
    console.log('getTimeLeft called');
    chrome.extension.getBackgroundPage().chrome.alarms.getAll(function(alarms) {
      if (alarms.length > 0) {
        var d = new Date();
        var ms = d.getTime();
        
        var timeLeft = (alarms[0].scheduledTime - ms) / 60000; 
        if (timeLeft > 60) {
          $scope.remainingTimeLeft.data = 'Disabled indefinitely'
        } else {
          timeLeft = parseFloat(Math.round(timeLeft * 100) / 100).toFixed(0); 
          $scope.remainingTimeLeft.data = `Fake news on the prowl for ${timeLeft} more minutes`;;
        }
      }
    }); 
  }

  getTimeLeft();
  // Poll for every half minute for live update on disabled time left
  setInterval(function() { getTimeLeft(); $scope.$apply() }, 30000);
});
