class Bank {
    constructor(){

    }
    getBankName = ()=>{
        return "";
    }
    getBankAge = ()=>{
        return "";
    }
}

class VCB extends Bank {
    getBankName = () => {
        return "VCB";
    }
}

class ACB extends Bank {
    getBankName = () => {
        return "ACB";
    }
}

class BankFactory {
    constructor(){

    }
    getBank = (bankType) => {
        switch(bankType){
            case "VCB":{
                return new VCB();
            }
            case "ACB": {
                return new ACB();
            }
        }
    }
}

var bankType = ["VCB", "ACB"];

var b = new BankFactory();
console.log(b.getBank(bankType[0]).getBankAge());