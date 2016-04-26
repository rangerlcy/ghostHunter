var res = {
    png1: "res/1.png",
    view : "res/view.png",
    tileMap: "res/tileMap/map1.tmx",
    cat: "res/tileMap/cat.png",
    road: "res/tileMap/road.png",
    wall: "res/tileMap/wall.png",
    shadowMap: "res/shadowMap.png",
    fnt8_png: "res/fonts/fnt8.png",
    fnt8_fnt: "res/fonts/fnt8.fnt",
    bitmapFontTest3_fnt: "res/fonts/bitmapFontTest3.fnt",
    bitmapFontTest3_png: "res/fonts/bitmapFontTest3.png",
    button: 'res/animationbuttonnormal.png',
    buttonPressed: 'res/animationbuttonpressed.png',
    green_edit: 'res/green_edit.png',
    orange_edit: 'res/orange_edit.png',
    ghost_plist: 'res/ghost/ghost.plist',
    slim_plist: 'res/slim/slim.plist',
    title_png: 'res/title.png',
    map1:'res/map/map1.tmx',
    map2:'res/map/map2.tmx',
    test:"res/test.jpg"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
