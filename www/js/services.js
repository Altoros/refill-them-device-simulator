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
});
