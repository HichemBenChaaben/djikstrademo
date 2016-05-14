(function() {
  'use strict';
  angular.module('app')
    .component('mainView', {
      templateUrl: 'client/views/main.html',
      controller: mainView,
      controllerAs: 'vm'
    });

  mainView.$inject = ['resultsService'];
  function mainView(resultsService) {
    var vm = this;
    vm.$onInit = function () {
      vm.mode = 'cheapest';
      vm.cityArr = [];
      vm.results = [];
      vm.referenceOffers = [];
    }
    // getting the mock data ....
    resultsService.get().then(function (res) {
      vm.data = res.data;
      vm.cityArr = _.uniq(_.map(vm.data.deals, function (n) {
        if (vm.cityArr.indexOf(n.departure) < 0) {
          return n.departure;
        }
      })).sort();
    }).catch(function (err) {
      console.log(new Error(err));
    });

    /**
     * get the weight array of the different vertexes
     * @param data object literal
     * @returns {Array}
     */
    function findItinerary(data, mode) {
      var gArr = [];
      var cities = vm.cityArr;
      var mode = mode;
      // clear the reference offer
      vm.referenceOffers = [];

      _.map(cities, function (city) {
        var arr = [];
        var inf = [];
        var filterArr = [];
        arr.push(city);
        // find deals where the departure city is the actual map index...
        filterArr = _.filter(data.deals, {
          departure: city
        });
        // now filterArr is the array of all deals which have departure is the city key of
        // this loop, => find cheapest / fastest deal per city
        var destinationsTmp = [];
        destinationsTmp = _.uniq(_.map(filterArr, function (n) {
          if (destinationsTmp.indexOf(n.arrival) < 0) {
            return n.arrival;
          }
        }));
        // now filter the deals that start from the city and arrive at the filtered list of destination
        // get arrays of the same destination, find the cheapes or the fastest in them
        // and push it a temporary array
        _.map(destinationsTmp, function (city) {
          // loop through destination one by one
          // find deals that have the same destination
          var cheapestDeals = _.filter(filterArr, {
            'arrival': city
          });

          if (mode === 'cheapest') {
            // find cheapest deals in this city
            var minimum = _.minBy(cheapestDeals, function (deal) {
              return getPrice(deal.cost, deal.discount);
            });
            // update the reference array
            inf.push([minimum.arrival, getPrice(minimum.cost, minimum.discount)]);

          } else if (mode === 'fastest') {
            // find fastest deals in this city
            var minimum = _.minBy(cheapestDeals, function (deal) {
              return getFastest(deal.duration);
            });
            // update the reference array
            inf.push([minimum.arrival, getFastest(minimum.duration)]);
          }
        });
        gArr.push([city, inf]);
      });
      return gArr;
    }

    // calculates cheapes or fastest depending on the sort mode
    // in minutes
    function getFastest(duration) {
      var duration = (duration.h * 1) * 60 + (duration.m * 1);
      return duration;
    }

    function getPrice(cost, discount) {
      return cost - (cost * discount / 100);
    }

    vm.reset = function(form) {
      vm.referenceOffers = [];
      vm.totalTripTime = '';
      vm.destination = '';
      vm.departure = '';
      form.$setPristine();
    }
    /**
     * flip departure and destination
     */
    vm.flipDest = function () {
      vm.destination = [vm.departure, vm.departure = vm.destination][0];
    };

    vm.getPath = function () {
      var graphArray = findItinerary(vm.data, vm.mode);
      var d = new Dijkstras();
      d.setGraph(graphArray);
      vm.path = d.getPath(vm.departure, vm.destination);
      vm.path.unshift(vm.departure);
      vm.getPrices();
    }

    // get the prices ....
    vm.getPrices = function () {
      var deals = vm.data.deals;
      var prices = [];
      for (var i = 0; i < vm.path.length; i++) {
        if (vm.path[i + 1]) {
          var dep = vm.path[i];
          var dest = vm.path[i + 1];
          var minValue = _.minBy(_.filter(deals, {
            departure: dep,
            arrival: dest
          }), function (deals) {
            // dependens on the search mode
            // return the cheapest or the fastest option
            if (vm.mode === 'cheapest') {
              return getPrice(deals.cost, deals.discount);
            } else if (vm.mode === 'fastest') {
              return getFastest(deals.duration);
            }
          });
        }
        prices.push(minValue);
      }
      prices = _.uniq(prices);
      vm.referenceOffers = _.filter(prices, function (item) {
        return item.reference;
      });
      vm.trips = vm.referenceOffers.map(function (item) {
        return _.find(vm.data.deals, {
          reference: item.reference
        });
      });
      vm.totalTripCost = _.sumBy(vm.trips, function (trip) {
        return getPrice(trip.cost, trip.discount);
      });
      vm.totalTripTime = _.sumBy(vm.trips, function (deal) {
        return (deal.duration.h * 1 * 60 + deal.duration.m * 1);
      });
      vm.totalTripTime = {
        h: moment.duration(vm.totalTripTime, 'm').asHours(),
        m: moment.duration(vm.totalTripTime, 'm').asHours() * 100 % 100
      };
    }
  }
})();
