var fetch = require("node-fetch");
class Cart {
    constructor(obj){
        this.data = obj;
    }
}

exports.getAll = async () => {
    try {
        var res = await fetch("https://creta.vn/api/carts?pass=asrkpvg7");
        var contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            console.warn("[cart] API không trả JSON, status:", res.status);
            return [];
        }
        var d = await res.json();
        return d;
    } catch(e) {
        console.error("[cart] getAll error:", e.message);
        return [];
    }
}