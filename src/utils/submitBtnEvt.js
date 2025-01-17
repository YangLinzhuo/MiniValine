import dom from './plugins/dom'
import MakeComment from './plugins/MakeComment'
import check from './plugins/check'
const submitBtnEvt = (root) => {
  const submitBtn = root.el.querySelector('.vsubmit')
  root.submitEvt = (e) => {
    if (submitBtn.getAttribute('disabled')) {
      root.alert.show({
        type: 0,
        text: root.i18n.wait + 'ヾ(๑╹◡╹)ﾉ"',
        ctxt: root.i18n.ok
      })
      return
    }
    if (root.C.comment === '') {
      root.inputs.comment.focus()
      return
    }
    if (root.C.nick === '') {
      root.inputs.nick.focus()
      return
    }
    // render markdown
    const render = (root) => {
      root.C.comment = root.TEXT
      if (root.C.at !== '') {
        const at = `<a class="at" href='#${root.C.pid}'>${root.C.at}</a>`
        if(new RegExp("^<p>").test(root.C.comment))
          root.C.comment = root.TEXT.replace("<p>", `<p>${at} , `)
        else 
          root.C.comment = at + ' , ' + root.C.comment
      }
      // veirfy
      const mailRet = check.mail(root.C.mail)
      const linkRet = check.link(root.C.link)
      root.C.mail = mailRet.k ? mailRet.v : ''
      root.C.link = linkRet.k ? linkRet.v : ''
      root.C.mailMd5 = md5(root.C.mail)
      if (!mailRet.k || !linkRet.k) {
        root.alert.show({
          type: 0,
          text: root.i18n.inputTips,
          ctxt: root.i18n.confirm
        })
      } else {
        commitEvt()
      }
    }
    MakeComment(root, root, render)
  }
  // setting access
  const getAcl = () => {
    const acl = new root.v.ACL()
    acl.setWriteAccess('role:' + root.role, true)
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(false)
    return acl
  }
  const commitEvt = () => {
    submitBtn.setAttribute('disabled', true)
    root.submitting.show()
    // 声明类型
    const Ct = root.v.Object.extend('Comment')
    // 新建对象
    const comment = new Ct()
    for (const i in root.C) {
      if (root.C.hasOwnProperty(i)) {
        if (i === 'at') continue
        const _v = root.C[i]
        comment.set(i, _v)
      }
    }
    try {
      const IPv4reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
      const IPv6reg = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/
      const testip = root.C.ip
      if ((!testip) || (!((IPv4reg.test(testip)) || (IPv6reg.test(testip)))) || (testip == '127.0.0.1')) {
        window.MV.fuck = 0
        kill()
      }
    } catch (e) {}
    comment.setACL(getAcl())
    comment
      .save()
      .then((commentItem) => {
        localStorage &&
            localStorage.setItem(
              '_ValineCache',
              JSON.stringify({
                nick: root.C.nick,
                link: root.C.link,
                mail: root.C.mail
              })
            )
        const _count = root.el.querySelector('.count')
        _count.innerText = Number(_count.innerText) + 1
        if (root.C.rid === '') {
          root.insertComment(commentItem, null, true)
        } else {
          // get children vlist
          const _vlist = root.el.querySelector(`#children-${root.C.rid}`)
          root.insertComment(commentItem, _vlist, false)
        }
        submitBtn.removeAttribute('disabled')

        // 推送消息
        var title = '收到一条新评论';
        var content = `${root.C.nick} 给你留言：\n\n ${root.C.comment}\n\n`;
        var options = { 
          method: 'POST',
          url: `https://sc.ftqq.com/${root.sendKey}.send`,
          qs: { 
              text: title,
              desp: content
          },
          headers: { } 
        };
        console.log("content");

        http(options, function (error, response, body) {
          if (error) {
            console.log(error);
            throw new Error(error);  
          }
          console.log(body);
        });

        root.submitting.hide()
        root.nodata.hide()
        root.reset()
        // try {
        //   if (window.MV.MC && window.MV.MC.util) {
        //     window.MV.MC.util.Visitor()
        //   }
        // } catch (e) {}
      })
      .catch((ex) => {
        root.submitting.hide()
      })
  }
  dom.on('click', submitBtn, root.submitEvt)
}
module.exports = submitBtnEvt
