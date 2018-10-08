
const host = "https://carsplus.17link.cc/";
var firstLogin = true;
// 检测微信小程序环境
if (wx) {
  wx.$ = {};
  wx.$.host = host;
  wx.$.getRequestOptions = function (options) {
    let url = options.url;
    let header = options.header || {};

    if (
      options.url.indexOf("https://") !== 0 &&
      options.url.indexOf("http://") !== 0
    ) {
      if (options.url.indexOf("?") == -1) {
        url = `${wx.$.host}${options.url}?api_token=${wx.getStorageSync('token')}`;
      } else {
        url = `${wx.$.host}${options.url}&api_token=${wx.getStorageSync('token')}`;
      }
    } else {
      if (options.url.indexOf(`${wx.$.host}`) !== 0) {
        url = `${wx.$.host}`;
        header.Proxy = options.url;
      }
    }

    header = Object.assign(
      {
        "Content-Type": "application/json"
      },
      header
    );

    return Object.assign(options, { url, header });
  };
  wx.$.request = function (options) {
    return wx.request(wx.$.getRequestOptions(options));
  };
  wx.$.login = function (userInfo) {
    wx.showLoading({
      title: '登录中...'
    })
    wx.login({
      success: res => {
        const code = res.code;
        if (code) {
          const data = {
            code: code,
            encryptedData: userInfo.encryptedData,
            iv: userInfo.iv
          };
          wx.$.request({
            url: host + 'api/login',
            method: "POST",
            data: data,
            success: res => {
              if (res && res.data.api_token) {
                wx.setStorageSync("token", res.data.api_token);
                wx.setStorageSync("info", res.data.info);
                setTimeout(() => {
                  wx.navigateBack()
                  wx.hideLoading()
                }, 500)
              } else if (res.data.error === 'error' && res.data.status == 400){
                wx.hideLoading()
                wx.showModal({
                  title: '提示',
                  content: '当前账号权限已被禁用，如有疑问，请联系客服人员。',
                  confirmColor: '#00A0E8',
                  showCancel: false
                });
              } else {
                wx.hideLoading()
                wx.showModal({
                  title: '提示',
                  content: '登录失败',
                  confirmColor: '#00A0E8',
                  showCancel: false
                });
              };
            },
            fail: res => {
              console.error(
                "wx.$.login request Fail" +
                res.errMsg
              );
            }
          });
          fail: res => {
            console.error(
              "wx.$.login wx.getUserInfo Fail" +
              res.errMsg
            );
          }

        } else {
          console.error(
            "wx.$.login wx.login Fail" + res.errMsg
          );
        }
      }
    });

  };
  wx.$.fetch = function (url, options = {}) {
    options.url = url;
    if (!options.hideLoading) {
      wx.showLoading({
        title: '加载中',
      })
    };
    
    return new Promise((resolve, reject) => {
      options.success = res => {
        if (!options.showLoading) {
          wx.hideLoading()
        };
        if (res.data.msg == 'invalid login.' && firstLogin == true) {
          firstLogin = false;
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login',
            }) 
            firstLogin = true;
          }, 500)
         
        } else {
          const myInfo = wx.getStorageSync('myInfo');
          if (myInfo.member_state == 1) {
            firstLogin == true
            wx.stopPullDownRefresh()
            resolve(res);
          } else if (myInfo.member_state == 2){
            wx.hideLoading()
            
            resolve(res);
            wx.stopPullDownRefresh()
            wx.showModal({
              title: '提示',
              content: '当前账号权限已被禁用，如有疑问，请联系客服人员。',
              confirmColor: '#00A0E8',
              showCancel: false,
              success(res) {
                if (res.confirm) {
                  wx.removeStorageSync('token');
                  wx.removeStorageSync('info');
                  wx.removeStorageSync('myInfo');
                  wx.navigateTo({
                    url: '/pages/login/login',
                  }) 
                  firstLogin = true;
                }
              }
            });
          } else {
            firstLogin == true
            wx.stopPullDownRefresh()
            resolve(res);
          }

          
        }
      };
      options.fail = res => {
        wx.stopPullDownRefresh()
        wx.hideLoading()
        wx.showToast({
          title: '数据请求失败！请刷新页面重新请求！',
          icon: 'none'
        })
        reject(res);
      };
      wx.$.request(options);
    });
  };
  wx.$.upload = function (options) {
    return wx.uploadFile(wx.$.getRequestOptions(options));
  };
  module.exports = wx.$;
}
