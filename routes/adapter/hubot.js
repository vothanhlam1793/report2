var fetch = require("node-fetch");
fetch("http://node.creta.work:1888/hubot/lam", {
    method: "POST",
    body: JSON.stringify({
        room: "tro_ly_giam_doc",
        message: "Xin chao!"
    })
}).then(res=>res.text()).then(data=>{
    console.log(data);
})