package utils

import (
	"fmt"
	"github.com/wxnacy/wgo/arrays"
	"io/ioutil"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

type Item struct {
	Type     string `json:"type"`
	Name     string `json:"name"`
	Path     string `json:"path"`
	Editable bool   `json:"editable"`
	Children []Item `json:"children"`
}

func GetSub(pathname string) []Item {
	fromSlash := filepath.FromSlash(pathname)
	rd, err := ioutil.ReadDir(fromSlash)
	if err != nil {
		fmt.Println("read dir fail:", err)
		return nil
	}
	//var len = len(rd)
	var items []Item
	for _, fi := range rd {
		mitem := Item{Name: strings.TrimSuffix(filepath.Base(fi.Name()), path.Ext(fi.Name())), Type: "file",Editable:false}
		if fi.IsDir() {
			mitem.Type = "group"
		} else {
			if (strings.ToLower(path.Ext(fi.Name())) != ".md") {
				continue
			}
		}
		fullDir := filepath.Join(fromSlash, fi.Name())
		mitem.Path = fullDir
		items = append(items, mitem)
	}
	SortItems(items)
	return items
}

/**
一次全部返回
 */
func GetTree(pathname string, item Item, role string, resources []string) (Item, error) {
	fromSlash := filepath.FromSlash(pathname)
	rd, err := ioutil.ReadDir(fromSlash)
	if err != nil {
		fmt.Println("read dir fail:", err)
		return item, err
	}
	for _, fi := range rd {
		mitem := Item{Name: strings.TrimSuffix(filepath.Base(fi.Name()), path.Ext(fi.Name())), Type: "file",Editable:false}
		if fi.IsDir() {
			fullDir := filepath.Join(fromSlash, fi.Name())
			subItem, err := GetTree(fullDir, mitem, role, resources)
			if err != nil {
				fmt.Println("read dir fail:", err)
				continue
			}
			mitem = subItem
			mitem.Type = "group"
			mitem.Path = fullDir
			if(role == ROLE_ADMIN){
				mitem.Editable=true
			}
			SortItems(mitem.Children)
		} else {
			if (strings.ToLower(path.Ext(fi.Name())) != ".md") {
				continue
			}
			fullName := filepath.Join(fromSlash, fi.Name())
			mitem.Path = fullName
			if(role != "" && (role == ROLE_ADMIN || arrays.ContainsString(resources, fullName) >= 0)){
				mitem.Editable=true
			}
		}
		item.Children = append(item.Children, mitem)
		item.Path = pathname
		SortItems(item.Children)
	}
	return item, nil
}
func SortItems(items []Item) {
	sort.Slice(items, func(i int, j int) bool {
		if (items[i].Type == items[j].Type) {
			return items[i].Name < items[j].Name
		}
		return items[i].Type > items[j].Type
	})
}
