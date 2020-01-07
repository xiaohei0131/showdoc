package controller

import (
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"showdoc/utils"
)

func TreeHandler(c *gin.Context) {
	var role = ""
	var resources []string
	session := sessions.Default(c)
	if(session.Get(SESSION_KEY) != nil) {
		username := session.Get(SESSION_KEY).(string)
		role = utils.GetUser(username).Role
		resources = utils.GetUser(username).Resources
	}
	root := utils.Item{Name: "根目录", Type: "group"}
	tree, _ := utils.GetTree("./doc", root, role, resources)
	res := Result{Code: 0, Datas: tree}
	c.JSON(http.StatusOK, res)
}

func DetailHandler(c *gin.Context) {
	path := c.Request.FormValue("path")
	b, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Print(err)
	}
	str := string(b)
	res := Result{Code: 0, Datas: str}
	c.JSON(http.StatusOK, res)
}
