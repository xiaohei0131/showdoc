package router

import (
	"encoding/gob"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"net/http"
	"showdoc/utils"
)
import "showdoc/controller"

const SECRET_KEY string = "doc-secret"

func InitRouter(port string) {
	gob.Register("")
	//gin.SetMode(gin.ReleaseMode)
	//使用gin的Default方法创建一个路由handler
	router := gin.Default()
	store := cookie.NewStore([]byte(SECRET_KEY))
	store.Options(sessions.Options{Path:"/",MaxAge:0})
	router.Use(sessions.Sessions("sessionid", store))
	//设置默认路由当访问一个错误网站时返回
	router.NoRoute(controller.NotFound)
	router.LoadHTMLGlob("pages/*")
	// 静态资源目录
	router.Static("/static", "static")
	router.StaticFile("favicon.ico", "static/images/favicon.ico")
	router.GET("/", func(c *gin.Context) {
		var role = ""
		var username = ""
		session := sessions.Default(c)
		if (session.Get(controller.SESSION_KEY) != nil) {
			username = session.Get(controller.SESSION_KEY).(string)
			role = utils.GetUser(username).Role
		}
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title":    "首页",
			"role":     role,
			"username": username,
		})
	})
	router.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{"title": "登录"})
	})
	router.GET("/users", func(c *gin.Context) {
		var role = ""
		var username = ""
		session := sessions.Default(c)
		if (session.Get(controller.SESSION_KEY) != nil) {
			username = session.Get(controller.SESSION_KEY).(string)
			role = utils.GetUser(username).Role
		}
		c.HTML(http.StatusOK, "users.html", gin.H{
			"title":    "用户管理",
			"role":     role,
			"username": username,
		})
	})
	//使用以下gin提供的Group函数为不同的API进行分组
	v1 := router.Group("user")
	{
		v1.POST("/register", controller.Register)
		v1.POST("/login", controller.Login)
		v1.POST("/logout", controller.Logout)
	}

	v2 := router.Group("doc")
	{
		v2.GET("/tree", controller.TreeHandler)
		v2.GET("/detail", controller.DetailHandler)
	}

	v3 := router.Group("manage")
	v3.Use(controller.AuthMiddleWare())
	{
		//v3.GET("/tree", controller.TreeOwnSelfHandler)
		v3.POST("/dir/add", controller.AddDirHandler)
		v3.POST("/dir/del", controller.DeleteDirHandler)
		v3.POST("/dir/rename", controller.RenameDirHandler)
		v3.POST("/file/add", controller.AddFileHandler)
		v3.POST("/file/del", controller.DeleteFileHandler)
		v3.POST("/file/edit", controller.EditFileHandler)
		v3.POST("/file/rename", controller.RenameFileHandler)
		v3.POST("/img/upload", controller.FileuploadHandler)
	}
	//监听服务器端口
	router.Run(":" + port)
}
