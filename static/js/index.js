$(function () {
    $(".alert").hide();
    $(".fileBtn").hide();
    $("#rs").hide();
    $("#rsbtn").hide();
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
                collapseIcon:"fa fa-minus",
                expandIcon:"fa fa-plus",
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
var mdEdit = undefined;
var docCont = undefined;
/**
 * 查询文件内容
 * @param path
 */
function getContent(editable, path, fname) {
    $("#docContent").empty().show();
    $("#rs").empty().hide();
    $("#rsbtn").hide();
    $("#curEditable").val("");
    $(".fileBtn").hide();
    mdEdit = undefined;
    docCont = undefined;
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
                    // $("#rs textarea").val(res.datas);
                    docCont = res.datas;
                } else {
                    $(".fileBtn").hide();
                }
                preview(res.datas);
                // $("#docContent").html(marked(res.datas));
            }
        },
        error: function () {
            console.error("init tree error")
        }
    });
}
function preview(data) {
    $("#docContent").empty();
    editormd.markdownToHTML("docContent", {
        markdown        : data ,
        htmlDecode      : "style,script,iframe",  // you can filter tags decode
        tocm            : true,    // Using [TOCM]
        emoji           : true,
        taskList        : true,
        tex             : true,  // 默认不解析
        flowChart       : true,  // 默认不解析
        sequenceDiagram : true,  // 默认不解析
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
    $("#rsbtn").show();
    if(mdEdit || docCont==undefined){
        return;
    }
    mdEdit = editormd("rs", {
        width: "100%",
        // autoHeight : true,
        height : 750,
        path : '/static/plugins/editor.md/lib/',
        theme : "dark",
        previewTheme : "dark",
        editorTheme : "pastel-on-dark",
        markdown : docCont,
        codeFold : true,
        //syncScrolling : false,
        saveHTMLToTextarea : true,    // 保存 HTML 到 Textarea
        searchReplace : true,
        //watch : false,                // 关闭实时预览
        htmlDecode : "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
        //toolbar  : false,             //关闭工具栏
        //previewCodeHighlight : false, // 关闭预览 HTML 的代码块高亮，默认开启
        emoji : true,
        taskList : true,
        tocm            : true,         // Using [TOCM]
        tex : true,                   // 开启科学公式TeX语言支持，默认关闭
        flowChart : true,             // 开启流程图支持，默认关闭
        sequenceDiagram : true,       // 开启时序/序列图支持，默认关闭,
        //dialogLockScreen : false,   // 设置弹出层对话框不锁屏，全局通用，默认为true
        //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为true
        //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为true
        //dialogMaskOpacity : 0.4,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
        //dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
        imageUpload : true,
        imageFormats : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
        imageUploadURL : "/manage/img/upload",
        onload : function() {
            //this.fullscreen();
            //this.unwatch();
            //this.watch().fullscreen();

            //this.setMarkdown("#PHP");
            //this.width("100%");
            // this.height(740);
            // this.resize("100%", 740);
        }
    });
}

function saveEdit() {
    var editFilePath = $("#curEditable").val();
    if (editFilePath == "") {
        showErrorMsg("权限不足");
        return;
    }
    // var newContent = $("#rs textarea").val();
    docCont = mdEdit.getMarkdown();
    $.ajax({
        url: "/manage/file/edit",    //请求的url地址
        type: "POST",   //请求方式
        data: {
            "filepath": editFilePath,
            "content": docCont
        },
        success: function (res) {
            if (res.code == 0) {
                showSuccessMsg(res.datas)
                /*debugger
                let selectedNodes = $("#tree").data('treeview').getSelected();
                let nodeId = 0;
                if (selectedNodes && selectedNodes.length > 0) {
                    nodeId = selectedNodes[0].nodeId;
                }
                getTree();
                $('#tree').treeview('revealNode', [nodeId, {silent: true}]);
                $('#tree').treeview('selectNode', [nodeId, {silent: true}]);*/
                $("#docContent").show();
                $("#rs").hide();
                $("#rsbtn").hide();
                preview(docCont);
                // $("#docContent").html(marked(newContent))
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
    $("#rsbtn").hide();
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