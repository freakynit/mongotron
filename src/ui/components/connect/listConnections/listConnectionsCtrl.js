'use strict';

angular.module('app').controller('listConnectionsCtrl', [
  '$scope',
  '$timeout',
  '$log',
  'connectionCache',
  function($scope, $timeout, $log, connectionCache) {
    const connectionModule = require('lib/modules/connection');

    $scope.connections = [];

    $scope.loading = false;

    $scope.$parent.selectedConnection = null; //reset the parent's selected connection

    _listConnections();

    $scope.selectAndConnect = function(connection, $event) {
      if (!connection) return false;
      if ($event) $event.preventDefault();

      _.each($scope.connections, (conn) => {
        conn.selected = false;
      });

      connection.selected = true;

      $scope.connect();
    };

    $scope.selectConnection = function(connection, $event) {
      if (!connection) return false;
      if ($event) $event.preventDefault();

      if (connection.selected) {
        connection.selected = false;
        return;
      }

      _.each($scope.connections, function(conn) {
        conn.selected = false;
      });

      connection.selected = true;
    };

    $scope.connectionSelected = function() {
      return _.any($scope.connections, (conn) => {
        return conn.selected;
      });
    };

    $scope.connect = function($event) {
      if ($event) $event.preventDefault();

      var activeConnection = _.findWhere($scope.connections, {
        selected: true
      });

      if (!activeConnection) return;

      connectionCache.add(activeConnection);

      $scope.close();
    };

    function _listConnections() {
      $scope.loading = true;

      connectionModule.list()
        .then((connections) => {
          $timeout(() => {
            $scope.connections = connections;
          });
        })
        .catch((response) => {
          $timeout(() => {
            $log.error(response);
          });
        })
        .finally(() => {
          $timeout(() => {
            $scope.loading = false;
          });
        });
    }
  }
]);
