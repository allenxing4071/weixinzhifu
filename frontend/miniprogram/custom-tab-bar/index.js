Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#ff6b35",
    list: [
      {
        pagePath: "/pages/points/index",
        iconPath: "◈",
        selectedIconPath: "◆",
        text: "积分"
      },
      {
        pagePath: "/pages/profile/index", 
        iconPath: "◯",
        selectedIconPath: "●",
        text: "我的"
      }
    ]
  },
  
  attached() {
    // 获取当前页面路径
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 添加空值检查避免route属性未定义错误
    if (currentPage && currentPage.route) {
      const url = currentPage.route;
      // 设置当前选中的tab
      this.setSelected(url);
    }
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 切换tab
      wx.switchTab({ url });
      this.setSelected(url);
    },
    
    setSelected(url) {
      const list = this.data.list;
      for (let i = 0; i < list.length; i++) {
        if (list[i].pagePath === `/${url}`) {
          this.setData({
            selected: i
          });
          break;
        }
      }
    }
  }
});