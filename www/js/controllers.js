angular.module('DeviceSimulator')

.controller('HomeCtrl', function($scope, $state) {

  $scope.device = JSON.parse(localStorage.getItem('device'));

  if(!$scope.device) {
    $state.go('tab.associate');
  }

  $scope.consumeShot = function () {
    console.log('Shot consumed');
    $scope.device.consumedShots++;
  };

  $scope.refill = function () {
    console.log('Refill');
    $scope.device.consumedShots = 0;
  };
})

.controller('AssociateCtrl', function($scope, $state, API) {
  $scope.device = {};

  ionic.Platform.ready(function(){
    $scope.device.serialNumber = ionic.Platform.device().serial ? ionic.Platform.device().serial : getRandomSerialNumber();
  });

  $scope.associateDevice = function () {
    API.post('/devices', { serial: $scope.device.serialNumber })
      .then(function (response) {
        var device = response.data.device;
        delete $scope.device.serialNumber;
        $scope.device.associationCode = device.associationCode;

        API.put('/devices/' + device.id + '/associate', {device: $scope.device})
          .then(function (response) {
            localStorage.setItem('device', JSON.stringify(response.data.device));
            $state.go('tab.home');
          }, function (err) {
            alert(err);
          });
      }, function (err) {
        alert(err);
      });
  }

  function getRandomSerialNumber() {
    var serialNumber = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for( var i=0; i < 11; i++ ) {
      serialNumber += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return serialNumber;
  }
})

.controller('InfoCtrl', function($scope, $state) {
  $scope.device = JSON.parse(localStorage.getItem('device'));

  if(!$scope.device) {
    $state.go('tab.associate');
  }
});