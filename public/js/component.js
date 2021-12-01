Vue.component('modal-set-group',{
    props: ['code'],
    data: function(){
        return {
            customer: {kiot: {}, origin: {}}
        }
    },
    methods: {
        open_box: function(){
            console.log("Here");
            console.log(jQuery("#modal"+this.code));
            jQuery("#modal"+this.code).toggle();
            if(!this.customer.code){
                var that = this;
                $.get("/creta/customer/"+this.code, function(data){
                    that.customer = data;
                })
            }
        }
    },
    template: `
    <div>
    <button class="btn btn-warning" @click="open_box()">G</button>
    <!-- The Modal -->
    <div class="modal" :id="'modal'+code">
        <div class="modal-dialog">
            <div class="modal-content">

            <!-- Modal Header -->
            <div class="modal-header">
                <h4 class="modal-title">{{customer.kiot.name || 'Điều chỉnh nhóm khách'}}</h4>
                <p>{{customer.origin.type}}</p>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>

            <!-- Modal body -->
            <div class="modal-body">
                <label>Thợ</label>
                <set-group :code="code"></set-group>
            </div>

            <!-- Modal footer -->
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
            </div>

            </div>
        </div>
    </div>
    </div>
    `
});
Vue.component('set-group', {
    props: ['code', 'type'],
    data: function(){
        return {
            customer: {}
        }
    },
    methods: {
        set_group: function(){
            if(!this.customer.code){
                var that = this;
                $.get("/creta/customer/"+this.code, function(data){
                    if(data.origin.id){
                        var customer = new Customer({id: data.origin.id})
                    } else {
                        var customer = new Customer();
                    }
                    customer.set("type", "THO_TINH");
                    customer.set("code", that.code);
                    customer.set("kiotCode", that.code);
                    customer.save({}, {
                        success: function(r, e){
                            alert("SUCCESS: " + that.code);
                        }
                    })
                });   
            }
        }
    },
    template: `
        <div>
            <button class="btn btn-warning" @click="set_group()">Thợ tỉnh</button>
        </div>
    `
})