package main

import (
	"flag"
	"showdoc/router"
	"showdoc/utils"
)

func main()  {
	var port string
	flag.StringVar(&port, "port", "8080", "端口号，默认值 8080")
	flag.Parse()
	//初始化用户列表
	utils.Init()
	//启动服务
	router.InitRouter(port)
}
