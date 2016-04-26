
var self_sprite = 100;
var self_viewId = 101;

var sprite_id = 100;        //预热阶段用的精灵tag
var view_id =101;           //预热阶段用的视野tag
var self_team=-1;

var allowClick=1;   //当allowclick=0时，点击事件无法生效


//socket首先被welcome.js的场景使用
var sio_client;
window.io;
var SocketIO = SocketIO || window.io;

var gameResult = [0,0];

var player = new Array();
var playerNumToStart = 4;


var BlackCloudLayer = cc.Layer.extend({

    waitLabel:null,
    timeCountDownLayer: null,

    ctor: function(){
        this._super();
        var winSize = cc.director.getWinSize();

        var bl = new basicLayer();
        bl.fogLayer = this;

        //初始化背景图片，即战争迷雾
        var bg = new cc.Sprite(res.shadowMap);
        bg.x = winSize.width/2;
        bg.y = winSize.height/2;
        this.addChild(bg,0);

        //游戏地图被迷雾覆盖
        var clipping = new cc.ClippingNode();
        clipping.alphaThreshold = 0.05;

        bl.clipping = clipping;
        this.addChild(clipping,1);
        clipping.addChild(bl,1);

        //没有裁剪模板时会报错,象征性的模板，没有实际意义
        var stencil = new cc.DrawNode();
        stencil.drawRect(cc.p(0,0), cc.p(1,1), cc.color(0,0,0),1,cc.color(0,0,0));
        clipping.stencil = stencil;
    }
});


var basicLayer = cc.Layer.extend({

    waitLabel:null,
    timeCountDownLayer: null,

    fogLayer: null,
    clipping: null,
    bg: null,

    mouse_sprite: new Array(),
    cat_sprite: new Array(),

    //cat_house: [{posx: 387.5, posy:312.5},{posx: 387.5, posy:337.5},{posx: 412.5, posy:312.5},{posx: 412.5, posy:337.5}],
    cat_house: new Array(),

    //持续监听函数
    listenerByTime: function(){
        if(player.length == playerNumToStart){
            var sp = this.getChildByTag(self_sprite);
            if(pathFind.checkIsDoor({posx:sp.x, posy:sp.y})){
                var pos = pathFind.getPairedDoorCoord({posx:sp.x, posy:sp.y});
                sp.setPosition(cc.p(pos.posx, pos.posy));
                this.clipping.stencil.getChildByTag(self_viewId).setPosition(cc.p(pos.posx, pos.posy));
                sio_client.emit("self_enter_door", {posx: pos.posx, posy: pos.posy, spriteId: self_sprite, viewId: self_viewId});
            }

            if(typeof(_grade.cats[this.cat_sprite[0].nname])=="undefined") {
                _grade.cats[this.cat_sprite[0].nname] = 0;
                _grade.cats[this.cat_sprite[1].nname] = 0;
                _grade.mice[this.mouse_sprite[0].nname] = 0;
                _grade.mice[this.mouse_sprite[1].nname] = 0;
            }

            //猫赢的判定
            if(gameResult[0]==1 && gameResult[1] ==1){
                //cc.log("cat win");
                if(this.timeCountDownLayer.second>=10){
                    _grade.remainTime = "0"+this.timeCountDownLayer.minute+":"+this.timeCountDownLayer.second;
                }else{
                    _grade.remainTime = "0"+this.timeCountDownLayer.minute+":"+"0"+this.timeCountDownLayer.second;
                }
                cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new OverScene()));
            }else{
                var mouseRect1 = this.mouse_sprite[0].getBoundingBox();
                var mouseRect2 = this.mouse_sprite[1].getBoundingBox();
                var catRect1 = this.cat_sprite[0].getBoundingBox();
                var catRect2 = this.cat_sprite[1].getBoundingBox();

                //if 老鼠1还活着
                if(this.mouse_sprite[0].state==0){
                    if(cc.rectIntersectsRect(mouseRect1, catRect1)){    //老鼠1被猫1抓
                        this.mouse_sprite[0].state=1;
                        _grade.cats[this.cat_sprite[0].nname]++;
                        _grade.mice[this.mouse_sprite[0].nname]=this.cat_sprite[0].nname;
                        if(this.mouse_sprite[0].nname == nameId){
                            allowClick=0;
                        }
                        gameResult[0]=1;
                        this.someoneBeCatch(this.mouse_sprite[0], this.cat_sprite[0]);
                    }
                    if(cc.rectIntersectsRect(mouseRect1, catRect2)){    //老鼠1被猫2抓
                        this.mouse_sprite[0].state=1;
                        _grade.cats[this.cat_sprite[1].nname]++;
                        _grade.mice[this.mouse_sprite[0].nname]=this.cat_sprite[1].nname;
                        if(this.mouse_sprite[0].nname == nameId){
                            allowClick=0;
                        }
                        gameResult[0]=1;
                        this.someoneBeCatch(this.mouse_sprite[0], this.cat_sprite[1]);
                    }
                }
                //如果老鼠2还活着
                if(this.mouse_sprite[1].state==0){
                    if(cc.rectIntersectsRect(mouseRect2, catRect1)){    //老鼠2被猫1抓
                        this.mouse_sprite[1].state=1;
                        _grade.cats[this.cat_sprite[0].nname]++;
                        _grade.mice[this.mouse_sprite[1].nname]=this.cat_sprite[0].nname;
                        if(this.mouse_sprite[1].nname == nameId){
                            allowClick=0;
                        }
                        gameResult[1]=1;
                        this.someoneBeCatch(this.mouse_sprite[1], this.cat_sprite[0]);
                    }
                    if(cc.rectIntersectsRect(mouseRect2, catRect2)){    //老鼠2被猫2抓
                        this.mouse_sprite[1].state=1;
                        _grade.cats[this.cat_sprite[1].nname]++;
                        _grade.mice[this.mouse_sprite[1].nname]=this.cat_sprite[1].nname;
                        if(this.mouse_sprite[1].nname == nameId){
                            allowClick=0;
                        }
                        gameResult[1]=1;
                        this.someoneBeCatch(this.mouse_sprite[1], this.cat_sprite[1]);
                    }
                }
            }

            //老鼠赢的判定
            //老鼠到猫窝
            for(var i=0; i<this.cat_house.length; i++){
                var xx_low = this.cat_house[i].posx-1;
                var xx_high = this.cat_house[i].posx+1;
                var yy_low = this.cat_house[i].posy-1;
                var yy_high = this.cat_house[i].posy+1;
                for(var j=0; j<this.mouse_sprite.length; j++) {
                    if (this.mouse_sprite[j].x >= xx_low && this.mouse_sprite[j].x <= xx_high && this.mouse_sprite[j].y >= yy_low && this.mouse_sprite[j].y <= yy_high) {
                        if (this.timeCountDownLayer.second >= 10) {
                            _grade.remainTime = "0" + this.timeCountDownLayer.minute + ":" + this.timeCountDownLayer.second;
                        } else {
                            _grade.remainTime = "0" + this.timeCountDownLayer.minute + ":" + "0" + this.timeCountDownLayer.second;
                        }
                        _grade.mice[this.mouse_sprite[0].nname]=1;
                        cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new OverScene()));
                        //cc.log("mouse win");
                        break;
                    }
                }
            }
            //时间到
            if(this.timeCountDownLayer.minute==0 && this.timeCountDownLayer.second==0){
                cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new OverScene()));
                _grade.remainTime="时间到，老鼠获得胜利!";
                //cc.log("mouse win");
            }
        }
    },

    ctor: function(){
        this._super();
        cc.director.setProjection(cc.Director.PROJECTION_2D);
        cc.FIX_ARTIFACTS_BY_STRECHING_TEXEL = 1;
        //初始化全局变量
        self_sprite = 100;
        self_viewId = 101;
        self_team=-1;
        allowClick=1;
        gameResult = [0,0];
        player.length=0;
        this.mouse_sprite=[];
        this.cat_sprite=[];
        _grade.remainTime="";
        _grade.cats=[];
        _grade.mice=[];

        //初始化地图
        var map = new cc.TMXTiledMap(res.tileMap);
        this.addChild(map,-1);
        pathFind.init(map);
        this.cat_house = pathFind.getCatHouse();
        //持续监听器
        this.schedule(this.listenerByTime, 0.1);

    },

    onEnter: function() {
        this._super();
        var _Layer = this;

        sio_client.emit("enter_game_scene","0");

        //匹配到足够数量的玩家，可以开始了
        sio_client.on("time_to_start",function(){
            _Layer.fogLayer.removeChild(_Layer.fogLayer.waitLabel);
            _Layer.removeChild(_Layer.waitLabel);

            //向服务器发送请求,重新初始化游戏核心数据
            sio_client.emit("enter_room_init_data","0");

            //游戏即将开始，暂时禁止点击事件的响应
            allowClick=0;

            //初始化计时器
            var tl1 = new timeLayer();
            var tl2 = new timeLayer();
            _Layer.fogLayer.timeCountDownLayer = tl1;
            _Layer.timeCountDownLayer = tl2;
            _Layer.fogLayer.addChild(tl1,1);
            _Layer.addChild(tl2,1);
            tl1.trigger=1;
            tl2.trigger=1;
        });

        //没有匹配到足够多人，等待其他玩家进入
        sio_client.on("wait_other_player", function(data){

            //等待提示文字
            var waitTip1 = new waitLayer();
            var waitTip2 = new waitLayer();
            _Layer.fogLayer.waitLabel = waitTip1;
            _Layer.waitLabel = waitTip2;
            _Layer.fogLayer.addChild(waitTip1 ,1);
            _Layer.addChild(waitTip2, 1);
        });

        sio_client.on("pre_game", function(data){
            var self_player_data = JSON.parse(data);
            _Layer.deal_pre_game(self_player_data);
        });

        sio_client.on("init_data_to_start", function(data){
            var all_data = JSON.parse(data);
            _Layer.deal_start_game(all_data);
        });

        sio_client.on("otherMove", function(data){
            var obj = JSON.parse(data);
            _Layer.moveOtherBall(obj);
        });

        sio_client.on("someone_enter_door", function(data){
            var obj = JSON.parse(data);
            _Layer.someoneEnterDoor(obj);
        });

        sio_client.on("player_id_exit", function(data){
            var obj = JSON.parse(data);
            //cc.log("in game ,one player exit");
            _Layer.removeChildByTag(obj.id);
            _Layer.clipping.stencil.removeChildByTag(obj.viewId);
            for(var i=0; i<player.length; i++){
                if(obj.id == player[i].id){
                    player.slice(i,1);
                }
            }
        });
        //监听鼠标点击和触摸事件
        if ("touches" in cc.sys.capabilities) {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (event) {
                    _Layer.moveSelfBall(event.getLocation());
                }
            }, _Layer);
        } else {
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseDown: function (event) {
                    _Layer.moveSelfBall(event.getLocation());
                }
            }, _Layer);
        }
    },

    someoneBeCatch:function(mouseSprite, catSprite){
        var _Layer = this;
        var winSize = cc.director.getWinSize();
        var str1 = catSprite.nname+"抓住了"+mouseSprite.nname;
        var info1 = new cc.LabelTTF(str1 ,'Arial', 30);
        var info2 = new cc.LabelTTF(str1 ,'Arial', 30);
        info1.x = winSize.width/2;
        info1.y = winSize.height*5/6;
        info2.x = winSize.width/2;
        info2.y = winSize.height*5/6;
        this.addChild(info1,1);
        this.fogLayer.addChild(info2,1);
        setTimeout(function(){
            _Layer.removeChild(info1);
            _Layer.fogLayer.removeChild(info2);
        },2500);
    },

    someoneEnterDoor: function(obj){
        var sp = this.getChildByTag(obj.spriteId);
        sp.setPosition(cc.p(obj.posx, obj.posy));
        this.clipping.stencil.getChildByTag(obj.viewId).setPosition(cc.p(obj.posx, obj.posy));
    },

    moveOtherBall: function(obj){
        for(var i=0; i<player.length; i++){
            if(player[i].name == obj.name){
                var otherBall = this.getChildByTag(player[i].id);
                //cc.log(otherBall.x+","+otherBall.y);
                otherBall.stopAllActions();

                if(this.clipping.stencil.getChildByTag(player[i].viewId)!=null){
                    this.clipping.stencil.getChildByTag(player[i].viewId).stopAllActions();
                }

                var posx0 = otherBall.x, posy0 = otherBall.y, posx1 = obj.clickx, posy1 = obj.clicky;

                var path=pathFind.search({posx: posx0, posy: posy0}, {posx: posx1, posy: posy1});
                var action, action1;
                for(var j=0; j<path.length; j++){
                    if(j==0) {
                        if(player[i].team==2) {     //如果是猫
                            action = cc.moveTo(25 / 200, cc.p(path[j].posx, path[j].posy));
                            action1 = cc.moveTo(25 / 200, cc.p(path[j].posx, path[j].posy));
                        }else{
                            action = cc.moveTo(25 / 150, cc.p(path[j].posx, path[j].posy));
                            action1 = cc.moveTo(25 / 150, cc.p(path[j].posx, path[j].posy));
                        }
                    }else{
                        if(player[i].team==2) {     //如果是猫
                            action = cc.sequence(action, cc.moveTo(25 / 200, cc.p(path[j].posx, path[j].posy)));
                            action1 = cc.sequence(action1, cc.moveTo(25 / 200, cc.p(path[j].posx, path[j].posy)));
                        }else{
                            action = cc.sequence(action, cc.moveTo(25 / 150, cc.p(path[j].posx, path[j].posy)));
                            action1 = cc.sequence(action1, cc.moveTo(25 / 150, cc.p(path[j].posx, path[j].posy)));
                        }
                    }
                }

                otherBall.runAction(action);

                if(this.clipping.stencil.getChildByTag(player[i].viewId)!=null) {
                    this.clipping.stencil.getChildByTag(player[i].viewId).runAction(action1);
                }
                break;
            }
        }
    },

    moveSelfBall: function(pos){

        if(allowClick==1) {
            var selfBall = this.getChildByTag(self_sprite);
            selfBall.stopAllActions();
            //this.clipping.stencil.stopAllActions();
            this.clipping.stencil.getChildByTag(self_viewId).stopAllActions();

            var posx0 = selfBall.x, posy0 = selfBall.y, posx1 = pos.x, posy1 = pos.y;

            var path = pathFind.search({posx: posx0, posy: posy0}, {posx: posx1, posy: posy1});
            var action , action1;

            for (var i = 0; i < path.length; i++) {
                if (i == 0) {
                    if(self_team==2) {      //如果队伍是猫
                        action = cc.moveTo(25 / 200, cc.p(path[i].posx, path[i].posy));
                        action1 = cc.moveTo(25 / 200, cc.p(path[i].posx, path[i].posy));
                    }else{
                        action = cc.moveTo(25 / 150, cc.p(path[i].posx, path[i].posy));
                        action1 = cc.moveTo(25 / 150, cc.p(path[i].posx, path[i].posy));
                    }
                } else {
                    if(self_team==2){
                        action = cc.sequence(action, cc.moveTo(25 / 200, cc.p(path[i].posx, path[i].posy)));
                        action1 = cc.sequence(action1, cc.moveTo(25 / 200, cc.p(path[i].posx, path[i].posy)));
                    }else {
                        action = cc.sequence(action, cc.moveTo(25 / 150, cc.p(path[i].posx, path[i].posy)));
                        action1 = cc.sequence(action1, cc.moveTo(25 / 150, cc.p(path[i].posx, path[i].posy)));
                    }
                }
            }

            selfBall.runAction(action);

            //视野范围跟随移动
            this.clipping.stencil.getChildByTag(self_viewId).runAction(action1);

            var data = new Object();
            data.ballx = selfBall.x;
            data.bally = selfBall.y;
            data.clickx = pos.x;
            data.clicky = pos.y;

            sio_client.emit("selfMove", data);
        }
    },

    //处理游戏匹配时间的数据
    deal_pre_game: function(self_data){
        var ball = new cc.Sprite(res.png1);
        ball.x = self_data.posx;
        ball.y = self_data.posy;
        console.log("deal_pre_game dododo");
        this.addChild(ball,1, sprite_id);

        var view = new cc.Sprite(res.view);
        view.x = self_data.posx;
        view.y = self_data.posy;
        this.clipping.stencil.addChild(view, 0, view_id);
    },

    //处理游戏正式开始的数据
    deal_start_game: function(all_data){
        player = all_data;
        console.log(all_data);
        console.log("deal_start_game dododo");
        this.removeChildByTag(sprite_id);
        this.clipping.stencil.removeChildByTag(view_id);

        for(var p=0; p<all_data.length; p++){
            if(all_data[p].name == nameId){
                self_team = all_data[p].team;
            }
        }

        for(var i=0; i<all_data.length; i++){
            if(all_data[i].name == nameId){
                //cc.log(all_data[i].name);
                //处理自己的数据
                self_sprite = all_data[i].id;
                self_viewId = all_data[i].viewId;

                var ball = new cc.Sprite(res.png1);
                ball.x = all_data[i].posx;
                ball.y = all_data[i].posy;
                ball.nname = all_data[i].name;
                ball.state = 0;  //存活， =1死亡
                this.addChild(ball,1, self_sprite);

                if(all_data[i].team ==1){
                    this.mouse_sprite[this.mouse_sprite.length]=ball;
                }else{
                    this.cat_sprite[this.cat_sprite.length]=ball;
                }

                var view = new cc.Sprite(res.view);
                view.x = all_data[i].posx;
                view.y = all_data[i].posy;
                this.clipping.stencil.addChild(view, 0, self_viewId);
            }else{
                //其他人的数据
                var ball1 = new cc.Sprite(res.png1);
                ball1.x = all_data[i].posx;
                ball1.y = all_data[i].posy;
                ball1.nname = all_data[i].name;
                ball1.state = 0;  //存活， =1死亡
                this.addChild(ball1,1, all_data[i].id);

                if(all_data[i].team ==1){
                    this.mouse_sprite[this.mouse_sprite.length]=ball1;
                }else{
                    this.cat_sprite[this.cat_sprite.length]=ball1;
                }

                //如果是盟友，共享视野
                if(self_team == all_data[i].team){
                    var vview = new cc.Sprite(res.view);
                    vview.x = ball1.x;
                    vview.y= ball1.y;
                    this.clipping.stencil.addChild(vview, 0, all_data[i].viewId);
                }
            }
        }
    }
});


//计时器Layer
var timeLayer =cc.Layer.extend({

    trigger:0,
    minute: 3,
    second: 0,
    _timeLabel: null,
    _timeString: "",

    _tipsLabel:null,
    _fixShowLabel:null,
    _showLabel:null,
    _count:5,

    ctor: function(){
        this._super();
        //5秒倒计时后游戏正式开始
        var winSize = cc.director.getWinSize();

        this._fixShowLabel = new cc.LabelBMFont("game will start", res.fnt8_fnt);
        this._fixShowLabel.setPosition(winSize.width/2, winSize.height/2+100);
        this._showLabel = new cc.LabelBMFont("5", res.fnt8_fnt);
        this._showLabel.setPosition(winSize.width/2, winSize.height/2-50);

        this.addChild(this._fixShowLabel,1);
        this.addChild(this._showLabel,1);
        this.schedule(this.countDown, 1);
    },

    timeCount: function() {
        if (this.trigger == 1) {
            if (this.second == 0) {
                this.minute--;
                this.second = 59;
            } else {
                this.second--;
            }
            if (this.second < 10) {
                this._timeString = "0" + this.minute + ":" + "0" + this.second;
            } else {
                this._timeString = "0" + this.minute + ":" + this.second;
            }
            this._timeLabel.setString(this._timeString);
        }
    },


    countDown: function(){
        this._count--;
        this._showLabel.setString(""+this._count);
        if(this._count == 4){
            var winSize = cc.director.getWinSize();
            if(self_team==2){    //身份是猫
                this._tipsLabel = new cc.LabelTTF("在本局中，你的身份是猫",'Arial', 35);
            }else{      //身份是老鼠
                this._tipsLabel = new cc.LabelTTF("在本局中，你的身份是老鼠",'Arial', 35);
            }
            this._tipsLabel.setPosition(winSize.width/2, winSize.height*5/6);
            this.addChild(this._tipsLabel,1);
        }
        //倒计时结束，游戏开始计时
        if(this._count==0){
            allowClick=1;
            this.unschedule(this.countDown);
            this.removeChild(this._tipsLabel);
            this.removeChild(this._fixShowLabel);
            this.removeChild(this._showLabel);

            var winSize = cc.director.getWinSize();
            this._timeLabel = new cc.LabelBMFont("03:00", res.fnt8_fnt);
            this._timeLabel.setPosition(winSize.width/2,winSize.height/2);
            this.addChild(this._timeLabel,1);
            this.schedule(this.timeCount, 1);
        }
    }
});


//等待其他玩家信息Layer
var waitLayer = cc.Layer.extend({

    _fixShowLabel: null,
    _showLabel: null,
    _showString: "searching...",

    _count: 5,

    ctor: function(){
        this._super();
        var winSize = cc.director.getWinSize();
        this._showLabel = new cc.LabelBMFont("searching...", res.fnt8_fnt);
        this._showLabel.setPosition(winSize.width/2,winSize.height/2);

        this.addChild(this._showLabel ,1);
        this.schedule(this.pointChange, 0.5);
    },

    pointChange: function(){
        if(this._showString == "searching..."){
            this._showString = "searching";
            this._showLabel.setString(this._showString);
        }

        else if(this._showString == "searching."){
            this._showString = "searching..";
            this._showLabel.setString(this._showString);
        }

        else if(this._showString == "searching.."){
            this._showString = "searching...";
            this._showLabel.setString(this._showString);
        }

        else if(this._showString == "searching"){
            this._showString = "searching.";
            this._showLabel.setString(this._showString);
        }
    }
});


var GameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new BlackCloudLayer();
        //var layer = new basicLayer();
        //var layer = new timeLayer();
        //var layer = new waitLayer();
        this.addChild(layer);
    }
});