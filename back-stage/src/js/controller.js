var app=angular.module('app', ['ui.router']);
app.config(['$stateProvider','$urlRouterProvider',function( $stateProvider , $urlRouterProvider ) {
	$urlRouterProvider.otherwise('/home');
	$stateProvider.state('home',{
		url:'/home',
		views:{
			'':{
				templateUrl:'dist/tpls/home.html',
				controller:'homeCtr'
			},
			'nav@home':{
				templateUrl:'dist/tpls/nav.html',
				controller:'navCtr'
			},
			'content@home':{
				templateUrl:'dist/tpls/userMan.html',
				controller:'userManCtr'
			}
		}
	})
	.state('login',{
		url:'/login/:update',
		templateUrl:'dist/tpls/login.html',
		controller:'loginCtr'
	});
}]);

app.config(['$httpProvider', function($httpProvider,$injector) {
  	$httpProvider.defaults.withCredentials = true;
}]);

app.controller('index', ['$scope','log','$state',function($scope,log,$state){	
	log.vail().success(function(data){
		if (!data.hasLogin && !sessionStorage.getItem('username')) {
			$state.go('login');
		}
	});
}]);

app.controller('homeCtr', ['$scope','log','$state',function($scope,log,$state){
	log.vail().success(function(data){
		if (data.hasLogin) {
			$scope.username=data.name;
		}		
	});
	$scope.exit=function(){
		log.out().success(function(){
			sessionStorage.removeItem("username");
			$state.go('login');
		});	
	};
}]);

app.controller('navCtr', ['$scope','$location',function($scope,$location){	
	$scope.nav=[
		{
			sref:'home',
			on:true,
			class:'fa-user',
			content:'用户管理'
		}
	];
}]);

app.controller('loginCtr',['$scope','$state','log','$stateParams',function($scope,$state,log,$stateParams){
	$scope.success=true;
	if($stateParams.update=="update"){
		$scope.update=true;
	}else{
		$scope.update=false;
	}

	$scope.updatePwd=function(){
		var data={newPwd:$scope.newPwd,oldPwd:$scope.oldPwd};
		log.update(data).success(function(data){
			$state.go('home');
		}).error(function(){
			alert("原密码错误");
		});
	};

	$scope.submit=function(){
		$scope.data={name:$scope.username,password:$scope.password};		
		log.in($scope.data).success(function(data){
			if(data.msg=="login ok"){
				sessionStorage.setItem("username",$scope.username);
				$scope.success=true;
				$state.go('home');
			}else{
				$scope.success=false;
			}
		}).error(function(){
			$scope.success=false;
		});
	};
}]);
app.controller('userManCtr',['$scope','user',function($scope,user){
	$scope.user=[];
	$scope.newUser="";
	user.get().success(function(data){
		$scope.user=data;
	});

	$scope.del=function(index){
		var isdel=confirm("是否删除该用户");		
		if(isdel){
			var data={name:$scope.user[index].name};
			user.del(data).success(function(){
				user.get().success(function(data){
					$scope.user=data;
				});
			});	
		}
	};

	$scope.add=function(){
		if ($scope.newUser === "") {
			document.querySelector('.newUser').focus();
			return;
		}
		var data={name:$scope.newUser};
		if($scope.isadmin)	data.role='admin';
		user.add(data).success(function(){
			user.get().success(function(data){
				$scope.user=data;
			});
			$scope.newUser="";
		});		
	};
}]);
