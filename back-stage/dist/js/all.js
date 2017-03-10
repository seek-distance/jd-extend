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

app.factory('log', ['$http',function($http){
	return {
		in:function(data){
			return $http({
				method:'post',
				url:'http://jddr-api.jymao.com/ds/login',
				data:data
			});
		},
		out:function(){
			return $http({
				method:'post',
				url:'http://jddr-api.jymao.com/ds/logout'
			});
		},
		vail:function(){
			return $http({
				method:'get',
				url:'http://jddr-api.jymao.com/ds/has-login'
			});
		},
		update:function(data){
			return $http({
				method:'post',
				url:'http://jddr-api.jymao.com/ds/user/new-password',
				data:data
			});
		}
	};
}]);

app.factory('user', ['$http',function($http){
	return{
		get:function(){
			return $http({
				method:'get',
				url:'http://jddr-api.jymao.com/ds/g/User'
			});
		},
		del:function(data){
			return $http({
				method:'DELETE',
				url:'http://jddr-api.jymao.com/ds/user',
				data:data
			});
		},
		add:function(data){
			return $http({
				method:'post',
				url:'http://jddr-api.jymao.com/ds/user',
				data:data
			});
		},
		put:function(data){
			return $http({
				method:'PUT',
				url:'http://jddr-api.jymao.com/ds/user/new-password',
				data:data
			});
		}
	};
}]);

app.factory('classify', ['$http',function($http){
	var url='http://jddr-api.jymao.com/ds/category';
	return {
		get:function(){
			return $http({
				method:'get',
				url:'http://jddr-api.jymao.com/ds/g/Category'
			});
		},
		update:function(data){
			return $http({
				method:'post',
				url:url,
				data:data
			});
		},
		del:function(data){
			return $http({
				method:'DELETE',
				url:url,
				data:data
			});
		}
	};
}]);



/*
管理员账号:  admin   密码: 154146

接口: 
登录: POST /ds/login        data: name:****, password:******
登出: POST /ds/logout

管理员权限下
获取用户：/ds/g/User
添加新用户: POST /ds/user  data:   name:****, role:admin(不填表示普通用户)
修改密码: PUT /ds/user/new-password       data:      newPwd:****
删除用户: DELETE /ds/user 	data: name:*****

分类接口:
得到分类: GET /ds/g/Category 一个category    {name:***, words:['***','****']}
修改分类: post /ds/category  data:  name:****, words:["***", "***"]
删除分类: DELETE /ds/category data: name:****

分类更改后, 大致上1个小时左右, 后台会把分类应用到已有的数据上. 

用户管理 ,主要是 添加用户, 删除用户, 生成初始密码    
分类管理, 主要是 添加/删除分类,  每个分类, 下面有特征词, 可以添加/删除特征词  
(后台会在商品标题里查找分类的特征词, 找到后, 就把该商品归到该分类里)
*/