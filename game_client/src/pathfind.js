var pathFind = {
    grid: null,
    finder: null,
    mapSize: null,
    _mapArr: [],
    tileSize: null,
    doorsCoord: [],
    catHouse: [],

    init: function(map) {
        this.doorsCoord = [];
        this.mapSize = map.getMapSize();
        this.tileSize = map.getTileSize();
        this._mapArr = new Array(this.mapSize.height);
        var i, j;
        for (i = 0;i < this.mapSize.height; ++i) {
            this._mapArr[i] = new Array(this.mapSize.width);
        }
        var wallLayer = map.getLayer('wall');
        for (i = 0;i < this.mapSize.height; ++i) {
            for (j = 0;j < this.mapSize.width; ++j) {
                var gid = wallLayer.getTileGIDAt(j, i);
                this._mapArr[i][j] = gid;
            }
        }
        var catLayer = map.getLayer('cat');
        for (i = 0;i < this.mapSize.height; ++i) {
            for (j = 0;j < this.mapSize.width; ++j) {
                var gid = catLayer.getTileGIDAt(j, i);
                if (gid !== 0) {
                    this.catHouse.push(this._mapToScreenCoord({
                        posx: j, posy: i
                    }));
                }
            }
        }
        this.grid = new PF.Grid(this._mapArr);
        this.finder = new PF.AStarFinder();

        var doorObjGroup = map.getObjectGroup('doorObj');
        var doorsObjs = doorObjGroup.getObjects();
        for (i = 0, _len = doorsObjs.length; i < _len; ++i) {
            this.doorsCoord.push(this._screenToMapCoord({
                //y 坐标相反
                //hack
                //可能有误
                posx: doorsObjs[i].x,
                posy: doorsObjs[i].y + this.tileSize.height
            }));
            this.doorsCoord[i].pair = doorsObjs[i].pair;
        }

        var self = this;
        return this.doorsCoord.map(function(v) {
            var pos = self._mapToScreenCoord(v);
            pos.pair = v.pair;
            return pos;
        });
    },

    getCatHouse: function() {
        return this.catHouse;
    },

    checkIsDoor: function(pos, _isMap) {
        if (!_isMap) {
            pos = this._screenToMapCoord(pos);
        }
        for (var i = 0, _len = this.doorsCoord.length; i < _len; ++i) {
            if (pos.posx === this.doorsCoord[i].posx &&
                pos.posy === this.doorsCoord[i].posy) {
                return true;
            }
        }
        return false;
    },

    getPairedDoorCoord: function(pos) {
        pos = this._screenToMapCoord(pos);
        var i, pair;
        for (i = 0, _len = this.doorsCoord.length; i < _len; ++i) {
            if (pos.posx === this.doorsCoord[i].posx &&
                pos.posy === this.doorsCoord[i].posy) {
                pair = this.doorsCoord[i].pair;
                break;
            }
        }
        if (i >= _len) {
            console.log('not a door');
            return ;
        }

        for (var k = 0; k < _len; ++k) {
            if (k === i || this.doorsCoord[k].pair !== pair) {
                continue;
            }
            return this._mapToScreenCoord(this._toRoad({
                posx: this.doorsCoord[k].posx,
                posy: this.doorsCoord[k].posy
            }));
        }
        return ;
    },

    _refreshGrid: function() {
        this.grid = new PF.Grid(this._mapArr);
    },

    _screenToMapCoord: function(pos) {
        var x = Math.floor(pos.posx / this.tileSize.width),
            y = this.mapSize.height - 1 -
                Math.floor(pos.posy / this.tileSize.height);
        return {posx: x, posy: y};
    },

    _mapToScreenCoord: function(pos) {
        return {
            posx: pos.posx * this.tileSize.width + this.tileSize.width / 2,
            posy: (this.mapSize.height - 1 - pos.posy)
                * this.tileSize.height + this.tileSize.height / 2
        };
    },

    _toRoad: function(to) {
        if (!this._mapArr[to.posy][to.posx]) {
            return to;
        }
        var list = [to];
        while (list.length) {
            var top = list.shift();
            if (this._mapArr[top.posy - 1]) {
                if (this._mapArr[top.posy - 1][top.posx]) {
                    list.push({posx: top.posx, posy: top.posy - 1});
                } else {
                    return {posx: top.posx, posy: top.posy - 1};
                }
            }
            if (this._mapArr[top.posy + 1]) {
                if (this._mapArr[top.posy + 1][top.posx]) {
                    list.push({posx: top.posx, posy: top.posy + 1});
                } else {
                    return {posx: top.posx, posy: top.posy + 1};
                }
            }
            if (this._mapArr[top.posy][top.posx - 1] !== undefined) {
                if (this._mapArr[top.posy][top.posx - 1]) {
                    list.push({posx: top.posx - 1, posy: top.posy});
                } else {
                    return {posx: top.posx - 1, posy: top.posy};
                }
            }
            if (this._mapArr[top.posy][top.posx + 1] !== undefined) {
                if (this._mapArr[top.posy][top.posx + 1]) {
                    list.push({posx: top.posx + 1, posy: top.posy});
                } else {
                    return {posx: top.posx + 1, posy: top.posy};
                }
            }
        }
    },

    search: function(from, to) {
        var self = this;
        //self._refreshGrid();
        from = self._screenToMapCoord(from);
        to = self._screenToMapCoord(to);

        var flag = false;
        if (self._mapArr[to.posy][to.posx]) { //点击在墙上
            if (!this.checkIsDoor(to, true)) {
                to = self._toRoad(to);
            } else {
                flag = true;
                self._mapArr[to.posy][to.posx] = 0;
            }
        }
        self._refreshGrid();
        var path = (self.finder.findPath(from.posx, from.posy,
            to.posx, to.posy, self.grid));
        path = path.slice(1);
        path = path.map(function(v) {
            return self._mapToScreenCoord({
                posx: v[0],
                posy: v[1]
            })
        });
        if (flag) {
            self._mapArr[to.posy][to.posx] = 1;
        }
        return path;
    },

    checkExistWall: function(pos1, pos2) {
        var self = this;
        var mapPos1 = self._screenToMapCoord(pos1),
            mapPos2 = self._screenToMapCoord(pos2);
        if (self._mapArr[mapPos1.posy][mapPos1.posx] ||
            self._mapArr[mapPos2.posy][mapPos2.posx]) {
            return true;
        }
        pos1 = self._mapToScreenCoord(mapPos1);
        pos2 = self._mapToScreenCoord(mapPos2);
        var lineX = function(y) {
            var maxY = Math.max(pos1.posy, pos2.posy),
                minY = pos1.posy + pos2.posy - maxY;
            y = Math.max(Math.min(y, maxY), minY);
            return pos1.posx + (y - pos1.posy) *
                (pos2.posx - pos1.posx) / (pos2.posy - pos1.posy);
        }
        if (mapPos1.posx === mapPos2.posx) {
            var del = mapPos1.posy > mapPos2.posy ? -1 : 1,
                y = mapPos1.posy + del;
            while (y != mapPos2.posy) {
                if (self._mapArr[y][mapPos1.posx]) {
                    return true;
                }
                y += del;
            }
        } else if (mapPos1.posy === mapPos2.posy) {
            var del = mapPos1.posx > mapPos2.posx ? -1 : 1,
                x = mapPos1.posx + del;
            while (x != mapPos2.posx) {
                if (self._mapArr[mapPos1.posy][x]) {
                    return true;
                }
                x += del;
            }
        } else {
            var d = 0.8;
            var del = pos1.posy > pos2.posy ? -d : d,
                y = pos1.posy + del;
            while (true) {
                var x = lineX(y),
                    p = self._screenToMapCoord({posx:x, posy: y});
                if (p.posx === mapPos2.posx && p.posy === mapPos2.posy) {
                    return false;
                }
                if (self._mapArr[p.posy][p.posx]) {
                    return true;
                }
                y += del;
            }
        }
        return false;
    }
}

