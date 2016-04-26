//用的时候直接cats[name] = value
//'cat1': 1,
//'cat2': 0
//0:存活 1:踩猫窝 字符串:被该猫捉
//'mouse1': 'cat1',
//'mouse2': 1
var _grade = {
    remainTime: '01:40',
    cats: new Array(),
    mice: new Array()
};

var OverLayer = cc.LayerColor.extend({
    ctor:function () {
        //this._super();
        allowClick=1;
        //注销所有socket监听
        for(var listener in sio_client.$events){
            if(listener != undefined){
                sio_client.removeAllListeners(listener);
            }
        }

        this._super(cc.color(0, 0, 255, 255));
        var size = cc.director.getWinSize();

        var grad = new Object();
        grad.remainTime = _grade.remainTime;
        grad.cats = new Array();
        grad.mice = new Array();
        var ss;
        for (var cat in _grade.cats) {
            ss = new Object();
            ss.name = cat;
            ss.info = _grade.cats[cat];
            grad.cats[grad.cats.length] = ss;
        }
        for(var mouse in _grade.mice){
            ss = new Object();
            ss.name = mouse;
            ss.info = _grade.mice[mouse];
            grad.mice[grad.mice.length] = ss;
        }
        sio_client.emit("game_over", grad);

        var listView = new ccui.ListView();
        listView.setDirection(ccui.ScrollView.DIR_VERTICAL);
        listView.setTouchEnabled(true);
        listView.setBounceEnabled(true);
        listView.setContentSize(cc.size(size.width, 230));
        listView.x = 0;
        listView.y = 90;
        this.addChild(listView);
        var default_item = new ccui.Layout();
        default_item.setTouchEnabled(true);
        default_item.setContentSize(cc.size(size.width, 50));
        default_item.width = listView.width;
        listView.setItemModel(default_item);
        listView.setGravity(ccui.ListView.GRAVITY_CENTER_VERTICAL);

        var nums = 0;
        for (var cat in _grade.cats) {
            ++nums;
        }
        for (var mouse in _grade.mice) {
            ++nums;
        }

        for (var i = 0;i < nums; ++i) {
            listView.pushBackDefaultItem();
        }

        var h = size.height;
        var labels = {};
        labels.tlabel = new cc.LabelTTF('剩余时间', 'Arial', 38);
        labels.tlabel.x = size.width / 2;
        labels.tlabel.y = (h -= 50);
        labels.tlabel.opacity = 0;
        this.addChild(labels.tlabel);

        labels.timeLabel = new cc.LabelTTF(_grade.remainTime, 'Arial', 38);
        labels.timeLabel.x = size.width / 2;
        labels.timeLabel.y = (h -= 50);
        labels.timeLabel.opacity = 0;
        this.addChild(labels.timeLabel);

        var hh = -20;
        for (var cat in _grade.cats) {
            labels[cat] = new cc.LabelTTF(cat + ' 捉住 ' +
                _grade.cats[cat] + ' 老鼠', 'Arial', 35);
            var l = new ccui.Layout();
            labels[cat].setContentSize(cc.size(size.width, 40));
            labels[cat].x = size.width / 2;
            labels[cat].y = hh;
            hh -= 40;
            labels[cat].opacity = 0;
            l.addChild(labels[cat]);
            listView.insertCustomItem(l,0);
        }

        hh -= 20;
        for (var mouse in _grade.mice) {
            var str = '';
            //0:存活 1:踩猫窝 字符串:被该猫捉
            if (typeof _grade.mice[mouse] === 'number') {
                if (_grade.mice[mouse]) {
                    str = mouse + ' 进入猫窝，老鼠获得胜利!';
                } else {
                    str = mouse + ' 存活';
                }
            } else {
                str = mouse + ' 被 ' + _grade.mice[mouse] + ' 捉住';
            }
            labels[mouse] = new cc.LabelTTF(str ,
                'Arial', 35);
            var l = new ccui.Layout();
            labels[mouse].setContentSize(cc.size(size.width, 40));
            labels[mouse].x = size.width / 2;
            labels[mouse].y = hh;
            hh -= 40;
            labels[mouse].opacity = 0;
            l.addChild(labels[mouse]);
            listView.insertCustomItem(l,0);
        }


        var delTime = 600;
        //var fadeIn = cc.fadeIn(delTime / 1000);
        var inc = 0;
        setTimeout(function() {
            labels.tlabel.runAction(cc.fadeIn(delTime / 1000));
        }, delTime * inc);
        ++inc;
        setTimeout(function() {
            labels.timeLabel.runAction(cc.fadeIn(delTime / 1000));
        }, delTime * inc);
        ++inc;
        for (var cat in _grade.cats) {
            (function(cat, inc) {
                setTimeout(function() {
                    labels[cat].runAction(cc.fadeIn(delTime / 1000));
                }, delTime * inc);
            })(cat, inc);
            ++inc;
        }
        for (var mouse in _grade.mice) {
            (function(mouse, inc) {
                setTimeout(function() {
                    labels[mouse].runAction(cc.fadeIn(delTime / 1000));
                }, delTime * inc);
            })(mouse, inc);
            ++inc;
        }

        var buttonGoIndex = new ccui.Button();
        buttonGoIndex.setTouchEnabled(true);
        buttonGoIndex.loadTextures(res.button, res.buttonPressed);
        buttonGoIndex.setTitleText('回到首页');
        buttonGoIndex.x = 300;
        buttonGoIndex.y = 50;
        buttonGoIndex.addTouchEventListener(this.goIndex, this);
        this.addChild(buttonGoIndex);

        var buttonPlayAgain = new ccui.Button();
        buttonPlayAgain.setTouchEnabled(true);
        buttonPlayAgain.loadTextures(res.button, res.buttonPressed);
        buttonPlayAgain.setTitleText('再玩一局');
        buttonPlayAgain.x = 500;
        buttonPlayAgain.y = 50;
        buttonPlayAgain.addTouchEventListener(this.playAgain, this);
        this.addChild(buttonPlayAgain);

        return true;
    },

    goIndex: function(sender, type) {
        switch (type) {
            case ccui.Widget.TOUCH_ENDED:
                console.log('回到首页');
                sio_client.emit("back_to_index","0");
                cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new welcomeScene()));
                break;
        }
    },

    playAgain: function(sender, type) {
        switch (type) {
            case ccui.Widget.TOUCH_ENDED:
                console.log('再玩一局');
                //sio_client.emit("play_again","0");
                //直接切换到匹配场景
                cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new GameScene()));
                break;
        }
    }
});

var OverScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new OverLayer();
        this.addChild(layer);
    }
});

