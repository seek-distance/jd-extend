ajax = {
    shopList: function(option) {
        return $.get("http://jddr-api.jymao.com/ds/jddr/list", option);
    },
    shopDetail: function(option) {
        return $.get("http://jddr-api.jymao.com/ds/jddr/commodity-detail", option);
    },
    replaceStr: function(str, data) {
        var s = str.replace(/#\{(.*?)\}/ig, function(match, value) {
            return data[value] || "";
        })
        return s;
    }
}

var ShopList = function() {
    this.bg = chrome.extension.getBackgroundPage();
    this.shopTpl = '<li class="clearfix commodity-item">' +
        '<div class="shop-img">' +
        '<a href="http:#{link}" target="_blank"><img src="http:#{imgUrl}"></a>' +
        '</div>' +
        '<div class="shop-detail">' +
        '<p class="shop-title"><a href="http:#{link}" target="_blank">#{name}</a><span class="cps-price">佣金:¥#{cpsPrice}</span><span class="fr shopName">#{shopName}</span></p>' +
        '<p class="shop-price">' +
        '¥<span>#{price}</span>' +
        '<button data-id="#{id}" data-imgUrl="#{imgUrl}" data-fifthImg="#{fifthImg}" class="fr addToPic">加入清单</button>' +
        '</p>' +
        '</div>' +
        '</li>';
    this.shopList = {};
    this.brandList = {};
}
ShopList.prototype = {
    getThorCookie: function() {
        var self = this;
        this.bg.getThorCookie(function(cookie) {
            self.thorCookie = cookie.value;
            self.init();
        });
    },
    init: function() {

        var searchUrl = this.url = localStorage.getItem('searchUrl');
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
    vaild: function() {
        chrome.tabs.getSelected(null, function(tab) {
            console.log(tab.url);
            if (!(/http:\/\/dr.jd.com\/page\/find_list/.test(tab.url))) {
                $('.message-fix').show();
            }
        });
    },
    fetchList: function(url) {
        var self = this;
        console.log("fetch list:", url)

        ajax.shopList({ url: escape(url) }).then(function(data) {
            self.pageCount = data.pageCount;
            console.log("pageCount:", self.pageCount)
            var data = data.list;
            if (!data.length) {
                $(".reload-fix").hide();
                $('.shopList').append("<p>该链接下没有找到商品</p>");
                return;
            }
            //show all at first
            data.forEach(function(item, idx) {

                var startIndex = item.link.lastIndexOf('/');
                var endIndex = item.link.lastIndexOf('.');
                var id = item.link.slice(startIndex + 1, endIndex);
                item.skuId = id;
                if (self.deduper.hasOne(id)) {
                    console.log("dup is found:", id, item.link, item.shopName);
                    next();
                } else {
                    self.deduper.addOne(id);
                    //                    self.showItemFast(item, id);
                    self.showItemDetail(item, item.skuId);

                }
            })

            //get details to do filter
            /*
            var idx = 0;
            var $items = $(".commodity-item");
            next();

            function next() {
                if (idx >= $items.length) {
                    return;
                }

                var $item = $($items[idx]);
                var item = data[idx];
                idx++;
                console.log(item);
                self.showItemDetail(item, item.skuId, $item, next);
            }
            */
        })
    },
    addListener: function() {
        var self = this;
        $('.modal span').click(function() {
            $('.message-fix').hide();
        })

        $('.search-input').keypress(function(e) {
            if (e.which == 13) {
                $('.fa-search').click();
            }
        })
        $('.fa-search').click(function() {
            if ($('.search-input').val() == "") return;
            self.url = $('.search-input').val();

            if (self.url.indexOf("page=") === -1) {
                self.url = self.url.replace(/\?/, "?page=1&");
            }

            self.deduper = makeDedupObj();

            localStorage.setItem('searchUrl', self.url);

            $('.shopList').html("");
            $('.reload-fix').show();
            self.shopList = {};
            self.brandList = {};

            self.pageIdx = getPageIdx(self.url);
            console.log("start page at idx:", self.pageIdx);
            self.fetchList(self.url);
        })

        $('.shopList').on("click", ".addToPic", function() {
            self.bg.sendData({
                skuId: $(this).attr("data-id"),
                imgUrl: $(this).attr("data-imgUrl"),
                fifthImg: $(this).attr("data-fifthImg")
            });
        })

        $('.shopList').scroll(function() {
            localStorage.setItem('shopListTop', $('.shopList').scrollTop());
        });
        // $('.shopList').scroll(function() {
        //     localStorage.setItem('shopListTop', $('.shopList').scrollTop());
        //     if (timer) {
        //         return;
        //     }
        //     var timer = setTimeout(function() {
        //         timer = null;
        //         if (self.checkSlide()) {
        //             if (self.pageIdx >= self.pageCount) {
        //                 console.log("no more page");
        //                 return;
        //             }
        //             //next page
        //             var nextPageNum;
        //             self.pageIdx++;
        //             if (self.url.indexOf("search.jd.com") !== -1) {
        //                 nextPageNum = self.pageIdx * 2 - 1;
        //             } else {
        //                 nextPageNum = self.pageIdx;
        //             }
        //             console.log("go to page:", nextPageNum);
        //             self.url = self.url.replace(/page=[0-9]*/i, "page=" + nextPageNum);
        //             self.fetchList(self.url);
        //         }
        //     }, 300)
        //})

    },
    /*showItemFast: function(option, id) {
        $('.reload-fix').hide();
        option.id = id;
        option.cpsPrice = "获取中...";
        option.price = "获取中..."

        $('.shopList').append(ajax.replaceStr(this.shopTpl, option));
        localStorage.setItem('shopList', $('.shopList').html());
    },*/
    showItemDetail: function(option, id, next) {
        var self = this;

        ajax.shopDetail({ skuId: id, thorCookie: self.thorCookie }).then(function(value) {

            //next && next();

            function clearItem() {
                // console.log("clear item", id);
                //    $item.remove();
            }

            option.id = value.skuID;
            option.price = value.price;
            option.cpsPrice = value.cpsPrice;
            option.name = value.title;
            option.imgUrl = "//m.360buyimg.com/" + value.imgList[0]
            if (value.cpsPrice != '0') {
                if (self.isOver3(self.shopList, option.shopName)) {
                    console.log("ignore item with shopName:", option.shopName);
                    clearItem();
                    return;
                }

                $.get(host + "/ds/jddr/commodity-more-details", {
                    skuId: id
                }).then(function(data) {
                    if (self.isOver3(self.brandList, data.brandName)) {
                        console.log("ignore item with brandName: ", data.brandName);
                        clearItem();
                        return;
                    }
                    option.fifthImg = data.fifthImg;
                    // console.log("replace commodity item")
                    // $item.replaceWith(ajax.replaceStr(self.shopTpl, option));
                    $('.shopList').append(ajax.replaceStr(self.shopTpl, option));
                    localStorage.setItem('shopList', $('.shopList').html());
                    $('.reload-fix').hide();

                }, function(err) {
                    console.log("failed to get more details: ", err);
                    clearItem();
                })
            } else {
                clearItem();
            }
        }, function(err) {
            //  next && next();
            console.log("failed to get details:", err)
            clearItem();
        })
    },
    isOver3: function(list, name) {
        if (!name) {
            return false;
        }
        list[name] = list[name] || 0;
        list[name] += 1;

        return list[name] > 3;
    },
    checkSlide: function() {
        var $lastItem = $(".shopList li").last();
        if ($lastItem.length === 0) {
            return true;
        }
        var lastShopTop = $lastItem.get(0).offsetTop + ($lastItem.outerHeight()) / 2;

        var winH = $(".shopList").scrollTop() + $(".shopList").outerHeight();

        console.log("lastShopTop:", lastShopTop, "winH:", winH);
        return (winH + 200 > lastShopTop) ? true : false;
    }
}

var list = new ShopList();
list.getThorCookie();
list.vaild();
list.addListener();

function getPageIdx(jdListUrl) {
    var m = jdListUrl && jdListUrl.match(/page=([0-9]*)/i);
    return (m && m[1]) || 0;
}

function makeDedupObj() {
    var ids = {};

    return {
        reset: function() {
            ids = {};
        },
        hasOne: function(id) {
            return !!ids[id]
        },
        addOne: function(id) {
            ids[id] = true;
        }
    }
}

//login
var host = "http://jddr-api.jymao.com"
$.get(host + "/ds/has-login")
    .then(function(res) {
        var hasLogin = res.hasLogin;
        if (hasLogin) {
            $(".my-name").text(res.name)
            $(".page-item").show();
            $(".login").hide();
            //$(".nav-item.home-item").click();

        } else {
            $(".page-item").hide();
            $(".login").show()
        }
    })

$(".logoutBtn").click(function() {
    $.post(host + "/ds/logout")
        .then(function(res) {
            $(".page-item").hide();
            $(".login").show();

        })
})

$(".login .password input").keyup(function() {
    $(".password-error").text("").hide();
})

$(".loginBtn").click(function() {
    var name = $(".login .user-name input").val();
    var password = $(".login .password input").val();
    $.post(host + "/ds/login", {
        name: name,
        password: password
    }).then(function(res) {
        if (res.msg === "login ok") {
            $(".my-name").text(res.user && res.user.name)
            $(".page-item").show();
            $(".login").hide();
            $(".nav-item.home-item").click();
        }
    }, function(err) {
        var res = JSON.parse(err.responseText);
        if (res.msg === "mismatch") {
            $(".password-error").text("密码错误").show();
        } else {
            $(".password-error").text("登录失败").show();
        }
    })
    return false;
})

/*底部导航点击*/
$(".nav-item").click(function() {
    $(".equal-header .page-name").text($(this).find("p").text());
    if (!$(this).hasClass('on')) {
        localStorage.setItem("navIndex", $(this).index());
        $(this).addClass("on").siblings().removeClass("on");
        if ($(this).hasClass('home-item')) {
            $('.home').css('transform', 'translateX(0)');
            $('.user').css('transform', 'translateX(320px)');
        } else {
            $('.user').css('transform', 'translateX(0)');
            $('.home').css('transform', 'translateX(320px)');
        }
    }
})

/*忘记密码的展开*/
$(".lose-title").click(function() {
    $(".lose-content").slideToggle();
    $(".success").hide();
    $(".lose-content input").val("");
})

/*新密码校验*/
$(".confirm-pwd").blur(function() {
    if ($(this).val() != $('.pwd').val() || $(this).val() == "") {
        $('.error').text('两次输入密码不一致').show();
    } else {
        $('.error').hide();
    }
})
$(".pwd").blur(function() {
    if ($('.confirm-pwd').val() != "" && $(this).val() != $('.confirm-pwd').val()) {
        $('.error').text('两次输入密码不一致').show();
    } else {
        $('.error').hide();
    }
})

$(".changeBtn").click(function() {
    var oldPwd = $(".old-pwd").val();
    var newPwd = $(".pwd").val();
    var confirmPwd = $(".confirm-pwd").val();
    if (newPwd === confirmPwd) {
        $.post(host + "/ds/user/new-password", { newPwd: newPwd, oldPwd: oldPwd })
            .then(function() {
                $(".success").text("修改成功").show();
                $(".lose-content input").val("");
            }, function(err) {
                $(".error").text("修改失败.").show();
            })
    }
})

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