/**
 * Created by Ranger_Sky on 2016/2/15.
 */

var TEXT_INPUT_FONT_NAME = "Arial";
var TEXT_INPUT_FONT_SIZE = 36;

var nameId="";          //可用来识别客户端的名字id

var textInputGetRect = function (node) {
    var rc = cc.rect(node.x, node.y, node.width, node.height);
    rc.x -= rc.width / 2;
    rc.y -= rc.height / 2;
    return rc;
};

var welcomeLayer = cc.Layer.extend({
    ctor:function() {
        this._super();
        this.init();
    },

    title:function (flag) {
        if(flag==1){
            return "连接服务器成功,输入你的大名";
        }else{
            return "连接服务器失败,请检查网络";
        }
    },

    subtitle: function(){
        return "名字已经被使用，或名字为空，请重新输入";
    },

    addKeyboardNotificationLayer:function (layer) {
        this.notificationLayer = layer;
        this.addChild(layer);
    },

    //放标题和副标题
    onEnter:function () {
        this._super();

        var _Layer = this;
        var winSize = cc.director.getWinSize();

        //sio_client= SocketIO.connect("http://127.0.0.1:3000");
        sio_client= SocketIO.connect("http://115.159.126.192:3000");

        sio_client.on("connect",function(){
            //cc.log("connect_success ");
            var label = new cc.LabelTTF(_Layer.title(1), "Arial", 24);
            _Layer.addChild(label);
            label.x = winSize.width / 2;
            label.y = winSize.height - 50;
        });

        sio_client.on("error", function(){
            var label = new cc.LabelTTF(_Layer.title(0), "Arial", 24);
            _Layer.addChild(label);
            label.x = winSize.width / 2;
            label.y = winSize.height - 50;
        });

        sio_client.on("rename", function(){
            //cc.log("rename be trigger");
            var subTitle = _Layer.subtitle();
            var l = new cc.LabelTTF(subTitle, "Arial", 16);
            _Layer.addChild(l, 1);
            l.x = winSize.width / 2;
            l.y = winSize.height - 80;
        });

        sio_client.on("joinSuccess", function(){
            cc.director.runScene(new cc.TransitionProgressRadialCCW(0.5, new GameScene()));
        });
    }
});

var KeyboardNotificationLayer = welcomeLayer.extend({
    _trackNode:null,
    _beginPos:null,

    ctor:function () {
        this._super();

        if( 'touches' in cc.sys.capabilities ){
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                onTouchesEnded: this.onTouchesEnded
            }, this);
        }else if ('mouse' in cc.sys.capabilities )
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseUp: this.onMouseUp
            }, this);
    },

    onClickTrackNode:function (clicked) {
    },

    keyboardWillShow:function (info) {

        if (!this._trackNode)
            return;

        var rectTracked = textInputGetRect(this._trackNode);

        // if the keyboard area doesn't intersect with the tracking node area, nothing need to do.
        if (!cc.rectIntersectsRect(rectTracked, info.end))
            return;

        // assume keyboard at the bottom of screen, calculate the vertical adjustment.
        var adjustVert = cc.rectGetMaxY(info.end) - cc.rectGetMinY(rectTracked);

        // move all the children node of KeyboardNotificationLayer
        var children = this.children;
        for (var i = 0; i < children.length; ++i) {
            var node = children[i];
            node.y += adjustVert;
        }
    },

    onTouchesEnded:function (touches, event) {
        var target = event.getCurrentTarget();
        if (!target._trackNode)
            return;

        // grab first touch
        if(touches.length == 0)
            return;

        var touch = touches[0];
        var point = touch.getLocation();

        var rect = textInputGetRect(target._trackNode);
        target.onClickTrackNode(cc.rectContainsPoint(rect, point));
    },

    onMouseUp:function (event) {
        var target = event.getCurrentTarget();
        if (!target._trackNode)
            return;

        var point = event.getLocation();

        var rect = textInputGetRect(target._trackNode);

        target.onClickTrackNode(cc.rectContainsPoint(rect, point));
    }
});


var TextFieldTTFActionTest = KeyboardNotificationLayer.extend({
    _box1: null,
    _textField:null,
    _textFieldAction:null,
    _action:false,
    _charLimit:0, // the textfield max char limit

    ctor:function () {
        this._super();
        cc.associateWithNative(this, cc.Layer);
    },

    callbackRemoveNodeWhenDidAction:function (node) {
        this.removeChild(node, true);
    },

    // KeyboardNotificationLayer

    onClickTrackNode:function (clicked) {
        var textField = this._trackNode;
        if (clicked) {
            // TextFieldTTFTest be clicked
            textField.attachWithIME();
        } else {
            // TextFieldTTFTest not be clicked
            textField.detachWithIME();
        }
    },

    //CCLayer
    onEnter:function () {
        this._super();
        this._charLimit = 20;

        var winSize = cc.director.getWinSize();
        var name_label = new cc.LabelTTF("本轮昵称", "Arial", 24);
        name_label.x = winSize.width/2-150;
        name_label.y = winSize.height/2+50;
        this.addChild(name_label);
        this._box1 = new cc.EditBox(cc.size(400, 50), new cc.Scale9Sprite(res.green_edit), new cc.Scale9Sprite(res.orange_edit));
        this._box1.x = winSize.width/2;
        this._box1.y = winSize.height/2;
        this._box1.setFontColor(cc.color(255, 255, 255));
        this._box1.setDelegate(this);
        this.addChild(this._box1);

        //add play button
        var label = new cc.LabelBMFont("play", res.bitmapFontTest3_fnt);
        var item = new cc.MenuItemLabel(label, this.clickPlay, this);
        var menu = new cc.Menu(item);
        menu.x = 0;
        menu.y = 0;
        item.x = winSize.width / 101 * 50;
        item.y = winSize.height / 4;
        this.addChild(menu);
    },

    clickPlay: function(sender){
        var winSize = cc.director.getWinSize();
        if(this._textField == null)
            nameId = this._box1.getString();
        else
            nameId = this._textField.getString();

        var packet = new Object();
        packet.nameId = nameId;

        console.log("名字："+nameId);

        sio_client.emit("sendName", packet);
    },

    //CCTextFieldDelegate
    onTextFieldAttachWithIME:function (sender) {
        if (!this._action) {
            this._textField.runAction(this._textFieldAction);
            this._action = true;
        }
        return false;
    },
    onTextFieldDetachWithIME:function (sender) {
        if (this._action) {
            this._textField.stopAction(this._textFieldAction);
            this._textField.opacity = 255;
            this._action = false;
        }
        return false;
    },

    onTextFieldInsertText:function (sender, text, len) {
        // if insert enter, treat as default to detach with ime
        if ('\n' == text) {
            return false;
        }

        // if the textfield's char count more than m_nCharLimit, doesn't insert text anymore.
        if (sender.getCharCount() >= this._charLimit) {
            return true;
        }

        // create a insert text sprite and do some action
        var label = new cc.LabelTTF(text, TEXT_INPUT_FONT_NAME, TEXT_INPUT_FONT_SIZE);
        this.addChild(label);
        var color = cc.color(226, 121, 7);
        label.color = color;

        // move the sprite from top to position
        var endX = sender.x, endY = sender.y;
        if (sender.getCharCount()) {
            endX += sender.width / 2;
        }

        var duration = 0.5;
        label.x = endX;
        label.y = cc.director.getWinSize().height - label.height * 2;
        label.scale = 8;

        var seq = cc.sequence(
            cc.spawn(
                cc.moveTo(duration, cc.p(endX, endY)),
                cc.scaleTo(duration, 1),
                cc.fadeOut(duration)),
            cc.callFunc(this.callbackRemoveNodeWhenDidAction, this));
        label.runAction(seq);
        return false;
    },

    onTextFieldDeleteBackward:function (sender, delText, len) {
        // create a delete text sprite and do some action
        var label = new cc.LabelTTF(delText, TEXT_INPUT_FONT_NAME, TEXT_INPUT_FONT_SIZE);
        this.addChild(label);

        // move the sprite to fly out
        var beginX = sender.x, beginY = sender.y;
        beginX += (sender.width - label.width) / 2.0;

        var winSize = cc.director.getWinSize();
        var endPos = cc.p(-winSize.width / 4.0, winSize.height * (0.5 + Math.random() / 2.0));

        var duration = 1;
        var rotateDuration = 0.2;
        var repeatTime = 5;
        label.x = beginX;
        label.y = beginY;

        var seq = cc.sequence(
            cc.spawn(
                cc.moveTo(duration, endPos),
                cc.rotateBy(rotateDuration, (Math.random() % 2) ? 360 : -360).repeat(repeatTime),
                cc.fadeOut(duration)),
            cc.callFunc(this.callbackRemoveNodeWhenDidAction, this));
        label.runAction(seq);
        return false;
    },
    onDraw:function (sender) {
        return false;
    }
});

var welcomeScene = cc.Scene.extend({
    onEnter: function(){
        this._super();

        var layer = new TextFieldTTFActionTest();
        this.addChild(layer);
    }
});