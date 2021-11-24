var obj = {
    name: "",
    time: "",
    content: ""
}
//Zalo
var dataZalo = [];
document.getElementById("conversationList").addEventListener("wheel", function(){
    var temp = jQuery("[data-id=div_TabMsg_ThrdChItem]");
    for(var j = 0; j < temp.length; j++){
        var t1 = jQuery(temp[j])[0].innerText.split("\n");
        var t3 = false;
        var t2 = data.forEach(function(e2, i2){
            if(e2.name == t1[0]){
                t3 = true;
            }
        });
        if(t3 == false){
            dataZalo.push({
                name: t1[0],
                time: t1[1],
                content: t1[2]
            })
        }
    }
});

//Facebook
var dataMessenger = [];
jQuery('[data-testid=MWJewelThreadListContainer]').bind('mousewheel', function(e) {
    var temp = jQuery("[data-testid=mwthreadlist-item]");
    for(var j = 0; j < temp.length; j++){
        var t1 = jQuery(temp[j])[0].innerText.split("\n");
        var t3 = false;
        var t2 = data.forEach(function(e2, i2){
            if(e2.name == t1[0]){
                t3 = true;
            }
        });
        var name = "";
        if(t1[0] == 'Đang hoạt động'){
            name = t1[1];
        } else {
            name = t1[0];
        }
        if(t3 == false){
            dataMessenger.push({
                name: name,
                time: t1[t1.length-1],
                content: t1[1]
            })
        }
    }
});


let socket = new WebSocket("ws://node.creta.work:1888/data-messenger");

socket.onopen = function(e) {
    console.log("Est");
};

socket.onmessage = function(event) {
    console.log("RECIVE: ", event);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log("Close connection");
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    console.log("Close connection")
  }
};

socket.onerror = function(error) {
    console.log("Connection error:", error.message);
};