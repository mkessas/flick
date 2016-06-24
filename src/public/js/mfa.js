app = angular.module('mfa', ['ui.bootstrap','ui.bootstrap-slider', 'ngCookies']);

app.controller('mfaCtrl', ['$scope','$timeout', '$http', '$cookies', '$window', function($scope, $timeout, $http, $cookies, $window) {

  $scope.alerts = [];
  $scope.body;

  $scope.logout = function() {
    $cookies.remove("GAM-ZSN-QRI", { path: '/' });
    $window.location.href = $scope.identity.logoutUrl;
;
  };

  $scope.addAlert = function(m, t) {
        $scope.alerts.push({msg: m, type: t});
        $timeout($scope.closeAlert, 5000, true, 0);
  };

  $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
  };

  $scope.formatDate = function(d) {
    if (!d) return "Never";
    var m = d.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    return m[1]+"-"+m[2]+"-"+m[3]+" "+m[4]+":"+m[5]+":"+m[6];
  }

  $scope.loadIdentity = function() {
    $http.get("api/identity").then(function(response) {
        $scope.identity = response.data.details;
        if ($scope.identity.admin == true) 
            $scope.body = "admin/body.html"; 
        else
            $scope.body = "body.html"
    });
  }

  $scope.loadIdentity();
  console.log("MFA v%%VERSION%% Running");

}]);
