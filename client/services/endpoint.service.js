(function () {
  'use strict';
  angular.module('app')
      .service('resultsService', resultsService);
  resultsService.$inject = ['$http'];

  function resultsService($http) {
    return {
      get: get
    };
    function get() {
      return $http.get('results.json');
    }
  }
})();
