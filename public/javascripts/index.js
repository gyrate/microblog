
//各种初始化
$(function () {
    $('#btn_send_pic').click(function () {
        $('#file_send_pic').click();
    })
    $('#file_send_pic').change(function(){
        var fname = $('#file_send_pic').val()
            , reg = /\w+\.(jpg|gif|bmp|png)$/ ;
        if( !reg.test(fname) ){
            $('#file_send_pic').val('');
            alert('请选择正确的图片文件。');
            return;
        }

        var $a = $('<a>').html( '图片：'+ fname );
        $('#p_send_pic').append($a);
    })
})