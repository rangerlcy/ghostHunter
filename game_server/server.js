Array.prototype.remove=function(dx){
    if(isNaN(dx)||dx>this.length){return false;}
    for(var i=0,n=0;i<this.length;i++)
    {
        if(this[i]!=this[dx])
        {
            this[n++]=this[i]
        }
    }
    this.length-=1
};

var player = new Array();
var connect_total_number = 0;   //连接到服务器的总人数
var vacant_number = 0;      //空闲玩家数
var vacant_player = new Array();    //存放空闲玩家名字的数组
var numToGo = 4;   //当满n个人，就可以开始一局游戏
var fromNameToSocketId = new Array();   //名字和socketid的映射表
var totalGame = 0;      //当前正在进行的游戏总数
var playerNumInGameRoom = new Array();     //房间中的玩家数量
var gameRoom = new Array();             //房间对象数组

var joinRoomTempName = new Array();     //进入房间时用于存放名字的临时数组

//游戏的一些关键属性，暂时用硬编码方式
//var nname=["tom", "jack", "alex","sky","king","john"];
var iid=[723,325,687,469];
var viewid = [111,222,333,444];
var tteam = [11,21,12,22];          //队伍2是猫，队伍1是老鼠, 11表示1号老鼠,22表示2号猫
//四个出生点位
var bornPlace = [{posx: 32.5, posy:32.5}, {posx:32.5,posy:412.5},{posx:762.5,posy:412.5},{posx:762.5,posy:32.5}];


var io = require('socket.io').listen(3000);
console.log('Server on port 3000.');
//io.set('log level', 1);//将socket.io中的debug信息关闭
io.sockets.on('connection', function (socket){
    //初始化
    console.log("some people come in");

    socket.on('sendName', function (packet)
    {
        //从sendName进入游戏的标记
        socket.flag =0;

        //packet虽然是JSON.stringify()发过来的，但已经是对象
        var name = packet.nameId;

        var mark=0;
        if(name == null || name==""){
            socket.emit("rename","0");
            return;
        }
        //重名检测
        if(player.length>0){
            for(var i=0; i<player.length; i++){
                if(name== player[i].name){      //有重名，触发客户端重命名事件
                    mark=1;
                    break;
                }
            }
        }
        if(mark==0) {           //通过检测
            socket.playerName = name;           //对每个socket绑定唯一的name
            fromNameToSocketId.push({name: name, id: socket.id});
            socket.emit("joinSuccess","0");     //通知客户端进行场景切换
        }else{
            socket.emit("rename","0");
        }
    });

    //告诉服务器，客户端已经完成输入名字，进入了游戏主界面
    socket.on("enter_game_scene", function(){
            //此时初始化的都是临时数据，随便设置
            var playerData = new Object();
            playerData.id = iid[0];      //作为精灵的tag
            playerData.viewId = viewid[0];  //视野精灵id
            playerData.name = socket.playerName;
            playerData.posx = bornPlace[0].posx;
            playerData.posy = bornPlace[0].posy;
            playerData.team = tteam[0];

            //判断玩家是第一次进入游戏，还是再来一局
            if (socket.flag == 0) { //第一次进入
                player.push(playerData);
                connect_total_number++;
                socket.flag = 1;
            }
            vacant_number++;
            vacant_player.push(socket.playerName);

            //游戏前的预热，没有真正开始
            socket.emit('pre_game', JSON.stringify(playerData));

            //判断一下当前服务器中的空闲玩家数是否等于numToGo
            if (vacant_number >= numToGo) {
                //取数组中前三个空闲玩家
                var socketid = new Array();
                for (var i = 0; i < numToGo; i++) {
                    for (var j = 0; j < fromNameToSocketId.length; j++) {
                        if (vacant_player[i] == fromNameToSocketId[j].name) {
                            socketid.push(fromNameToSocketId[j].id);
                        }
                    }
                }
                //告诉前三个空闲玩家，游戏正式开始
                for (i = 0; i < numToGo; i++) {
                    io.sockets.socket(socketid[i]).emit('time_to_start', '0');      //私有消息
                }

                //把房间准备好
                playerNumInGameRoom[totalGame] = 0;
                gameRoom[totalGame] = {name:null, overData:null};

                vacant_number = vacant_number - numToGo;
                vacant_player.splice(0, numToGo);

            } else {
                socket.emit('wait_other_player', 'waiting');
            }
    });

    socket.on('enter_room_init_data', function(){
        //把正式进入游戏的人加入一个房间
        joinRoomTempName.push(socket.playerName);

        socket.join("room"+totalGame);
        playerNumInGameRoom[totalGame]++;
        gameRoom[totalGame].name = "room"+totalGame;

        socket.roomNum = totalGame;        //对socket绑定一个房间号属性

        if(playerNumInGameRoom[totalGame] == numToGo){    //房间中人满
            //向房间中所有人，更新数据，这里是游戏核心数据
            var data = new Array();
            var pp = 0;
            for(var i=0; i<numToGo; i++){
                for(var j=0; j<player.length; j++){
                    if(player[j].name == joinRoomTempName[i]){
                        player[j].id = iid[pp];     //作为精灵的tag
                        player[j].viewId = viewid[pp];  //视野精灵id
                        player[j].posx = bornPlace[pp].posx;
                        player[j].posy = bornPlace[pp].posy;
                        player[j].team = tteam[pp];
                        data.push(player[j]);
                        break;
                    }
                }
                pp++;
            }
            joinRoomTempName.length=0;      //临时数组还原

            //console.log("房间信息"+io.sockets.manager.rooms.name);
            //console.log(socket.id+"的房间信息"+io.sockets.manager.roomClients[socket.id]);
            io.sockets.in('room'+totalGame).emit('init_data_to_start', JSON.stringify(data));
            totalGame++;
        }
    });

    //收到某人改变位置
    socket.on('selfMove', function(data){
        for(var i=0; i<player.length; i++){
            if(player[i].name == socket.playerName){
                player[i].posx = data.ballx;
                player[i].posy = data.bally;
                player[i].clickx = data.clickx;
                player[i].clicky = data.clicky;
                break;
            }
        }
        data.name = socket.playerName;
        if(typeof(socket.roomNum)!="undefined"){
            socket.broadcast.to('room'+socket.roomNum).emit('otherMove', JSON.stringify(data));
        }
    });

    socket.on('self_enter_door', function(data){
        if(typeof(socket.roomNum)!="undefined") {
            socket.broadcast.to('room'+socket.roomNum).emit('someone_enter_door', JSON.stringify(data));
        }
    });

    //一局游戏结束
    socket.on("game_over", function(data){      //data是结算数据
        //防止长时间不同步
        if(typeof(socket.roomNum)!="undefined") {
            if(gameRoom[socket.roomNum].overData==null){
                gameRoom[socket.roomNum].overData = data;
                socket.broadcast.to('room'+socket.roomNum).emit('one_game_over', JSON.stringify(data));
            }
        }
        //离开房间
        socket.leave('room'+socket.roomNum);
        socket.roomNum=-1;
    });


    //回到首页
    socket.on("back_to_index", function(){
       for(var i=0; i<player.length; i++){
           if(player[i].name == socket.playerName){
               player.remove(i);
           }
           for(j=0; j<fromNameToSocketId.length; j++){
               if(fromNameToSocketId[j].name == socket.playerName){
                   fromNameToSocketId.remove(j);
               }
           }
           connect_total_number--;
       }
    });


    //离线
    socket.on('disconnect', function() {        //自带的disconnect事件
        console.log(socket.playerName+" has disconnect");
        //将断开连接的用户从player中删除
        if(socket.playerName !=null && typeof(socket.playerName)!="undefined" ){
            for(var i=0; i<player.length; i++) {
                if(player[i].name == socket.playerName){
                    //检测是从房间里退出，还是在匹配的过程中退出
                    if(typeof(socket.roomNum) =="undefined" || socket.roomNum ==-1){    //在匹配的过程中退出
                        //清理数组
                        player.remove(i);
                        for(var j=0; j<vacant_player.length; j++){
                            if(vacant_player[j] == socket.playerName){
                                vacant_player.remove(j);
                                vacant_number--;
                            }
                        }
                        for(j=0; j<fromNameToSocketId.length; j++){
                            if(fromNameToSocketId[j].name == socket.playerName){
                                fromNameToSocketId.remove(j);
                            }
                        }
                        //清理变量
                        connect_total_number--;
                    }
                    else{               //在房间里退出，即在正式游戏中退出
                        var obj = new Object();
                        obj.id = player[i].id;
                        obj.viewId = player[i].viewId;
                        socket.broadcast.to('room'+socket.roomNum).emit('player_id_exit', JSON.stringify(obj));   //通知除自己以外的所有人

                        //清理数组
                        player.remove(i);
                        for(j=0; j<fromNameToSocketId.length; j++){
                            if(fromNameToSocketId[j].name == socket.playerName){
                                fromNameToSocketId.remove(j);
                            }
                        }
                        //清理变量
                        connect_total_number--;
                        playerNumInGameRoom[socket.roomNum]--;         //房间中的玩家数量-1
                        break;
                    }
                }
            }
        }
    });
}); 