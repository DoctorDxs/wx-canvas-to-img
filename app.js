//app.js
import './utils/$'
App({
  onLaunch: function () {
    
  },
  onShow: function (opp) {
    if (opp.scene == 1007 || opp.scene == 1008) {
      wx.setStorageSync('share', true)
    } else {
      wx.setStorageSync('share', false)
    }
  },
  globalData: {
    
  }
})