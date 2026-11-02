/* CHÉRIE Seconde · cầu nối với máy chủ Google Apps Script.
   Giữ đúng kiểu kho dữ liệu app đang dùng: collection().onSnapshot/add, doc().update/delete.
   Trang khách chỉ đọc kệ hàng và gửi đặt giữ, đăng ký ký gửi. Trang quản trị cần đăng nhập PIN. */
(function () {
  "use strict";
  var KEY = "sc-token", ME = "sc-me", token = "", me = null;
  try { token = localStorage.getItem(KEY) || ""; me = JSON.parse(localStorage.getItem(ME) || "null"); } catch (e) {}
  var ADM = window.SC_MODE === "adm";

  function loi(msg, code) { var e = new Error(msg); e.code = code || "error"; return e; }
  /* POST thân JSON dạng text/plain (không cần hỏi trước CORS), tự thử lại khi mạng rớt */
  function call(fn, args) {
    return new Promise(function (ok, no) {
      var api = window.SC_API;
      if (!api) return no(loi("Trang chưa kết nối máy chủ.", "no_api"));
      var body = JSON.stringify(Object.assign({ fn: fn, token: token }, args || {})), lan = 0, cho = [700, 1600, 3200], done = false;
      var tm = setTimeout(function () { if (done) return; done = true; no(loi("Máy chủ Google phản hồi quá 45 giây. Thử lại nhé.", "unavailable")); }, 45000);
      var thu = function () {
        fetch(api, { method: "POST", redirect: "follow", body: body }).then(function (r) { return r.json(); }).then(function (r) {
          if (done) return; done = true; clearTimeout(tm);
          if (r && r.err) { var e = loi(r.err, r.code); if (e.code === "revoked") saveAuth("", null); no(e); } else ok(r);
        }, function () {
          if (done) return;
          if (lan < cho.length) { setTimeout(thu, cho[lan++]); return; }
          done = true; clearTimeout(tm); no(loi("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.", "unavailable"));
        });
      };
      thu();
    });
  }
  function saveAuth(t, m) {
    token = t || ""; me = m || null;
    try { if (token) { localStorage.setItem(KEY, token); localStorage.setItem(ME, JSON.stringify(me)); } else { localStorage.removeItem(KEY); localStorage.removeItem(ME); } } catch (e) {}
  }

  /* bộ nhớ đệm + người nghe theo từng bộ sưu tập */
  var COLS = ["mon", "don", "dangky", "thue", "dathang"], cache = {}, subs = {}, loaded = false;
  COLS.forEach(function (c) { cache[c] = []; subs[c] = []; });
  function snap(c) { return { docs: cache[c].map(function (o) { return { id: o.id, data: function () { return o; } }; }) }; }
  function emit(c) { var s = snap(c); subs[c].forEach(function (f) { try { f(s); } catch (e) { console.error(e); } }); }
  function setAll(d) { COLS.forEach(function (c) { cache[c] = Array.isArray(d[c]) ? d[c] : []; emit(c); }); loaded = true; }
  function find(c, id) { for (var i = 0; i < cache[c].length; i++) if (cache[c][i].id === id) return i; return -1; }
  function apply(c, doc) { var i = find(c, doc.id); if (i > -1) cache[c][i] = doc; else cache[c].push(doc); emit(c); }

  var db = {
    collection: function (c) {
      return {
        onSnapshot: function (fn) { subs[c].push(fn); if (loaded) fn(snap(c)); return function () { subs[c] = subs[c].filter(function (x) { return x !== fn; }); }; },
        add: function (obj) {
          if (!ADM) {
            if (c === "dathang") return call("datHang", obj).then(function (r) {
              (r.items || []).forEach(function (it) { var i = find("mon", it.monId); if (i > -1) cache.mon[i].tt = "giu"; }); emit("mon"); return { id: r.id };
            });
            if (c === "dangky") return call("dangKy", obj).then(function (r) { return { id: r.id }; });
            return Promise.reject(loi("Không được phép", "invalid_argument"));
          }
          return call("put", { c: c, obj: obj }).then(function (r) { apply(c, r.doc); return { id: r.doc.id }; });
        }
      };
    },
    doc: function (path) {
      var p = String(path).split("/"), c = p[0], id = p[1];
      return {
        update: function (obj) {
          if (!ADM) { /* máy chủ đã tự cập nhật khi đặt giữ */ var i = find(c, id); if (i > -1) { Object.assign(cache[c][i], obj); emit(c); } return Promise.resolve(); }
          return call("put", { c: c, id: id, obj: obj }).then(function (r) { apply(c, r.doc); });
        },
        delete: function () {
          if (!ADM) return Promise.reject(loi("Không được phép", "invalid_argument"));
          return call("del", { c: c, id: id }).then(function () { cache[c] = cache[c].filter(function (x) { return x.id !== id; }); emit(c); });
        }
      };
    }
  };

  /* ảnh: nén sẵn ở app, gửi base64 lên Drive */
  var assets = {
    upload: function (blob) {
      return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = function () { no(loi("Không đọc được ảnh")); }; fr.readAsDataURL(blob); })
        .then(function (data) { if (data.length > 2800000) throw loi("Ảnh quá lớn", "too_large"); return call("upAnh", { data: data }); })
        .then(function (r) { return { id: r.id }; });
    }
  };

  var dangTai = false;
  function tai() {
    if (dangTai) return Promise.resolve(); dangTai = true;
    return (ADM ? call("load").then(function (r) { if (r.me) saveAuth(token, r.me); setAll(r.data || {}); }) : call("pub").then(function (r) { setAll({ mon: r.mon || [] }); }))
      .then(function () { dangTai = false; }, function (e) { dangTai = false; throw e; });
  }
  var hen = 0;
  function start() {
    return tai().then(function () {
      clearInterval(hen);
      /* quản trị: đồng bộ 30 giây một lần khi đang mở; cửa hàng: 2 phút */
      hen = setInterval(function () { if (!document.hidden && !document.querySelector(".sheet:not([hidden]) form")) tai().catch(function () {}); }, ADM ? 30000 : 120000);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) tai().catch(function () {}); });
    });
  }

  window.SC = { call: call, saveAuth: saveAuth, token: function () { return token; }, me: function () { return me; }, db: db, assets: assets, start: start, reload: tai };
})();
