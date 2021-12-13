function VMCRM(id, mix){
    return new Vue({
        el: "#" + id,
        mixins: [_support_vue, mix],
        data: {
            model: new CustomersApp(),
        },
        methods: {
            onUpdateData: function(){
                this.$forceUpdate();
            }
        },
        created: function(){
            this.model.bindUpdateData(this.onUpdateData);
        }
    })
}

