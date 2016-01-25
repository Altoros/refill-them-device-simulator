/* global angular, Paho */
angular.module('DeviceSimulator')

.service('API', function ($http) {
  var API_URL = 'http://localhost:3000';

  function request (method, path, data) {
    return $http({
      method: method,
      url: API_URL + path,
      data: data
    });
  }

  return {
    get: function (path) {
      return request('GET', path, null);
    },
    post: function (path, data) {
      return request('POST', path, data);
    },
    put: function (path, data) {
      return request('PUT', path, data);
    },
    delete: function (path) {
      return request('DELETE', path, null);
    }
  };
})

.service('MQTT', function ($q, $timeout) {
  var host = 'broker.xively.com';
  var port = 443;
  var waitingTime = 5000;

  function createInstance () {
    mqtt.instance = new Paho.MQTT.Client(host, port, mqtt.device.id);

    // set event listeners
    mqtt.instance.onConnectionLost = function (error) {
      console.log('Connection Lost. Reconnecting...');
      console.log(error);
      mqtt.connect();
    };

    mqtt.instance.onMessageArrived = function (message) {
      console.log('Message Arrived: ', message.payloadString);
      console.log('From: ', message.destinationName);

      var payload = JSON.parse(message.payloadString);

      if (mqtt.waitForMessage &&
          mqtt.waitForMessage.type === payload.type &&
         mqtt.waitForMessage.destinationName === message.destinationName) {
        mqtt.waitForMessage.deferred.resolve(payload);
        mqtt.waitForMessage = null;
        $timeout.cancel(mqtt.timeout);
      }
    };

    mqtt.instance.onFailure = function (message) {
      console.log('Connection failed: ' + message.errorMessage);
    };
  }

  var mqtt = {
    instance: null,
    device: null,
    waitForMessage: null,
    timeout: null,
    connect: function (device) {
      var deferred = $q.defer();

      if (device) {
        mqtt.device = device;
      }

      if (!mqtt.device) {
        $q.reject('No device');
      } else {
        if (!mqtt.instance) {
          createInstance();
        }

        // connect the client
        console.log('Connecting to broker: ', host);
        try {
          mqtt.instance.connect({
            userName: mqtt.device.id,
            password: mqtt.device.password,
            useSSL: true,
            onSuccess: function () {
              console.log('Connection successfull');

              // Once a connection has been made, make the subscriptions
              mqtt.device.channels.forEach(function (topic) {
                mqtt.instance.subscribe(topic.channel);
                console.log('Subscribed to ', topic.channelTemplateName);
              });

              deferred.resolve();
            },
            onFailure: function (err) {
              console.log('FAILURE');
              console.error(err);
              deferred.reject(err);
            }
          });
        } catch (err) {
          console.log('FAILED');
          console.error(err);
          deferred.reject(err);
        }
      }

      return deferred.promise;
    },
    sendMessage: function (dstChannel, type, responseType, data) {
      var deferred = $q.defer();
      var channel = null;

      mqtt.device.channels.some(function (topic) {
        if (topic.channelTemplateName === dstChannel) {
          channel = topic.channel;
        }

        return topic.channelTemplateName === dstChannel;
      });

      var payload = {
        type: type,
        data: data
      };

      var message = new Paho.MQTT.Message(JSON.stringify(payload));
      message.destinationName = channel;

      mqtt.timeout = $timeout(function () {
        deferred.reject('Broker is not responding');
      }, waitingTime);

      try {
        console.log('Sending message: ', payload);
        mqtt.instance.send(message);

        mqtt.waitForMessage = {
          type: responseType || type,
          destinationName: channel,
          deferred: deferred
        };
      } catch (error) {
        console.log('Error sending message: ', error);
        deferred.reject(error);
      }

      return deferred.promise;
    }
  };

  return mqtt;
});

