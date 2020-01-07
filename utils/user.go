package utils

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
)

const ROLE_ADMIN string = "admin"
const ROLE_NORMAL string = "normal"

//用于存储用户信息的结构体，Id,Name,Passwd
type User struct {
	Id        int      `json:"id"`
	Username  string   `json:"username"`
	Password  string   `json:"password"`
	Role      string   `json:"role"`
	Resources []string `json:"resources"`
}

//用于存储用户的切片
var Slice []User

//添加用户
func AddStruct(name string, passwd string) {
	var user User
	user.Username = name
	user.Password = passwd
	user.Id = len(Slice) + 1
	Slice = append(Slice, user)
}

const configPath string = "./config/users.json"

func Init() {
	// 打开文件
	file, err := os.Open(configPath)
	//checkErr(err)
	if err != nil {
		log.Fatalln("配置文件读取失败")
	}
	// 关闭文件
	defer file.Close()
	//NewDecoder创建一个从file读取并解码json对象的*Decoder，解码器有自己的缓冲，并可能超前读取部分json数据。
	decoder := json.NewDecoder(file)
	//Decode从输入流读取下一个json编码值并保存在v指向的值里
	err = decoder.Decode(&Slice)
	if err != nil {
		log.Fatalln("配置文件读取失败")
	}
}

func AddResourceToUser(resource string, username string) bool {
	for i, v := range Slice {
		if v.Username == username {
			//先确认姓名一致，密码相同返回true
			v.Resources = append(v.Resources, resource)
			Slice[i] = v
			break
		}
	}
	return saveUsers()
}

func saveUsers() bool {
	content, err := json.Marshal(Slice)
	if err != nil {
		return false
	} else {
		err = ioutil.WriteFile(configPath, content, 0644)
		if err != nil {
			return false
		}
		return true
	}
}

func RenameResourceFormUser(oldResource string, newResource string,username string) bool {
	for i, v := range Slice {
		if v.Username == username {
			//先确认姓名一致，密码相同返回true
			for j, r := range v.Resources {
				if r == oldResource{
					v.Resources[j] = newResource
					break
				}
			}
			Slice[i] = v
			break
		}
	}
	return saveUsers()
}

func RemoveResourceFormUser(resource string, username string) bool {
	for i, v := range Slice {
		if v.Username == username {
			//先确认姓名一致，密码相同返回true
			var delIndex int
			for j, r := range v.Resources {
				if r == resource{
					delIndex = j
					break
				}
			}
			v.Resources = append(v.Resources[:delIndex], v.Resources[delIndex+1:]...)
			Slice[i] = v
			break
		}
	}
	return saveUsers()
}
