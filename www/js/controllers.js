angular.module('DeviceSimulator')

.controller('HomeCtrl', function($scope, $state, MQTT) {

  $scope.device = JSON.parse(localStorage.getItem('device'));

  if(!$scope.device) {
    $state.go('tab.associate');
  }

  $scope.connected = false;
  $scope.connecting = true;

  MQTT.connect($scope.device)
    .then(function () {
      $scope.connected = true;
    }, function (err) {
      console.log('Error trying to connect');
    })
    .finally(function () {
      $scope.connecting = false;
    });

  $scope.consumeShot = function () {
    sendMessage('Shot consumed', 'STATUS_REPORT')
      .then(function (message) {
        $scope.device.consumedShots++;
      });
  };

  $scope.refill = function () {
    sendMessage('Refill', 'STATUS_REPORT')
      .then(function () {
        $scope.device.consumedShots = 0;
      });
  };

  function sendMessage(message, channel) {
    $scope.sending = true;
    $scope.sendingError = false;

    return MQTT.sendMessage(message, channel)
      .then(function (message) {
        console.log('Message Sent');
      }, function (err) {
        $scope.sendingError = true;
        console.error(err);
      })
      .finally(function () {
        $scope.sending = false;
      });
  }
})

.controller('AssociateCtrl', function($scope, $state, API) {
  $scope.device = {};

  ionic.Platform.ready(function(){
    $scope.device.serialNumber = ionic.Platform.device().serial ? ionic.Platform.device().serial : getRandomSerialNumber();
  });

  $scope.associateDevice = function () {
    $scope.submitting = true;
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
          })
          .finally(function () {
            $scope.submitting = false;
          });
      }, function (err) {
        $scope.submitting = false;
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