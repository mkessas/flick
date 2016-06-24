app.controller('mfaAdminCtrl', ['$scope','$filter','$http','$filter','$uibModal', function($scope, $filter, $http, $filter, $uibModal) {

    $scope.types = [];
    $scope.history;

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

    $scope.refresh_history = function(offset) {
        offset = offset ? offset : 0;
        if ($scope.loading) return;
        $scope.loading = true;
        if (!offset) $scope.history = [];
        $http.get("api/admin/history?offset="+offset).then(function successCallback(response) {
            if (response.data.status && response.data.status == "ok") {
                var tmp = $scope.history.concat(response.data.details);
                $scope.history = tmp;
            }
            $scope.loading = false;
        }, function errorCallback(response) {
            $scope.loading = false;
            $scope.addAlert("Failed to retrieve history", "danger");
            
        });
    };

    $scope.animationsEnabled = true;

    $scope.getUserClass = function (status) {
        switch (status) {
            case "Suspended": return {'color': 'red'};
            case "Active":
            default:  return {'color': 'green'};
        }
    };

    $scope.getHistoryClass = function(type) {
        switch (type) {
            case 'delete': return "fa fa-times text-danger";
            case 'change':
            case 'type': 
            case 'register': return "fa fa-exclamation text-warning";
            default: return "fa fa-check text-success";
        }
    }

    $scope.registerUser = function(user) {
      var uri = "api/admin/users";
      if (user != undefined) uri += "/" + user;
      $http.put(uri, user).then(function (response) {
          if (response.data.status == "ok") {
              $scope.addAlert("Success: User Successfully Registered", "success");
              $scope.refresh();
          } else {
              $scope.addAlert("Error: " + response.data.message, "danger");
          }
        }, function (response) {
            $scope.addAlert("Error: Failed to register user: " + response.data, "danger");
        }
      );
    };

    $scope.newUser = function(template) {
        var user = $scope.newUser[template];
        if (user) $scope.addUser(user);
    };

    $scope.editUser = function(name) {
        $http.get("stub/users.json").then(function successCallback(response) {
                $scope.users[name] = response.data;
                $scope.addUser($scope.users[name]);
            }, function errorCallback(response) {
                $scope.addAlert("Error: Unable to open user for Editing", "danger");
            });
        return;
    }

    $scope.addUser = function (user) {
      var wizardInstance = $uibModal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'admin/user.html',
        controller: 'addUserCtrl',
        scope: $scope,
        backdrop: 'static',
        size: 'md',
        resolve: {
          user: function() { var tmpUser = angular.copy(user); return tmpUser; }
        }
      });
  
      wizardInstance.result.then(function (newUser) {
         $scope.refresh();
      }, function () {
  
      });
  };

  $scope.searchUsers = function(val) {
    return $http.get('api/admin/search', { params: { q: val, } }).then(function(response){
      return response.data.details;
    });
  };

  $scope.filterUsers = function(users) {
      return function(user) {
          return user.status != "Active" ? user : '';
      };
  };

  $scope.deleteUser = function(user) {
    $http.delete("api/admin/users/"+user.id).then(function(response) {
        $scope.users.forEach(function(u,i) {
            if (u.id == user.id) {
                $scope.users.splice(i, 1);
            }
        });
        
    }, function(response) {
        $scope.addAlert("Unable to delete user "+user.id+": " + response.data.message, "danger");
        
    });
  }

  $scope.changeUserState = function(user, status) {
    $http.put("api/admin/users/"+user.id+"/status", {status: status}).then(function (response) {
        if (response.data.status == "ok") { 
            $scope.users.forEach(function(u) {
                if (u.id == user.id) u.status = response.data.details.status;
            });
        } else {
            $scope.addAlert("Unable to change state  for "+user.id+": " + response.data.message, "danger");
        }
    }, function(response) {
        $scope.addAlert("Unable to change state  for "+user.id+": " + response.data.message, "danger");
        
    });
  }

  $scope.assignToken = function(user, type, serial) {
    user.loading = true;
    $http.post("api/admin/users/"+user.id+"/token", {type, serial}).then(function(response) {
        user.loading = false;
        if (response.data.status == "ok") {
            $scope.users.forEach(function(i) {
                if (i.id == user.id) {
                    i.serial = response.data.details.serial;
                    i.type = response.data.details.type;
                }
            });
        } else {
            $scope.addAlert(response.data.message);
        }
        user.edit = false;
    }, function(response) {
        $scope.addAlert("Error Assigning Token");
        user.loading = false;
        
    });
  };

  $scope.loadTokenTypes = function() {
    $http.get("stub/types.json").then(function(response) {
        $scope.types = response.data;
    });
  }

  $scope.refresh();
  $scope.loadTokenTypes();
}]);
