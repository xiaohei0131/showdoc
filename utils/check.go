package utils

//判断是否存在用户
func IsExist(user string) bool {
	//如果长度为0说明尚未有用户注册
	if len(Slice) == 0 {
		return false
	} else {
		//遍历切片
		for _, v := range Slice {
			// return v.Name == user //此时只能和第一个比较，所以第一个之后全为false
			if v.Username == user {
				return true
			}
		}
	}
	return false
}
//判断密码是否正确
func IsRight(user string, passwd string) bool {
	for _, v := range Slice {
		if v.Username == user {
			//先确认姓名一致，密码相同返回true
			return v.Password == passwd
		}
	}
	return false
}

//获取用户角色
func GetUser(user string) User {
	for _, v := range Slice {
		if v.Username == user {
			//先确认姓名一致，密码相同返回true
			return v
		}
	}
	return User{}
}
