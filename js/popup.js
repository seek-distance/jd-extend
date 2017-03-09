ajax={
	shopList:function(option){
		return $.get("http://www.jymao.com/ds/jddr/list",option);
	},
	shopMessage:function(option){
		return $.get("http://www.jymao.com/ds/jddr/commodity-detail",option);
	},
	repeatStr:function(str, data) {
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
                        '<a href="#{link}" target="_blank"><img src="#{imgUrl}"></a>'+                    
                    '</div>'+
                    '<div class="shop-detail">'+
                        '<p class="shop-title"><a href="#{link}" target="_blank">#{name}</a></p>'+
                        '<p class="shop-price">'+
                            '¥<span>259.00</span>'+
                            '<button class="fr addToPic">加入商品</button>'+
                        '</p>'+
                    '</div>'+
                 '</li>';
}
ShopList.prototype={
	getThorCookie:function() {
		var self=this;
		this.bg.getThorCookie(function(cookie) {
			self.thorCookie=cookie.value;
			console.log(self.thorCookie);
		});
	},
	addListener:function(){
		$('.search-input').keypress(function(e) {
		    if (e.which == 13) {
		        $('.fa-search').click();
		    }
		})
		$('.fa-search').click(function() {
			var self=this;
			ajax.shopList({url:$('.search-input').val()}).then(function(data){
 				console.log(data);
 				for (var i = 0; i < data.length; i++) {
 					var option={
 						link:data[i].link,
 						name:data[i].name,
 					}
 					var startIndex = data[i].link.lastIndexOf('/');
 					var endIndex = data[i].link.lastIndexOf('.');
 					var id = data[i].link.slice(startIndex+1,endIndex);
 					/*ajax.shopMessage({skuId:id,thorCookie:self.thorCookie}).then(function(data){
 						console.log(data);
 					})*/
 				}
			})
		})

	}
}

var list=new ShopList();
list.getThorCookie();
list.addListener();


/*

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