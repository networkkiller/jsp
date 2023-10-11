(function() {
    'use strict';

    angular.module('televentas').controller('loginController', loginController);

    loginController.$inject = [
        '$scope',
        '$state',
        '$localStorage',
        '$filter',
        '$http'
    ];

    function loginController(
      $scope,
      $state,
      $localStorage,
      $filter,
      $http
    ) {
        $localStorage.postventa = null;
        $scope.mensaje = null;
        $scope.autentificando = false;
        $scope.cargandoLogin = false;
        $scope.activarBoton = true;
        $scope.rolSeleccionado = null;
        $scope.seleccionarRol = false;
        $scope.saludo = true;
        $scope.seleccionarTipoVenta = false;
        $scope.tipoVendedor = "";
        $scope.seleccionadorRoles = [];
        $scope.seleccionarSupervisor = false;
        $scope.rollLoginMAt = $filter('translate')('ROLL.LOGINMAT');
        $scope.flagLoginMat = $filter('translate')('ROLL.LOGINMAT.FLAG');
        $scope.parametroLoginMat = $filter('translate')('ROLL.LOGINMAT.PARAMETRO');

        $scope.validarFormulario = function() {
            $scope.mensaje = null;
            if (!$scope.autentificando) {
                if (!$scope.nombreUsuario) {
                    $scope.mensaje = $filter('translate')('ERROR.USUARIO.VACIO');
                    $scope.activarBoton = true;
                    return false;
                }
                if (!$scope.clave) {
                    $scope.mensaje = $filter('translate')('ERROR.CLAVE.VACIO');
                    $scope.activarBoton = true;
                    return false;
                }
                $scope.cargandoLogin = true;
                $scope.activarBoton = false;
                var data = "j_security_check?" + $('#security').serialize();
                $scope.autentificar(data);
            } else {
                if (!$scope.usuario.supervisor) {
                    $scope.mensaje = $filter('translate')('ERROR.USUARIO.SUPERVISOR');
                } else {
                    $scope.cargandoLogin = true;
                    $localStorage.usuario = $scope.usuario;
                    $scope.activarBoton = false;
                    top.location.href = '../';
                }
            }
        };

        $scope.autentificar = function(data) {
        	var indice_datos_login = 17;
        	if (data.toString().length <17){
        		indice_datos_login = 0;
        	}
        	data = data.substring(indice_datos_login, data.toString().length);
            $http({ 
            	url : "j_security_check", 
            	method : 'POST',
            	data: data, 
            	headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function() {
                $scope.cargarUsuario(data);
            }).error(function() {
                $scope.mensaje = $filter('translate')('ERROR.USUARIO.INCORRECTO');
                $scope.autentificando = false;
                $scope.cargandoLogin = false;
                $scope.activarBoton = true;
                ocultarCargando();
            });
        };

        $scope.cargarUsuario = function(data) {
            $http({
                method : 'GET',
                url : '../api/autenticado'
            }).success(function(result) {
                $localStorage.usuario = result;
                $localStorage.usuario.serial = btoa("/" + data);
                $scope.usuario = $localStorage.usuario;
                $scope.validaRol();
            }).error(function() {
                $scope.mensaje = $filter('translate')('ERROR.SERVICIO.LOGIN');
                $scope.autentificando = false;
            });
        };

        $scope.validaRol = function() {
            var rolesPermitidos = $filter('translate')('ROLES.PERMITIDOS');
            var rolesUsuario = $localStorage.usuario.roles;
            if ($scope.obtenerParametro($scope.parametroLoginMat) && $scope.obtenerParametro($scope.parametroLoginMat) == $scope.flagLoginMat){
                rolesUsuario = $scope.rollLoginMAt;
            }
            var roles = rolesUsuario.split(',');
            var rolValido = false;
            if (roles !== null && roles !== '') {
                if (roles.length > 0) {
                    rolValido = $scope.listarRolesPermitidos(roles, rolesPermitidos);
                }

                if (rolValido) {
                    if (roles.length > 1) {
                        $scope.seleccionarRol = true;
                        $scope.activarBoton = true;
                        $scope.cargandoLogin = false;
                        $scope.saludo = false;
                    } else {
                        $scope.rolSeleccionado = roles[0];
                        $scope.seleccionarRoles();
                    }
                } else {
                    $scope.doLogout();
                }
            } else {
                $scope.doLogout();
            }
        };

        $scope.listarRolesPermitidos = function(roles, rolesPermitidos) {
            var rolValido = false;
            for (var i = 0; i < roles.length; i++) {
                if (roles[i] !== '' && rolesPermitidos.indexOf(roles[i]) > -1) {
                    rolValido = true;
                    var rolNuevo = {};
                    rolNuevo.nombre = roles[i];
                    rolNuevo.codigo = roles[i];
                    $scope.seleccionadorRoles.push(rolNuevo);
                }
            }
            return rolValido;
        }

        $scope.seleccionarRoles = function() {
            $scope.seleccionarTipoVenta = false;
            $scope.autentificando = true;
            $scope.seleccionarRol = false;
            $scope.cargandoLogin = true;
            $scope.usuario.roles = $scope.rolSeleccionado;
            $localStorage.usuario = $scope.usuario;
            $localStorage.usuario.roles = $scope.rolSeleccionado;
            if ($scope.usuario.roles === 'ejecutivoTeleventa') {
                $scope.seleccionarTipoVenta = true;
                $scope.activarBoton = true;
                $scope.cargandoLogin = false;
                $scope.saludo = false;
            } else {
                $scope.validarSupervisores();
            }
        };

        $scope.validarTipoVendedor = function() {
            $scope.cargandoLogin = true;
            if ($scope.tipoVendedor === '1') {
                $scope.usuario.business = true;
            } else {
                $scope.usuario.business = false;
            }
            $localStorage.usuario = $scope.usuario;
            $scope.seleccionarTipoVenta = false;
            $scope.validarSupervisores();
        };

        $scope.validarSupervisores = function() {
            $scope.cargandoLogin = false;
            if ($scope.rolSeleccionado === 'ejecutivoTeleventa' || $scope.rolSeleccionado === 'calidadVenta' || $scope.rolSeleccionado === 'operadorPicking') {
                $scope.cargandoLogin = true;
                $scope.listarSupervisores();
            } else {
                top.location.href = '../';
            }
        };

        $scope.listarSupervisores = function() {
            $scope.seleccionarSupervisor = true;
            $scope.saludo = false;
            $http(
                    {
                      method : 'POST',
                      url : '../servicios/comunes/obtenerSupervisores',
                      data : $localStorage.usuario
                    }
                 ).success(
                    function(result) {

                        console.log({result});

                        $scope.supervisores = result;
                        $scope.usuario.supervisor = null;
                        $scope.activarBoton = true;
                        $scope.autentificando = true;
                        $scope.cargandoLogin = false;
                    }
                 ).error(
                    function() {
                       top.location.href = '../login/';
                    }
                 );
        };

        $scope.doLogout = function() {
            $http({ method : 'DELETE', url : '../api/autenticado' }).success(function() {
                $scope.mensaje = $filter('translate')('ERROR.USUARIO.ROL');
                $scope.autentificando = false;
                $scope.cargandoLogin = false;
                $scope.activarBoton = true;
                $scope.clave = null;
            }).error(function() {
                $scope.mensaje = $filter('translate')('ERROR.SERVICIO.LOGIN');
                $scope.autentificando = false;
                $scope.cargandoLogin = false;
                $scope.activarBoton = true;
                $scope.clave = null;
            });
        };

        $scope.obtenerParametro = function(parameterName) {
            var result = null, val = null, indice = null;
            location.search.substr(1).split("&").forEach(function(item) {
                indice = item.substr(0, 1);
                val = item.substr(2, item.length);
                if (indice === parameterName)
                    result = decodeURIComponent(val);
            });
            return result;
        }

        if ($scope.obtenerParametro("a")) {
            var data;
            if ($scope.obtenerParametro("a") !== "undefined" && $scope.obtenerParametro("b") !== "undefined") {
                var usr = atob($scope.obtenerParametro("a"));
                var pass = atob($scope.obtenerParametro("b"));
                $scope.cargandoLogin = true;
                $scope.activarBoton = false;
                $localStorage.usuario = null;
                data = "j_security_check?j_username=" + usr + "&j_password=" + pass;
                $scope.autentificar(data);
            } else if ($localStorage.usuario && $localStorage.usuario.serial) {
                $scope.cargandoLogin = true;
                $scope.activarBoton = false;
                data = atob($localStorage.usuario.serial);
                $scope.autentificar(data.substring(1, data.toString().length));
            } else {
                $localStorage.usuario = null;
            }
        }
    }
})();
