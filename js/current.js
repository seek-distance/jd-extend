var allImg={imgPic:[]};
var thorCookie;
chrome.runtime.sendMessage("getThorCookie", function(cookie) {
    console.log(cookie)
    thorCookie=cookie.value;
})

getData={
	getAll:function(option){
		return $.get('http://www.jymao.com/ds/qiniu/list?bucket=jddr',option);
	},
	upload:function(option){
		return $.post('http://www.jymao.com/ds/jddr/upload',option);
	},
	fifthImg:function(option){
		return $.get("http://www.jymao.com/ds/jddr/fifth-img",option);
	},
	repeatStr:function(str, data) {
	    var s = str.replace(/#\{(.*?)\}/ig, function(match, value) {
	        return data[value] || "";
	    })
	    return s;
	}
}

var Upload=function(){
	this.imgFirstUrl='http://jddr.jymao.com/';
	this.imgTpl='<div class="img-item">'+
					'<img src="'+this.imgFirstUrl+'#{key}">'+
					'<button class="b titlePic-btn">作为封面图</button>'+
				'</div>';
	this.folderTpl='<div class="img-item folder">'+
						'<img src="http://www.jymao.com/img/timg.png">'+
						'<div class="folder-name">#{folderName}</div>'+
					'</div>';
}
Upload.prototype={
	addBtn:function(){
		var btn='<button class="b addPic">从图集中选择</button>';
		var modal='<div class="img-fix">'+
					'<div class="fix"></div>'+
					'<div>'+
						'<span class="close" style="position: absolute;right:10px;top:5px;cursor:pointer">X</span>'+
						'<div class="clearfix allImg firstFolder" style="padding-top:31px">'+
						'</div>'+
						'<div class="clearfix allImg secondFolder">'+
							'<button class="b return">返回上一级</button>'+
							'<div class="clearfix"></div>'+
						'</div>'+
						'<div class="clearfix allImg lastFolder">'+
							'<button class="b return">返回上一级</button>'+
							'<div class="clearfix"></div>'+
						'</div>'+
					'</div>'+
				  '</div>';
		$('.upload_box').parent().append(btn);
		$('body').append(modal);
		//$('.allImg').append(imgtpl);

		$('.addPic').click(function(){
			$('.img-fix').fadeIn();
		})
		$('.img-fix').click(function(){
			$(this).fadeOut();
		})
		$('.img-fix>div').click(function(event){
			event.stopPropagation();
		})
		$('.allImg').on("click", ".return",function() {
			$('.allImg').hide();
			$(this).parent().prev().show();
		})
		$('.close').click(function(){
			$('.img-fix').click();
		})

		this.addTitlePic();
	},
	addTitlePic:function(){
		var self=this;
		var firstFolderName='';
		$('.allImg').on('click','.titlePic-btn',function(){
			$('.fix').show();
			getData.upload({fileUrl:$(this).siblings('img').attr('src'),thorCookie:thorCookie}).then(function(data){
				if (data.success) {
					$('.fix').hide();
					$('.img-fix').fadeOut();
					var value = data.result.slice(5);
					$('.upload').removeClass('noImg');
					$('.titlePicUrl').attr('src',value);
					$('.titlePicUrl .img_wrap').addClass('show').find('img').attr('src',value);
					$('.titlePicUrl .del_img').addClass('show');
				}				
			})
		})
		$('.allImg').on('click','.folder',function(){
			$(".allImg").hide();
			$(this).parents(".allImg").next().show();
			var folderName = $(this).find(".folder-name").text();
			if( $(this).parents(".allImg").hasClass("firstFolder") ){
				firstFolderName=folderName;
				self.showFolderPic(allImg[folderName],$(this).parents(".allImg").next().find("div"));
			}else if ( $(this).parents(".allImg").hasClass("secondFolder") ) {
				self.showFolderPic(allImg[firstFolderName][folderName],$(this).parents(".allImg").next().find("div"));
			}
			
		})
	},
	showFolderPic:function(option,$Ele){
		var imgTpl='',folderTpl='';
		var self=this;
		for(var i in option){
			if (i != 'imgPic') {
				folderTpl += getData.repeatStr(self.folderTpl,{'folderName':i});
			}else{
				for (var i = 0; i < option.imgPic.length; i++) {
					imgTpl += getData.repeatStr(self.imgTpl,{'key':option.imgPic[i]});
				}				
			}
		};
		$Ele.html("").append(folderTpl).append(imgTpl);
	},
	getPic:function(option){
		var option=option || {};
		var self=this;
		getData.getAll(option).then(function(data){
			var folderTpl="",imgTpl="";
			for (var i = 0; i < data.items.length; i++) {
				var index = data.items[i].key.indexOf('/');
				var lastIndex = data.items[i].key.lastIndexOf('/');
				if (index != -1) {
					var folderName=data.items[i].key.slice(0,index);
					if( !allImg.hasOwnProperty(folderName) ){
						allImg[folderName]={imgPic:[]};
					}

					if (index != lastIndex) {
						var folderSecondName=data.items[i].key.slice(index+1,lastIndex);
						if( !allImg[folderName].hasOwnProperty(folderSecondName) ){
							allImg[folderName][folderSecondName] = {imgPic:[]};
						}
						allImg[folderName][folderSecondName].imgPic.push(data.items[i].key);
					}else{
						allImg[folderName].imgPic.push(data.items[i].key);
					}

					folderTpl = self.folderTpl.replace(/#\{(.*?)\}/ig,folderName);
					if ( $('.firstFolder .folder-name:contains('+folderName+')').length == 0 ) {
						$('.firstFolder').prepend(folderTpl);
					}					
				}else{
					imgTpl += getData.repeatStr(self.imgTpl,data.items[i]);
					imgPic.push(data.items[i].key);
				}
				//tpl += getData.repeatStr(self.imgtpl,data.items[i]);
			}

			$('.firstFolder').append(imgTpl);
			if (data.marker) {
				self.getPic({marker:data.marker});
			}
		})
		console.log(allImg)
	}
}

var AddToshop=function(){

}
AddToshop.prototype={
	init:function(){
		var self=this;
		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
			if (message instanceof Object) {
				self.message=message;
				self.dealShop();
			}
		})
	},
	dealShop:function(){
		var self=this;
		if ( $('#pop').length==0 || $('#pop').css("display") == "none" ) {
			$('.b-showpop').click();
		}
		$('.skuId').val(self.message.skuId);
		$('.b-subSku').click();
		getData.fifthImg({skuId:self.message.skuId}).then(function(data){
			var imgItem='<div class="file_view"><img src="'+data.imgUrl+'" alt="" style="display: inline;"></div>';
			if ($('.file_view').length == 4){
				$('.pd_img_list').append(imgItem);
			}else{
				$('.file_view').last().find('img').attr('src',data.imgUrl).css('display','inline');
			}
			$('.file_view').unbind('click');
			$('.file_view').click(function(){
				$(this).addClass('cur').siblings().removeClass('cur');
			})
		})		
		
	}
}



var upload=new Upload();
upload.addBtn();
upload.getPic();

var addToshop = new AddToshop();
addToshop.init();




/*
http://www.jymao.com/ds/qiniu/list?bucket=jddr&limit=10&marker=

marker 和limit 可选
limit默认是1000
marker是分页时候用, 取一批下来,如果后面还有, 就会传回一个marker, 然后第二批的时候就可以出入这个marker, 来标记第二批的开始处

上传接口:
POST    http://www.jymao.com/ds/jddr/upload
 参数 fileUrl : http://jddr.jymao.com/xie/QQ20170307-184350.jpg
新增参数 : thorCookie

summer的妈妈     loveyou321@
后台：dr.jd.com
*/