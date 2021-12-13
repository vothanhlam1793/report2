Vue.component('create-digest', {
    data: function () {
        return {
            model: new Digest(),
        }
    },
    methods: {
        
    },
    created: function(){

    },
    template: `
        <div>
            <div class="form-group">
                <label>Tên nhóm</label>
                <input v-model="model.campaign.attributes.name" class="form-control" placeholder="Tên nhóm">
            </div>
            <div class="form-group">
                <label>Mã</label>
                <input v-model="model.campaign.attributes.tag" class="form-control" placeholder="Tag">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea v-model="model.campaign.attributes.description" class="form-control">
                </textarea>
            </div>
            <div class="form-group">
                <button class="btn btn-success" @click="model.create()">Lưu</button>
            </div>
        </div>
    `
})


Vue.component('add-tag-customer',{
    props: [],
    data: function(){
        return {

        }
    },
    methods: {

    },
    created: function(){

    },
    template: `
        
    `
})


// Vue.component('add-tag-customer',{
//     props: [],
//     data: function(){
//         return {

//         }
//     },
//     methods: {

//     },
//     created: function(){

//     },
//     template: `
    
//     `
// })