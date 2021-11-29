var SheetGoogle = require("../models/sheet.model").SheetGoogle;

exports.getSheet = async (req, res) => {
    console.log(req.body);
    var s = new SheetGoogle(req.body.url, req.body.sheetName);
    s = await s.fetch();
    res.send(s);
}