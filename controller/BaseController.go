package controller

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Result struct {
	Code  int         `json:"code"`
	Datas interface{} `json:"datas"`
}

const SESSION_KEY string = "user-login"

//设置默认路由当访问一个错误网站时返回
func NotFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"status": 404,
		"error":  "404 ,page not exists!",
	})
}

func AuthMiddleWare() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		uname := session.Get(SESSION_KEY)
		if session != nil && uname != nil  && uname.(string) != "" {
			c.Next()
			return
		}
		if url := c.Request.URL.String(); url == "/login" {
			c.Next()
			return
		}
		c.JSON(http.StatusUnauthorized, Result{
			Code:  403,
			Datas: "权限不足",
		})
		c.Abort()
	}
}
