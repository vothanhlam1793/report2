const puppeteer = require('puppeteer');
async function getSerial(Sertial){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://dahua.vn/bao-hanh.html');
    const result = await page.evaluate(async (serial)=>{
        function delay(time) {
            return new Promise(function(resolve) { 
                setTimeout(resolve, time)
            });
        }
        jQuery("#input-check-bh").val(serial);
        jQuery(".btn.btn-bh-tr").click()
        await delay(2000);
        return jQuery(".check_page.active")[0].innerText.split("\n");

    }, Sertial);    
    await browser.close();
    var tem = result.map(element => {
        var t = element.split("\t");
        if(t.length == 2){
            return {
                key: t[0],
                value: t[1]
            }
        } else {
            return {
                key: "Tên",
                value: t[0]
            }
        }
    });
    return tem;
}

// async function test(){
//     console.log(await getSerial("7F04920PAZ3C52F"));
// }
// test();

module.exports.getSerialDSS = getSerial;