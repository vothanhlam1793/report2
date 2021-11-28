class ModelDashboard {
    constructor(){
        this.customers = [];
        this.onUpdateData = function(){};
    }
}

class ControllerDashboard {
    constructor(view, model){
        this.model.onUpdateData = this.onUpdateData;
    }
    onUpdateData = () => {

    }
}