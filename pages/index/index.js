//index.js
//获取应用实例
const WxParse = require('../../wxParse/wxParse.js');
const app = getApp()
Page({
  data: {
    detail: {},
    showShareModal: true
  },

  onShow() {
    this.getData()
  },
  getData() {
    wx.$.fetch(`api/post/detail?id=244`).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        if (res.data.data.member.member_id == this.data.myId) {
          this.setData({
            myPost: true
          })
        };
        let data = res.data.data
        this.setData({
          detail: data
        })
        let postingContent = data.post_content;
        let client = data.client
        if (client == 1 && (!res.data.data.garageImage || res.data.data.garageImage.length == 0)) {
          postingContent = JSON.parse(postingContent);
          let content = '';
          postingContent.forEach(item => {
            if (item.content) {
              content = content + '<p style="margin: 30rpx 0;">' + item.content + '</p>'
            } else if (item.src) {
              content = content + '<div style="width: 690rpx;"><img src=' + '"' + item.src + '" ' + ' /></div>'
            } else if (item.emoji) {
              content = content + '<img class="emoji-img" style="width: 40rpx; height:40rpx;display: inline-block;" src=' + '"' + item.emoji + '" ' + ' />'
            }
          })
          if (content) {
            WxParse.wxParse('content', 'html', content, this, 5);
          }
        } else {
          WxParse.wxParse('content', 'html', postingContent, this, 5);
        }
      } else {
        wx.showModal({
          title: '提示',
          content: res.data.msg,
          showCancel: false,
          success: res => {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        })
      }
    })
  },









///////////////////////////////////// 绘图

  canvasIdErrorCallback(e) {
    console.error(e.detail.errMsg)
  },

  createdCode() {
    const that = this;
    const detail = this.data.detail;
    const ctx = wx.createCanvasContext('shareFrends');
    const date = new Date;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const time = year + '.' + month + '.' + day;
    const name = detail.post_title;
    const coverWidth = this.data.coverWidth;
    const coverHeight = this.data.coverHeight;
    let pichName = detail.member.name;
    const explain = 'Hi,我想分享给你一条资讯猛料!';
    const erweima = '/imgs/erweima.png'
    // 截取昵称 超出省略。。。
    if (pichName.length > 16) {
      pichName = pichName.slice(0, 9) + '...'
    };
    // 绘制logo
    ctx.save()
    ctx.drawImage('/imgs/canvas-bg.jpg', 0, 0, 286, 480);
    ctx.drawImage('/imgs/share-logo.png', 140, 25, 128, 34);

    // 绘制时间
    ctx.setFontSize(12);
    ctx.setTextAlign('right');
    const metrics = ctx.measureText(time).width;
    ctx.fillText(time, 266, 78, metrics + 5);
    // 绘制 封面图并裁剪
    ctx.drawImage(this.data.cover, 0, (coverHeight - 129 * coverWidth / 252) / 2, coverWidth, 129 * coverWidth / 252, 16, 94, 252, 129);


    // 绘制标题
    ctx.font = 'normal bold 14px sans-serif';
    ctx.setTextAlign('left');
    const nameWidth = ctx.measureText(name).width;
    // 标题换行
    this.wordsWrap(ctx, name, nameWidth, 252, 16, 252, 16);
    // 计算标题所占高度
    const titleHight = Math.ceil(nameWidth / 252) * 16;
    // 绘制头像和昵称
    ctx.arc(36, 268 + titleHight, 20, 0, 2 * Math.PI);
    ctx.clip()
    ctx.drawImage(this.data.avatar, 16, 248 + titleHight, 40, 44);
    ctx.restore();
    ctx.font = 'normal normal 14px sans-serif';
    ctx.setTextAlign('left');
    ctx.setFillStyle('#bbbbbb')
    ctx.fillText(pichName, 70, 270 + titleHight);
    // 二维码描述  及图片
    ctx.setStrokeStyle('#eeeeee');
    ctx.strokeRect(16, 300 + titleHight, 252, 80);
    ctx.setFillStyle('#333333')
    ctx.fillText(explain.slice(0, 11), 30, 336 + titleHight);
    ctx.fillText(explain.slice(11), 30, 358 + titleHight);

    ctx.drawImage(this.data.erweima, 194, 308 + titleHight, 44, 44);
    ctx.setFontSize(10);
    ctx.setFillStyle('#bbbbbb')
    ctx.fillText('长按扫码查看详情', 175, 370 + titleHight);

    ctx.draw()


  },
  // canvas 标题超出换行处理
  wordsWrap(ctx, name, nameWidth, maxWidth, startX, srartY, wordsHight) {
    let lineWidth = 0;
    let lastSubStrIndex = 0;
    for (let i = 0; i < name.length; i++) {
      lineWidth += ctx.measureText(name[i]).width;
      if (lineWidth > maxWidth) {
        ctx.fillText(name.substring(lastSubStrIndex, i), startX, srartY);
        srartY += wordsHight;
        lineWidth = 0;
        lastSubStrIndex = i;
      }
      if (i == name.length - 1) {
        ctx.fillText(name.substring(lastSubStrIndex, i + 1), startX, srartY);
      }
    }
  },
// 将网络图片存为临时图片
  shareFrends() {
    wx.showLoading({
      title: '图片生成中',
      showShareModal: !this.data.showShareModal
    })
    let that = this;
    const detail = this.data.detail;
    let avatar;
    const post_cover = detail.post_cover || '../../imgs/cars.png';
    wx.$.fetch('api/setLocalAvatar', {
      method: 'post',
      hideLoading: true,
      showLoading: true,
      data: {
        api_token: wx.getStorageSync('token'),
        member_id: detail.member.member_id,
      }
    }).then(res => {
      avatar = res.data.url;
      wx.getImageInfo({
        src: avatar,
        success: res => {
          that.setData({
            avatar: res.path
          })
          wx.getImageInfo({
            src: post_cover,
            success: res => {
              if (!/^https/.test(post_cover)) {
                res.path = post_cover
              };
              that.setData({
                cover: res.path,
                coverWidth: res.width,
                coverHeight: res.height
              })
              wx.$.fetch('api/getQrCode', {
                method: 'post',
                hideLoading: true,
                showLoading: true,
                data: {
                  path: 'pages/topicdetail/index?id=' + this.data.id,
                  post_id: this.data.id,
                  width: 340
                }
              }).then(res => {
                wx.getImageInfo({
                  src: res.data.path,
                  success: res => {
                    that.setData({
                      erweima: res.path
                    })
                    that.createdCode()
                    setTimeout(() => {
                      wx.canvasToTempFilePath({
                        x: 0,
                        y: 0,
                        canvasId: 'shareFrends',
                        success: function (res) {

                          let shareImg = res.tempFilePath;
                          that.setData({
                            shareImg: shareImg
                          })
                          that.setData({
                            showModal: true,
                            showShareModal: false
                          })
                          wx.hideLoading()
                        },
                        fail: function (res) {
                        }
                      })
                    }, 500)
                  }
                })
              })
            },
            fail(err) {
              console.log(err)
            }
          })
        }
      })
    })
  },
// canvas 生成图片
  saveImg() {
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {
              wx.saveImageToPhotosAlbum({
                filePath: that.data.shareImg,
                success() {
                  wx.showToast({
                    title: '保存成功'
                  })
                  that.addShareData(false)
                },
                fail() {
                  wx.showToast({
                    title: '保存失败',
                    icon: 'none'
                  })
                }
              })
            },
            fail() {
              that.setData({
                openSet: true
              })
            }
          })
        } else {
          wx.saveImageToPhotosAlbum({
            filePath: that.data.shareImg,
            success() {
              wx.showToast({
                title: '保存成功'
              })
            },
            fail() {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },


  // 授权
  cancleSet() {
    this.setData({
      openSet: false
    })
  },
  hideModal() {
    this.setData({
      showModal: false,
      showShareModal: true
    })
  },
  hideShareModal() {
    this.setData({
      showShareModal: false
    })
  },

  addShareData(wxChate) {
    wx.$.fetch('api/post/sharePost?post_id=244').then(res => {
      if (wxChate) {
        // setTimeout(() => {
        //   console.log(5555)
        //   wx.showToast({
        //     title: '分享成功！',
        //   }, 800)
        // })

      }
    })
  },

  // 转发
  onShareAppMessage(options) {
    const detail = this.data.detail;
    const that = this;
    // 分享封面图裁剪
    const ctx = wx.createCanvasContext('cropperCocer');
    let shareCover = detail.post_cover || '../../imgs/post_cover.png';
    let shareImg = shareCover;
    wx.getImageInfo({
      src: shareCover,
      success: res => {
        if (!/^https/.test(shareCover)) {
          res.path = shareCover
        };
        ctx.drawImage(res.path, (res.width - 250 * res.height / 200) / 2, 0, 250 * res.height / 200, res.height, 0, 0, 250, 200);
        ctx.draw()
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          canvasId: 'cropperCocer',
          success: function (res) {
            shareImg = res.tempFilePath;
          },
          fail: function (res) {
            
          }
        })
      }
    })

    return {
      title: detail.post_title,
      imageUrl: shareImg,
      success: function (res) {
        that.addShareData(true)
      },
      fail: function (res) {
        
        that.setData({
          showShareModal: true
        })

      }
    }
  }


  
})
