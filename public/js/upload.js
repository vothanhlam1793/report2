function getFile(idInputFile){
    b = jQuery("#" + idInputFile);
    return b[0].files[0];
}

function uploadFile(idInputFile, cb){
    var url_upload = "/images/upload";
    var a = new FormData();
    a.append('formFile', getFile(idInputFile))
    jQuery.ajax({
        url: url_upload,
        data: a,
        cache: false,
        enctype: 'multipart/form-data',
        contentType: false,
        processData: false,
        method: 'POST',
        type: 'POST', // For jQuery < 1.9
        success: function(data){
            if(typeof cb == "function"){
                cb(data);
            }
        }
    });
}

Vue.component("upload-file", {
    props: ["id"],
    data: function(){
        return {

        }
    },
    methods: {
        upload: function(){
            uploadFile("file-" + this._props.id, function(data){
                console.log(data);
            })
        },
        child: function(){
            console.log("CHILD");
            this.$emit('from-child', this._props.id);
        }
    },
    created: function(){

    },
    template: `
    <div>
        <div class="mb-3"> 
            <input class="form-control" type="file" :id="'file-' + id">
            <button class="btn btn-primary" @click="upload()">Upload</button>
        </div>
        <button @click="child()">SEND</button>
    </div>
    `
})