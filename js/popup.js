ajax={
	shopList:function(option){
		return $.get("http://jddr-api.jymao.com/ds/jddr/list",option);
	},
	shopDetail:function(option){
		return $.get("http://jddr-api.jymao.com/ds/jddr/commodity-detail",option);
	},
	replaceStr:function(str, data) {
	    var s = str.replace(/#\{(.*?)\}/ig, function(match, value) {
	        return data[value] || "";
	    })
	    return s;
	}
}

var ShopList=function() {
	this.bg = chrome.extension.getBackgroundPage();
	this.shopTpl='<li class="clearfix">'+
                    '<div class="shop-img">'+
                        '<a href="http:#{link}" target="_blank"><img src="http:#{imgUrl}"></a>'+                    
                    '</div>'+
                    '<div class="shop-detail">'+
                        '<p class="shop-title"><a href="http:#{link}" target="_blank">#{name}</a><span>#{cpsPrice}</span><span class="fr">#{shopName}</span></p>'+
                        '<p class="shop-price">'+
                            '¥<span>#{price}</span>'+
                            '<button data-id="#{id}" data-imgUrl="#{imgUrl}" class="fr addToPic">加入商品</button>'+
                        '</p>'+
                    '</div>'+
                 '</li>';
    this.shopList={};	//去重存储对象
}
ShopList.prototype={
	getThorCookie:function() {
		var self=this;
		this.bg.getThorCookie(function(cookie) {
			self.thorCookie=cookie.value;
			self.init();
		});
	},
	init:function(){
		var searchUrl = localStorage.getItem('searchUrl');
		var shopList = localStorage.getItem('shopList');
		var shopListTop = localStorage.getItem('shopListTop');
		if (searchUrl) {
			$('.search-input').val(searchUrl);
		}
		if (shopList) {
			$('.shopList').html(shopList);
		}
		if (shopListTop) {
			$('.shopList').scrollTop(shopListTop);
		}
	},
	vaild:function(){
		chrome.tabs.getSelected(null, function(tab) {
			console.log(tab.url); 
			if ( !(/http:\/\/dr.jd.com\/page\/find_list/.test(tab.url)) ) {
				$('.message-fix').show();
			}
		});
	},
	addListener:function(){
		var self=this;
		$('.modal span').click(function(){
			$('.message-fix').hide();
		})

		$('.search-input').keypress(function(e) {
		    if (e.which == 13) {
		        $('.fa-search').click();
		    }
		})
		$('.fa-search').click(function() {
			if ($('.search-input').val() == "")  return;
			localStorage.setItem('searchUrl',$('.search-input').val());
			$('.shopList').html("");
			$('.reload-fix').show();
			self.shopList={};
			ajax.shopList({url: escape($('.search-input').val()) }).then(function(data){
				self.pageCount=data.pageCount;
				var data = data.list;
 				for (var i = 0; i < data.length; i++) {
 					if(self.isOverInShop(data[i].shopName))	continue; 					
 					var option={
 						link:data[i].link,
 						shopName:data[i].shopName
 					}
 					var startIndex = data[i].link.lastIndexOf('/');
 					var endIndex = data[i].link.lastIndexOf('.');
 					var id = data[i].link.slice(startIndex+1,endIndex);
 					self.showItem(option,id);
 				}
			})
		})

		$('.shopList').on("click",".addToPic",function(){
			self.bg.sendData({skuId:$(this).attr("data-id"),imgUrl:$(this).attr("data-imgUrl")});
		})

		$('.shopList').scroll(function(){
			localStorage.setItem('shopListTop',$('.shopList').scrollTop());
			setTimeout(function(){
				if(self.checkSlide()){

				}
			},300)
		})

	},
	showItem:function(option,id){
		var self=this;
		ajax.shopDetail({skuId:id,thorCookie:self.thorCookie}).then(function(value){
			if(self.isOverInShop(value.brandName))	return;
			$('.reload-fix').hide();
			option.id = value.skuID;
			option.price = value.price;
			option.cpsPrice = value.cpsPrice;
			option.imgUrl = value.fifthImg;
			option.name = value.title;
			if (value.cpsPrice != '0') {
				$('.shopList').append(ajax.replaceStr(self.shopTpl,option));
				localStorage.setItem('shopList',$('.shopList').html());
			}
		})
	},
	isOverInShop:function(name){
		var self=this;
		if ( !self.shopList.hasOwnProperty(name) ) {
			self.shopList[name] = 1;
			return false;
		}else{
			if (self.shopList[name] < 3) {
				self.shopList[name] += 1;
				return false;
			}else{
				return true;
			}
		}
	},
	checkSlide:function() {
	    var lastShopTop = $(".shopList li").last().get(0).offsetTop + ($(".shopList li").last().outerHeight()) / 2;
	    var winH = $(".shopList").scrollTop() + $(".shopList").outerHeight();
	    return (winH > lastShopTop) ? true : false;
	}
}

var list=new ShopList();
list.getThorCookie();
list.vaild();
list.addListener();


/*

jddr-api.jymao.com
接口:
Get  /ds/jddr/list?url=商品列表链接
返回: 没有过滤佣金的商品列表.  
说明: 因为佣金接口一个一个商品访问, 比较慢, 所以, 把佣金信息拆开成了一个独立接口. 
注意: 列表中, 后面的商品没有图片链接. 页面本身是动态加载后面的图片.
示例: http://www.jymao.com/ds/jddr/list?url=https://list.jd.com/list.html?cat=9987,653,655&ev=244_30988%40exprice_M1700L2799&page=1&sort=sort_totalsales15_desc&trans=1&JL=6_0_0#J_main

第二个接口: 
取佣金和图片信息:
GET /ds/jddr/commodity-detail?skuId=*******
SkuId是商品链接中的数字部分. 如: https://item.jd.com/10574826759.html 
skuId就是10574826759
新增参数 : thorCookie
这个接口返回佣金信息和图片链接
示例:http://www.jymao.com/ds/jddr/commodity-detail?skuId=2967929&thorCookie=1BEF46406483E7E23CEE23D3D603C264FD70157A79ADCDC2CCC96CD24FEE1F4C38F9DC81965D55469D85C444BDFFDA1BEC65796412BBC6BDE82A272CE23F576AED09996AE037D82F93C97621BDA726EBC9B5BAB19A388ECC35FD5537E1E64BA96BD7D6C296FCC210A4250DE2AB09E8EEAAEF6CA64DD994F6A2FEE840E0B29ABBE65F4EAE03ABF86399C6BB5C44C16AEF

获取第5张图片:  
GET  /ds/jddr/fifth-img
参数 skuId
例子: http://www.jymao.com/ds/jddr/fifth-img?skuId=2967929
返回: {"imgUrl":"//img14.360buyimg.com/n5/s800x800_jfs/t3022/285/1692336013/79612/5109769a/57c8d86dN0de955b7.jpg"}

summer的妈妈     loveyou321@
后台：dr.jd.com

*/

/*

获取背景页面
var bg = chrome.extension.getBackgroundPage();
获取url
chrome.tabs.getSelected(null, function(tab) { console.log(tab.url); });

页面通信background，content，popup
C->P 或者 C->B 或者 b->p
chrome.runtime.sendMessage({'名称':'传送数据'})
P->C  B->C
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
           chrome.tabs.sendMessage(tabs[0].id, {'名称':'值'}, function(response) {
                //向 content_script 发送消息
           });  
       })
接收消息都是 
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
alert(JSON.stringify(message)) //这里获取到消息值与名称
})

*/

/*
那个客户提了两个改进需求:
1. 增加用户管理/登录
2. 如果有下页的话, 自动翻页, 另外, 显示店铺名, 同一个店铺的商品不超过三个, 同一个品牌的商品不超过3个

第一个我正在弄, 准备把上次的那个改改用上去.
第二个你看看好改不? 评估下先

/ds/jddr/commodity-detail 里添加了 品牌名称
/ds/jddr/list 里添加了店铺名称
*/
