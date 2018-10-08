var WxParse = require('../../wxParse/wxParse.js');

Page({


  data: {
    detail: {},
    comments: [],
    page: 1,
    showShareModal: false,
    replyInput: false,
    replyText: '',
    commentText: '',
    current: 0,
    showAll: false,
    openSet: false
  },
  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id,
      })
    };

  },

  onShow() {
    const myInfo = wx.getStorageSync('info');
    const myInfo2 = wx.getStorageSync('myInfo');
    const id = this.data.id;
    if (myInfo) {
      this.setData({
        myId: myInfo.member_id
      })
    };
    this.setData({
      myInfo2: myInfo2
    })
    this.setData({
      page: 1,
      comments: []
    })
    this.getData()
    this.getComment()
  },

  previewImg(e) {
    const url = e.currentTarget.dataset.url;
    let taht = this;
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },


  // 授权
  cancleSet() {
    this.setData({
      openSet: false
    })
  },

  getData() {
    wx.$.fetch(`api/post/detail?id=${this.data.id}`,{hideLoading:true}).then(res => {
      if (res.statusCode == 200 && res.data.state == 200){
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

  // 评论列表
  getComment() {
    wx.$.fetch(`api/comment/list?post_id=${this.data.id}&page=${this.data.page}`,{hideLoading:true}).then(res => {
      if (res.statusCode) {
        let data = res.data.data;
        let comments = this.data.comments
        if (data.length > 0) {
          comments = comments.concat(data)
          this.setData({
            comments: comments,
          })
        };
      }
    })
  },
  cancleInput() {
    this.setData({
      replyInput: false
    })
  },
  showAll(e) {
    this.setData({
      showAll: !this.data.showAll
    })
  },
  // 评论点赞
  suportComment(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    let comments = this.data.comments;
    wx.$.fetch('api/comment/upvote', {
      hideLoading: true,
      method: 'post',
      data: {
        api_token: wx.getStorageSync('token'),
        comment_id: id
      }
    }).then(res => {
      if (res.data.state) {
        comments.forEach((item, itemIndex) => {
          if (index == itemIndex) {
            item.upvote_num = item.upvote_num + 1;
            item.my_upvote_num = item.my_upvote_num + 1
          }
        })
        this.setData({
          comments: comments
        })
      }
    })
  },

  // 提交评论
  submitComment(e) {
    if (this.data.myInfo2.evaluate_permission == 1) {
      const comment = e.detail.value;
      if (comment.trim()) {
        wx.$.fetch('api/comment/add', {
          hideLoading: true,
          method: 'post',
          data: {
            post_id: this.data.id,
            content: comment,
            api_token: wx.getStorageSync('token')
          }
        }).then(res => {
          if (res.statusCode == 200 && res.data.state == 200) {
            wx.showToast({
              title: res.data.msg,
            })
            this.setData({
              commentText: '',
              page: 1,
              comments: []
            })
            this.getComment()
            

          } else if (res.statusCode == 200 && res.data.state == 400) {
            wx.showToast({
              title: res.data.msg,
              icon: 'none'
            })
          };
          setTimeout(() => {
            this.getData()
          }, 500)
          
        })
      }
    } else {
      wx.showModal({
        title: '提示',
        content: '您已经被禁止评论，如有疑问请联系客服！',
        showCancel: false,
        success: function(res) {},
      })
    }
  },

  // 关注
  focusUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.$.fetch('api/addFocus', {
      hideLoading: true,
      method: 'post',
      data: {
        api_token: wx.getStorageSync('token'),
        member_id: id
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
        }, 100)
      }
    })
  },

  // 取关
  cancleFocus(e) {
    const id = e.currentTarget.dataset.id;
    wx.$.fetch('api/disFocus', {
      hideLoading: true,
      method: 'post',
      data: {
        api_token: wx.getStorageSync('token'),
        member_id: id,
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
        }, 100)
      }
    })
  },

  // 收藏
  collectPost() {
    wx.$.fetch('api/addCollect', {
      hideLoading: true,
      method: 'post',
      data: {
        post_id: this.data.id,
        api_token: wx.getStorageSync('token')
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
        })
      }
    })
  },

  // 取消收藏
  cancleCollect() {
    wx.$.fetch('api/cancelCollect', {
      hideLoading: true,
      method: 'post',
      data: {
        post_id: this.data.id,
        api_token: wx.getStorageSync('token')
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
        })
      }
    })
  },

  // 点赞
  upvote() {
    wx.$.fetch('api/addUpvote', {
      method: 'post',
      hideLoading: true,
      data: {
        post_id: this.data.id,
        api_token: wx.getStorageSync('token')
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
      }
    })
  },

  // 取消点赞
  unUpovte() {
    wx.$.fetch('api/cancelUpvote', {
      method: 'post',
      hideLoading: true,      
      data: {
        post_id: this.data.id,
        api_token: wx.getStorageSync('token')
      }
    }).then(res => {
      if (res.statusCode == 200 && res.data.state == 200) {
        this.getData()
      }
    })
  },
  // 商务合作
  partnership() {
    wx.navigateTo({
      url: '/pages/cooperation/index',
    })
  },

  // 点击头像 跳转到个人主页
  linkUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/userHomePage/index?id=' + id,
    })
  },

  // 回复
  reply(e) {
    const id = e.currentTarget.dataset.id;
    const comment = e.currentTarget.dataset.comment;
    const name = e.currentTarget.dataset.name;
    console.log(name)
    this.setData({
      replyId: id,
      replyInput: true,
      comment: comment,
      replayName: name
    })
  },

  // 回复回复
  replyReply(e) {
    const comment = e.currentTarget.dataset.comment;
    const id = e.currentTarget.dataset.member;
    const name = e.currentTarget.dataset.name;
    this.setData({
      replyId: id,
      replyInput: true,
      comment: comment,
      replayName: name
    })
  },

  getReply(e) {
    const replyText = e.detail.value;
    if (replyText.trim()) {
      this.setData({
        replyText: replyText
      })
    }
  },

  submitReply() {
    // 对某条评论回复
    if (this.data.comment == 1) {
      wx.$.fetch('api/comment/replyComment', {
        method: 'post',
        hideLoading: true,
        data: {
          content: this.data.replyText,
          comment_id: this.data.replyId,
          api_token: wx.getStorageSync('token')
        }
      }).then(res => {
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
          this.setData({
            replyText: '',
            replyInput: false,
            page: 1,
            comments: []
          })
          this.getComment()
        }, 100)
      })
    } else if (this.data.comment == 2) {
      wx.$.fetch('api/comment/reply', {
        method: 'post',
        hideLoading: true,
        data: {
          content: this.data.replyText,
          id: this.data.replyId,
          api_token: wx.getStorageSync('token')
        }
      }).then(res => {
        setTimeout(() => {
          wx.showToast({
            title: res.data.msg,
          })
          this.setData({
            replyText: '',
            replyInput: false,
            page: 1,
            comments: []
          })
          this.getComment()
        }, 100)
      })
    }
  },


  canvasIdErrorCallback(e) {
    console.error(e.detail.errMsg)
  },

  createdCode() {
    let that = this;
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
    ctx.drawImage(this.data.cover, 0, (coverHeight - 129 * coverWidth / 252) / 2, coverWidth, 129*coverWidth/252 , 16, 94, 252, 129);

    
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
    // ctx.setFillStyle('#f7f7f7')
    // ctx.fillRect(0, 400 + titleHight, 286, 48)
    // ctx.setFontSize(14);
    // ctx.setFillStyle('#bbbbbb')
    // ctx.setTextAlign('center');
    // ctx.fillText('长按图片保存至相册，并分享至朋友圈！', 142, 430 + titleHight);

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

  shareFrends() {
    wx.showLoading({
      title: '图片生成中',
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
  getCurrent(e) {
    this.setData({
      current: e.detail.current
    })
  },
  hideModal() {
    this.setData({
      showModal: false
    })
  },
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

  showShareModal() {
    this.setData({
      showShareModal: !this.data.showShareModal
    })
  },
  hideShareModal() {
    this.setData({
      showShareModal: false
    })
  },

  addShareData(wxChate) {
    wx.$.fetch('api/post/sharePost?post_id=' + this.data.id, {hideLoading: true}).then(res => {
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

  // 评论头像跳转
  linCommentkUser(e) {
    return false
    const id = e.currentTarget.dataset.id;
    //  需要判断是否是自己，是自己跳转到自己主页
    const myId = this.data.myId
    if (myId == id) {
      wx.navigateTo({
        url: '/pages/myHomePage/index?id=' + id,
      })
    } else {
      wx.navigateTo({
        url: '/pages/userHomePage/index?id=' + id,
      })
    }
  },

  onReachBottom() {
    this.setData({
      page: this.data.page + 1
    })
    this.getComment()
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      comments: [],
    })
    this.getComment()
  },

  // 转发
  onShareAppMessage(options) {
    const detail = this.data.detail;
    this.setData({
      showShareModal: false
    })
    const that = this;
    const ctx = wx.createCanvasContext('cropperCocer');
    let shareCover = detail.post_cover || '../../imgs/post_cover.png';
    let shareImg = shareCover;
    wx.getImageInfo({
      src: shareCover,
      success: res => {
        if (!/^https/.test(shareCover)) {
          res.path = shareCover
        };
        ctx.drawImage(res.path, (res.width - 250 * res.height / 200) / 2, 0, 250 * res.height / 200,res.height, 0, 0, 250, 200);
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
        setTimeout(() => {
          wx.showToast({
            title: '分享失败！',
            icon: 'none'
          },800)
        })
        
      }
    }
  }
})