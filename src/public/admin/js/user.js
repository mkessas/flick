app.controller('addUserCtrl', ['$scope', '$http', '$modalInstance', function($scope,$http,$modalInstance) {

 $scope.newUser = "";
 $scope.loading = false;

  $scope.removeUser = function(user) {
    $scope.newUser = "";
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.addUser = function (user) {
    user.type = "Hard";
    $scope.newUser = user;
  };

  $scope.registerUsers = function() {
    $scope.loading = true;
    $http.put("api/admin/users", $scope.newUser).then(function(response) {
        $scope.loading = false;
        if (response.data.status && response.data.status == "ok") {
            $scope.addAlert("User Successfully Registered", "success");
        } else {
            if (response.data.message) 
                $scope.addAlert("Error: " + response.data.message, "danger");
            else
                $scope.addAlert("Error: Unknown Error", "danger");
        }
        $modalInstance.close($scope.newUser);
    }, function(response) {
        $scope.loading = false;
        var r = response.data.message ? response.data.message : "Internal Server Error";
        $scope.addAlert("Error: Users Registeration Failed: " + r, "danger");
        $modalInstance.close($scope.newUser);
    });
  };
}]);
