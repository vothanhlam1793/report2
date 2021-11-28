var arrState = ['MOI_TAO', 'DANG_XU_LY', 'SAN_SANG', 'HOAN_TAT', 'DA_DUYET_DANH_GIA'];
class StateTask {
    constructor(state){
        return this.set(state);
    }
    set = (state) => {
        if(state == undefined){
            return this.state;
        }
        if(typeof state == 'number'){
            if(state <= 0){
                this.index = 0;
            } else if (state >= arrState.length - 1){
                this.index = arrState.length - 1;
            } else {
                this.index = state;
            }
        } else {
            this.index = arrState.findIndex(function(e){
                return e == state;
            });
            if(this.index == -1){
                this.index = 0;
            }
        }
        this.state = arrState[this.index];
        return this.state;
    }
    get = () => {
        return this.state;
    }
    next = () => {
        if(this.index < arrState.length - 1){
            this.index += 1;
            this.state = arrState[this.index]
        }
        return this.state;
    }
    prev = () => {
        if(this.index > 0) {
            this.index -= 1;
            this.state = arrState[this.index]
        }
        return this.state;
    }
    done = () => {
        return this.set('HOAN_THANH');
    }
}