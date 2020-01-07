package controller

import (
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/wxnacy/wgo/arrays"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"showdoc/utils"
	"strconv"
	"time"
)

func TreeOwnSelfHandler(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get(SESSION_KEY).(string)
	role := utils.GetUser(username).Role
	resources := utils.GetUser(username).Resources
	root := utils.Item{Name: "根目录", Type: "group"}
	tree, _ := utils.GetTree("./doc", root, role, resources)
	res := Result{Code: 0, Datas: tree}
	c.JSON(http.StatusOK, res)
}

func EditFileHandler(c *gin.Context) {
	filepath := c.Request.FormValue("filepath")
	content := c.Request.FormValue("content")
	err := ioutil.WriteFile(filepath, []byte(content), 0644)
	res := Result{Code: 0, Datas: "保存成功"}
	if err != nil {
		res = Result{Code: -1, Datas: "保存失败"}
	}
	c.JSON(http.StatusOK, res)
}

func AddFileHandler(c *gin.Context) {
	path := c.Request.FormValue("path")
	name := c.Request.FormValue("name")
	fromSlash := filepath.FromSlash(path)
	realPath := filepath.Join(fromSlash, name)
	if pathExists(realPath) {
		res := Result{Code: -1, Datas: "创建失败，文件已存在"}
		c.JSON(http.StatusOK, res)
	} else {
		f1, err := os.Create(realPath)
		defer f1.Close()
		res := Result{Code: 0, Datas: "创建成功"}
		if err != nil {
			res = Result{Code: -1, Datas: "创建失败"}
		} else {
			session := sessions.Default(c)
			username := session.Get(SESSION_KEY).(string)
			curUser := utils.GetUser(username)
			role := curUser.Role
			if (role != utils.ROLE_ADMIN) {
				resu := utils.AddResourceToUser(realPath, curUser.Username)
				if !resu {
					//回滚
					os.Remove(realPath)
					res = Result{Code: -1, Datas: "创建失败"}
				}
			}
		}
		c.JSON(http.StatusOK, res)
	}
}

func DeleteFileHandler(c *gin.Context) {
	path := c.Request.FormValue("path")
	fromSlash := filepath.FromSlash(path)
	if !checkFilePermission(c, fromSlash) {
		res := Result{Code: -1, Datas: "权限不足"}
		c.JSON(http.StatusOK, res)
	} else {
		err := os.Remove(fromSlash)
		res := Result{Code: 0, Datas: "删除文件成功"}
		if err != nil {
			res = Result{Code: -1, Datas: "删除文件失败"}
		} else {
			session := sessions.Default(c)
			username := session.Get(SESSION_KEY).(string)
			curUser := utils.GetUser(username)
			role := curUser.Role
			if (role != utils.ROLE_ADMIN) {
				resu := utils.RemoveResourceFormUser(fromSlash, curUser.Username)
				if !resu {
					fmt.Println("权限删除失败，" + fromSlash)
				}
			}
		}
		c.JSON(http.StatusOK, res)
	}
}

func RenameFileHandler(c *gin.Context) {
	oldpath := c.Request.FormValue("oldpath")
	newpath := c.Request.FormValue("newpath")
	oldpath = filepath.FromSlash(oldpath)
	newpath = filepath.FromSlash(newpath)
	if pathExists(newpath) {
		res := Result{Code: -1, Datas: "重命名失败，文件已存在"}
		c.JSON(http.StatusOK, res)
	} else if !checkFilePermission(c, oldpath) {
		res := Result{Code: -1, Datas: "权限不足"}
		c.JSON(http.StatusOK, res)
	} else {
		err := os.Rename(oldpath, newpath)
		res := Result{Code: 0, Datas: "重命名文件成功"}
		if err != nil {
			res = Result{Code: -1, Datas: "重命名文件失败"}
		} else {
			session := sessions.Default(c)
			username := session.Get(SESSION_KEY).(string)
			curUser := utils.GetUser(username)
			role := curUser.Role
			if (role != utils.ROLE_ADMIN) {
				resu := utils.RenameResourceFormUser(oldpath, newpath, curUser.Username)
				if !resu {
					//回滚
					os.Rename(newpath, oldpath)
					res = Result{Code: -1, Datas: "重命名文件失败"}
				}
			}
		}
		c.JSON(http.StatusOK, res)
	}
}

func checkFilePermission(c *gin.Context, path string) bool {
	session := sessions.Default(c)
	username := session.Get(SESSION_KEY).(string)
	curUser := utils.GetUser(username)
	if (curUser.Role != utils.ROLE_ADMIN && arrays.ContainsString(curUser.Resources, path) < 0) {
		return false
	}
	return true
}

func isAdmin(c *gin.Context) bool {
	session := sessions.Default(c)
	username := session.Get(SESSION_KEY).(string)
	role := utils.GetUser(username).Role
	if (role != utils.ROLE_ADMIN) {
		return false
	}
	return true
}

func AddDirHandler(c *gin.Context) {
	if !isAdmin(c) {
		res := Result{Code: -1, Datas: "非管理员不可创建目录"}
		c.JSON(http.StatusOK, res)
	} else {
		path := c.Request.FormValue("path")
		name := c.Request.FormValue("name")
		fromSlash := filepath.FromSlash(path)
		realPath := filepath.Join(fromSlash, name)
		res := Result{Code: 0, Datas: "创建成功"}
		if pathExists(realPath) {
			res = Result{Code: -1, Datas: "创建失败，目录已存在"}
		}
		err := os.Mkdir(realPath, os.ModePerm)
		if err != nil {
			res = Result{Code: -1, Datas: "创建失败"}
		}
		c.JSON(http.StatusOK, res)
	}
}
func DeleteDirHandler(c *gin.Context) {
	if !isAdmin(c) {
		res := Result{Code: -1, Datas: "非管理员不可删除目录"}
		c.JSON(http.StatusOK, res)
	} else {
		path := c.Request.FormValue("path")
		fromSlash := filepath.FromSlash(path)
		err := os.Remove(fromSlash)
		res := Result{Code: 0, Datas: "删除目录成功"}
		if err != nil {
			res = Result{Code: -1, Datas: "删除目录失败,目录不为空"}
		}
		c.JSON(http.StatusOK, res)
	}
}

func RenameDirHandler(c *gin.Context) {
	if !isAdmin(c) {
		res := Result{Code: -1, Datas: "非管理员不可修改目录"}
		c.JSON(http.StatusOK, res)
	} else {
		oldpath := c.Request.FormValue("oldpath")
		newpath := c.Request.FormValue("newpath")
		oldpath = filepath.FromSlash(oldpath)
		newpath = filepath.FromSlash(newpath)
		if pathExists(newpath) {
			res := Result{Code: -1, Datas: "重命名失败，目录已存在"}
			c.JSON(http.StatusOK, res)
		} else {
			err := os.Rename(oldpath, newpath)
			res := Result{Code: 0, Datas: "重命名目录成功"}
			if err != nil {
				res = Result{Code: -1, Datas: "重命名目录失败"}
			}
			c.JSON(http.StatusOK, res)
		}
	}
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true
	}
	if os.IsNotExist(err) {
		return false
	}
	return false
}

func FileuploadHandler(c *gin.Context) {
	//得到上传的文件
	file, header, err := c.Request.FormFile("image") //image这个是uplaodify参数定义中的   'fileObjName':'image'
	if err != nil {
		c.String(http.StatusBadRequest, "Bad request")
		return
	}
	//文件的名称
	filename := header.Filename
	filePrefix := strconv.FormatInt(time.Now().UnixNano(), 10)
	path := "static/upload/" + filePrefix + "_" + filename
	//创建文件
	out, err := os.Create(path)
	res := Result{Code: 0, Datas: "/" + path}
	if err != nil {
		res.Code = -1
		res.Datas = err.Error()
	}
	defer out.Close()
	_, err = io.Copy(out, file)
	if err != nil {
		res.Code = -1
		res.Datas = err.Error()
	}
	c.JSON(http.StatusOK, res)
}
