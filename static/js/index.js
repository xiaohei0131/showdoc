$(function () {
    $(".alert").hide();
    $(".fileBtn").hide();
    $("#rs").hide();
    init();


})

function init() {
    getTree();
}

/**
 * 初始化树
 * @param path
 */
function getTree() {
    $.ajax({
        // url: "/tree" + (path ? "?path=" + path : ""),    //请求的url地址
        url: "/doc/tree",    //请求的url地址
        type: "GET",   //请求方式
        async: false,
        success: function (res) {
            var treeData = []
            if (res.code == 0) {
                treeData = getNodes([res.datas])
            }
            $("#tree").treeview({
                data: treeData,
                onNodeSelected: function (event, node) {
                    if (node.type == "group") {
                        return
                    }
                    getContent(node.editable, node.path, node.text + ".md")
                }
            });
        },
        error: function () {
            console.error("init tree error")
        }
    });
}

/**
 * 组装node节点
 * @param nodes
 * @returns {Array}
 */
function getNodes(nodes) {
    var treeData = []
    if (nodes != null && nodes != undefined && nodes.length > 0) {
        $.each(nodes, function (i, val) {
            var node = {};
            node.text = val.name;
            if (val.type == "group") {
                node.nodes = getNodes(val.children)
                node.backColor = "#f0f0f0"
                // node.selectable = false
            }
            node.type = val.type
            node.editable = val.editable
            node.path = val.path;
            treeData.push(node);
        })
    }
    return treeData;
}

/**
 * 查询文件内容
 * @param path
 */
function getContent(editable, path, fname) {
    $("#docContent").show();
    $("#rs").hide();
    $("#curEditable").val("");
    $(".fileBtn").hide();
    $.ajax({
        url: "/doc/detail?path=" + path,    //请求的url地址
        type: "GET",   //请求方式
        async: false,
        success: function (res) {
            if (res.code == 0) {
                $("#fname").text(fname);
                $("#curEditable").val(path);
                if (editable) {
                    $(".fileBtn").show();
                    $("#rs textarea").val(res.datas);
                } else {
                    $(".fileBtn").hide();
                }
                $("#docContent").html(marked(res.datas));
            }
        },
        error: function () {
            console.error("init tree error")
        }
    });
}

function gotoEdit() {
    var editFilePath = $("#curEditable").val();
    if (editFilePath == "") {
        showErrorMsg("权限不足");
        return;
    }
    $("#docContent").hide();
    $("#rs").show();
}

function saveEdit() {
    var editFilePath = $("#curEditable").val();
    if (editFilePath == "") {
        showErrorMsg("权限不足");
        return;
    }
    var newContent = $("#rs textarea").val();
    $.ajax({
        url: "/manage/file/edit",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "filepath": editFilePath,
            "content": newContent
        },
        success: function (res) {
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [nodeId, {silent: true}]);
                $("#docContent").show();
                $("#rs").hide();
                $("#docContent").html(marked(newContent))
            } else {
                showErrorMsg(res.datas)
            }
        },
        error: function () {
            console.error("error")
        }
    });
}

function cancelEdit() {
    $("#docContent").show();
    $("#rs").hide();
}

function insertPic() {
    var fid = new Date().getTime();
    var inp = '<input id="'+fid+'" type="file" name="image" class="file">';
    $('#imgModal .modal-body').html(inp);
    var fileInput = $("#"+fid);
    fileInput.fileinput({
        language: 'zh',                                         //设置语言
        uploadUrl: "/manage/img/upload",                                   //上传的地址
        allowedFileExtensions: ['jpg', 'gif', 'png', 'jpeg'],    //接收的文件后缀
        showUpload: true,                                       //是否显示上传按钮
        showRemove : true,                                      //显示移除按钮
        showPreview : true,                                     //是否显示预览
        showCaption: false,                                     //是否显示标题
        browseClass: "btn btn-primary",                         //按钮样式
        uploadAsync: true,                                      //默认异步上传
        //dropZoneEnabled: false,                               //是否显示拖拽区域
        //minImageWidth: 50,                                    //图片的最小宽度
        //minImageHeight: 50,                                   //图片的最小高度
        //maxImageWidth: 1000,                                  //图片的最大宽度
        //maxImageHeight: 1000,                                 //图片的最大高度
        //maxFileSize: 0,                                       //单位为kb，如果为0表示不限制文件大小
        //minFileCount: 0,
        maxFileCount: 1,                                       //表示允许同时上传的最大文件个数
        enctype: 'multipart/form-data',
        validateInitialCount:true,
        previewFileIcon: "<i class='glyphicon glyphicon-king'></i>",
        msgFilesTooMany: "选择上传的文件数量({n}) 超过允许的最大数值{m}！"
    });
    fileInput.on('fileuploaded', function(event, data, previewId, index){
        console.log(data)
        var response = data.response;
        if(response.code == 0) {
            var picUrl = response.datas;
            // $(".comments").insertAtCaret('![]('+picUrl+')');
            $(".comments").insertAtCaret('<img src="'+picUrl+'" width="300" height="400"/>');
        }
        $('#imgModal').modal("hide")
    });
    $('#imgModal').modal("show")
}

function gotoDelete(obj) {
    if (obj == "file") {
        var editFilePath = $("#curEditable").val();
        if (editFilePath == "") {
            showErrorMsg("权限不足");
            return;
        }
        $("#delModal #delMsg").text("确定要删除文件【" + $("#fname").text() + "】吗？");
        $("#delModal #delPath").val(editFilePath);
        $("#delModal #delType").val(obj);
    } else if (obj == "dir") {
        let selectedNodes = $("#tree").data('treeview').getSelected();
        if (selectedNodes && selectedNodes.length > 0) {
            curNode = selectedNodes[0];
            if (curNode.nodes != null && curNode.nodes.length > 0) {
                showErrorMsg("目录不为空")
                return
            }
            if (curNode.path  == "./doc") {
                showErrorMsg("根目录不可删除")
                return
            }
            $("#delModal #delMsg").text("确定要删除目录【" + curNode.text + "】吗？");
            $("#delModal #delPath").val(curNode.path);
            $("#delModal #delType").val(obj);
        } else {
            showErrorMsg("请先选择一个目录")
            return
        }
    } else {
        return
    }
    $("#delModal").modal("show")
}

function delFileOrDir() {
    var type = $("#delModal #delType").val();
    var _url = type == "file" ? "/manage/file/del" : "/manage/dir/del";
    $.ajax({
        url: _url,    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "path": $("#delModal #delPath").val()
        },
        success: function (res) {
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let parentNodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    parentNodeId = $('#tree').treeview('getParent', selectedNodes[0].nodeId).nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [parentNodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [parentNodeId, {silent: true}]);
            } else {
                showErrorMsg(res.datas)
            }
            $("#delModal").modal("hide")
        },
        error: function () {
            console.error("error")
        }
    });
}

function logout() {
    $.ajax({
        url: "/user/logout",    //请求的url地址
        type: "POST",   //请求方式
        success: function (res) {
            if (res.code == 0) {
                window.location.href = "/"
            }
        },
        error: function () {
            console.error("退出失败")
        }
    });
}

function addDir() {
    let node = checkSelectNodeIsDir("add");
    if (node == null) {
        return;
    }
    $('#dirModal #dirName').val("");
    $('#dirModal #dirRealPath').val(node.path);
    $('#dirModal #dirPath').val(node.path.replace(/doc/, '根目录').replace(/[\/\\]/g, '>'));
    $('#dirModal').modal("show")
}

function saveDir() {
    $.ajax({
        url: "/manage/dir/add",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "path": $('#dirModal #dirRealPath').val(),
            "name": $('#dirModal #dirName').val()
        },
        success: function (res) {
            $('#dirModal').modal("hide")
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [nodeId, {silent: true}]);
            } else {
                showErrorMsg(res.datas)
            }
        },
        error: function () {
            console.error("error")
        }
    });
}

function editDir() {
    let node = checkSelectNodeIsDir("dir");
    if (node == null) {
        return;
    }
    var pt = node.path.replace(/^doc/, '根目录').replace(/[\/\\]/g, '>')
    $('#dirRenameModal #prefix').text(pt.substring(0,pt.lastIndexOf(">")+1));
    $('#dirRenameModal #dirName').val(node.text);
    $('#dirRenameModal #oldName').val(node.text);
    $('#dirRenameModal #oldPath').val(node.path);
    $('#dirRenameModal').modal("show")
}

function renameDir() {
    var oldPath = $('#dirRenameModal #oldPath').val();
    var newName = $('#dirRenameModal #dirName').val();
    var oldName = $('#dirRenameModal #oldName').val();
    var newPath = oldPath.substring(0,oldPath.lastIndexOf(oldName)) + newName
    $.ajax({
        url: "/manage/dir/rename",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "oldpath": oldPath,
            "newpath": newPath
        },
        success: function (res) {
            $('#dirRenameModal').modal("hide")
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [nodeId, {silent: true}]);
            } else {
                showErrorMsg(res.datas)
            }
        },
        error: function () {
            console.error("error")
        }
    });
}

function addFile() {
    let node = checkSelectNodeIsDir("file");
    if (node == null) {
        return;
    }
    $('#fileModal #fileName').val("");
    $('#fileModal #fileRealPath').val(node.path);
    $('#fileModal #filePath').val(node.path.replace(/doc/, '根目录').replace(/[\/\\]/g, '>'));
    $('#fileModal').modal("show");
}

function saveFile() {
    $.ajax({
        url: "/manage/file/add",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "path": $('#fileModal #fileRealPath').val(),
            "name": $('#fileModal #fileName').val() + ".md"
        },
        success: function (res) {
            $('#fileModal').modal("hide")
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [nodeId, {silent: true}]);
            } else {
                showErrorMsg(res.datas)
            }
        },
        error: function () {
            console.error("error")
        }
    });
}

function gotoRename() {
    var oldName = $("#fname").text();
    oldName = oldName.substring(0,oldName.lastIndexOf(".md"))
    var oldPath = $("#curEditable").val();
    var pt = oldPath.replace(/^doc/, '根目录').replace(/[\/\\]/g, '>')
    $('#fileRenameModal #prefix').text(pt.substring(0,pt.lastIndexOf(">")+1));
    $('#fileRenameModal #fileName').val(oldName);
    $('#fileRenameModal #oldName').val(oldName);
    $('#fileRenameModal #oldPath').val(oldPath);
    $('#fileRenameModal').modal("show")
}

function renameFile() {
    var oldPath = $('#fileRenameModal #oldPath').val();
    var newName = $('#fileRenameModal #fileName').val();
    var oldName = $('#fileRenameModal #oldName').val();
    var newPath = oldPath.substring(0,oldPath.lastIndexOf(oldName)) + newName+".md";
    $.ajax({
        url: "/manage/file/rename",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "oldpath": oldPath,
            "newpath": newPath
        },
        success: function (res) {
            $('#fileRenameModal').modal("hide")
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('expandNode', [nodeId, {silent: true}]);
                $("#fname").text(newName);
            } else {
                showErrorMsg(res.datas)
            }
        },
        error: function () {
            console.error("error")
        }
    });
}

function checkSelectNodeIsDir(tp) {
    let selectedNodes = $("#tree").data('treeview').getSelected();
    if (selectedNodes && selectedNodes.length > 0 && selectedNodes[0].type == "group") {
        if (tp == "dir" && !selectedNodes[0].editable) {
            showErrorMsg("权限不足");
            return null;
        } else {
            return selectedNodes[0];
        }
    } else {
        showErrorMsg("请选择目录");
        return null;
    }
}

function showErrorMsg(msg) {
    $("#errorMsg").show();
    $("#errorMsg").text(msg);
    setTimeout(function () {
        $("#errorMsg").hide();
    }, 2000)
}

function showSuccessMsg(msg) {
    $("#successMsg").show();
    $("#successMsg").text(msg);
    setTimeout(function () {
        $("#successMsg").hide();
    }, 2000)
}