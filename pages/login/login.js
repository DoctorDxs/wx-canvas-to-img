// pages/login/login.js
Page({
  getUserInfo (e) {
    var data = e.detail;
    wx.$.login(data)
  }
})