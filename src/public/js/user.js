app.controller('mfaUserCtrl', ['$scope','$filter','$http','$filter','$uibModal','$sce', function($scope, $filter, $http, $filter, $uibModal, $sce) {


  $scope.qrcode;

    $scope.refresh = function(offset) {
        offset = offset ? offset : 0;
        if ($scope.loading) return;
        $scope.loading = true;
        if (!offset) $scope.users = [];
        $http.get("api/admin/users?offset="+offset).then(function successCallback(response) {
            if (response.data.status && response.data.status == "ok") {
                var tmp = $scope.users.concat(response.data.details);
                $scope.users = tmp;
            }
            $scope.loading = false;
        }, function errorCallback(response) {
            $scope.loading = false;
            $scope.addAlert("Failed to retrieve user list", "danger");
            
        });
    };

  $scope.generateToken = function(user) {
    user.loading = true;
    $http.get("api/admin/users/"+user.id+"/generate").then(function(response) {
        user.loading = false;
        $scope.users.forEach(function(i) {
            if (i.id == user.id) {
                i.psk = response.data.details.psk;
            }
        });
        user.edit = false;
    }, function(response) {
        $scope.addAlert("Error Generating Shared Key: " + response.data.message);
        user.loading = false;
        
    });
  };

  $scope.getToken = function() {
    $http.get("api/token").then(function (response) {
        $scope.token = response.data.details;
        var qr = qrcode(6, 'M');
        qr.addData("otpauth://totp/"+$scope.identity.agency+"%3A"+$scope.identity.user+"?secret="+$scope.token+"&issuer="+$scope.identity.agency);
        qr.make();
        $scope.qrcode = $sce.trustAsHtml(qr.createImgTag());

    }, function(response) {
        $scope.addAlert("Failed to retrieve Token: " + response.data.message);
    });
  }

  $scope.getToken();

}]);
