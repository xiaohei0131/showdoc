package controller

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
	"showdoc/utils"
)

//注册
func Register(c *gin.Context) {
	//获取用户名、密码
	username := c.PostForm("username")
	password := c.PostForm("password")
	//判断用户是否存在
	//存在输出状态1
	//不存在创建用户，保存密码与用户名
	Bool := utils.IsExist(username)
	res := Result{}
	if Bool {
		res.Code = 1
		res.Datas = "此用户已存在！"
	} else {
		//用户不存在即添加用户
		utils.AddStruct(username, password)
		res.Code = 0
		res.Datas = "注册成功！"
	}

	//把状态码和注册状态返回给客户端
	c.JSON(http.StatusOK, res)
}

//登录
func Login(c *gin.Context) {
	res := Result{}
	username := c.PostForm("username")
	password := c.PostForm("password")
	//先判断用户是否存在，存在再判断密码是否正确
	Bool := utils.IsExist(username)
	if Bool {
		Bool_Pwd := utils.IsRight(username, password)
		if Bool_Pwd {
			res.Code = 0
			res.Datas = "登录成功！"
			session := sessions.Default(c)
			//session.Options(sessions.Options{MaxAge:10})
			//session.Set(SESSION_KEY, utils.GetUser(username))
			session.Set(SESSION_KEY, username)
			session.Save()
		} else {
			res.Code = 1
			res.Datas = "密码错误！"
		}
	} else {
		res.Code = 2
		res.Datas = "登录失败！此用户尚未注册！"
	}

	c.JSON(http.StatusOK, res)
}

//退出登录
func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete(SESSION_KEY)
	//session.Options(sessions.Options{MaxAge:-1})
	session.Save()

	res := Result{Code: 0, Datas: "退出成功"}
	c.JSON(http.StatusOK, res)
}
