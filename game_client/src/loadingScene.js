/**
 * Created by Ranger_Sky on 2016/3/20.
 * 假加载界面
 */

var loadingLayer = cc.Layer.extend({

    touchTTF:null,
    flag: 1,

    twinkle:function(){
        if(this.flag==1){
            this.flag=0;
            this.removeChild(this.touchTTF);
        }
        else{
            this.flag=1;
            this.addChild(this.touchTTF);
        }
    },

    ctor: function(){
        this._super();
        var winSize = cc.director.getWinSize();
        var loadingBg = new cc.Sprite(res.title_png);
        loadingBg.x = winSize.width/2;
        loadingBg.y = winSize.height/5*3;
        this.addChild(loadingBg);
        this.touchTTF = new cc.LabelTTF("CATCH EM ALL","Arial", 24);
        this.touchTTF.x = winSize.width/2;
        this.touchTTF.y = winSize.height/4;
        this.addChild(this.touchTTF);
        var copyright = new cc.LabelTTF("Copyright © 2016","Arial", 12);
        copyright.x = winSize.width/2;
        copyright.y = winSize.height/6;
        this.addChild(copyright);
        this.schedule(this.twinkle,0.2);
    },

    onEnter: function(){
        this._super();
        var _Layer = this;
        if ("touches" in cc.sys.capabilities) {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (event) {
                    cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new welcomeScene()));
                }
            }, _Layer);
        } else {
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseDown: function (event) {
                    cc.director.runScene(new cc.TransitionFlipAngular(1, new welcomeScene()));
                }
            }, _Layer);
        }
    }
});

var loadingScene = cc.Scene.extend({
    onEnter: function(){
        this._super();
        var layer = new loadingLayer();
        this.addChild(layer);
    }
});