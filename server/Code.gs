/* CHÉRIE Seconde · máy chủ (Google Apps Script)
   Dữ liệu: Sheet "CHÉRIE Seconde · Quản lý" (tab Mon, DatHang, DonBan, DangKy, LuotThue, NhanSu, NhatKy).
   Triển khai: Triển khai → Triển khai mới → Loại: Ứng dụng web · Thực thi với tư cách: Tôi · Người có quyền truy cập: Bất kỳ ai.
   Lần đầu Google hỏi quyền (Sheet + Drive để lưu ảnh): chọn tài khoản → Nâng cao → Đi tới dự án → Cho phép.
   Đăng nhập RIÊNG của Seconde (tab NhanSu). Không đọc, không ghi Sheet của mảng khác. */

var SHEET_ID = "1VeqmVqsdaPih3G_sDDIgauW04ak3xsUGCf4gyVuDh8c";
var TZ = "Asia/Ho_Chi_Minh";
var TOKEN_DAYS = 30;
var ROLES = ["Chủ tiệm", "Nhân viên"];
var ZALO = "0377 159 189";

/* bộ sưu tập ↔ tab */
var TAB = { mon: "Mon", dathang: "DatHang", don: "DonBan", dangky: "DangKy", thue: "LuotThue" };
var PREFIX = { mon: "M", dathang: "DH", don: "DB", dangky: "DK", thue: "LT" };
var JSON_F = ["tinhTrang", "anh", "lichSu", "items", "anhKH", "ai", "phuKien"];
var BOOL_F = ["daTra", "live", "vidu"];
var NUM_F = ["soLuot", "giaNiemYet", "giaSale", "giaDang", "giaSan", "gia", "tiemHuong", "phiSan", "tienChuDo", "tienThueDaTra", "giaMua", "giaMuon", "tien", "chiaChuDo", "tong", "uocTinh", "offer", "giaVon"];
var TT_MON = ["cho", "dang", "giu", "ban", "thue", "tra"];

/* quy tắc giá: khớp app (app.js) */
var GIAM = [[45, 0.65], [30, 0.80]];
function tron(n) { return Math.floor((Number(n) || 0) / 1000) * 1000; }
function soNgay(a, b) { return Math.round((Date.parse(String(b).slice(0, 10) + "T00:00:00Z") - Date.parse(String(a).slice(0, 10) + "T00:00:00Z")) / 864e5); }
function heSo(n) { for (var i = 0; i < GIAM.length; i++) if (n >= GIAM[i][0]) return GIAM[i][1]; return 1; }
function giaNay(m) {
  var goc = Number(m.giaDang) || 0; if (!m.ngayDang) return goc;
  var g = tron(goc * heSo(soNgay(m.ngayDang, now("yyyy-MM-dd"))));
  if (m.nguon !== "cherie" && Number(m.giaSan) > 0) g = Math.max(g, Number(m.giaSan));
  return g;
}

function doGet() { return out({ ok: true, app: "CHÉRIE Seconde" }); }
function doPost(e) {
  var r;
  try { r = handle(JSON.parse((e && e.postData && e.postData.contents) || "{}")); }
  catch (err) { r = { err: String(err && err.message || err), code: (err && err.code) || "error" }; }
  return out(r);
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fail(msg, code) { var e = new Error(msg); e.code = code || "error"; throw e; }
function ss() { return SpreadsheetApp.openById(SHEET_ID); }
function props() { return PropertiesService.getScriptProperties(); }
function now(f) { return Utilities.formatDate(new Date(), TZ, f || "yyyy-MM-dd HH:mm"); }
function txt(v, n) { v = v == null ? "" : String(v).replace(/[\u0000-\u001f]/g, " ").trim(); return v.slice(0, n || 200); }
function num(v) { var n = Math.round(+String(v == null ? "" : v).replace(/[^\d\-]/g, "") || 0); return isFinite(n) ? n : 0; }
function sdtOk(v) { v = txt(v, 15).replace(/[^\d]/g, ""); if (/^84\d{9}$/.test(v)) v = "0" + v.slice(2); return /^0\d{9}$/.test(v) ? v : ""; }
function pick(v, list, d) { return list.indexOf(v) > -1 ? v : d; }
function cell(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" && (/^0\d+$/.test(v) || /^\d{4}-\d{2}-\d{2}/.test(v) || /^[=+\-@]/.test(v))) return "'" + v;
  return v;
}
function withLock(f) { var l = LockService.getScriptLock(); l.waitLock(20000); try { return f(); } finally { l.releaseLock(); } }

function handle(q) {
  switch (q.fn) {
    case "pub": return pub();
    case "datHang": return datHang(q);
    case "dangKy": return dangKy(q);
    case "traCuu": return traCuu(q);
    case "upAnhKH": return upAnhKH(q);
    case "aiDanhGia": return aiDanhGia(q);
    case "kyHopDong": return kyHopDong(q);
    case "anhRieng": return anhRieng(auth(q.token), q);
    case "hoSoDK": return hoSoDK(auth(q.token), q);
    case "staff": return { staff: staffList() };
    case "login": return login(q.nv, q.pin);
    case "logout": props().deleteProperty("tk_" + q.token); return { ok: true };
    case "me": return { me: auth(q.token) };
    case "load": var me = auth(q.token); return { me: me, data: loadAll(), luc: now() };
    case "put": return put(auth(q.token), q);
    case "del": return del(auth(q.token), q);
    case "upAnh": return upAnh(auth(q.token), q);
    case "luuNhanSu": return luuNhanSu(auth(q.token), q);
  }
  fail("Không rõ yêu cầu", "bad_request");
}

/* ---------- đọc ghi tab theo tên cột ---------- */
function tab(name) {
  var sh = ss().getSheetByName(name); if (!sh) fail("Thiếu tab " + name, "setup");
  var lc = sh.getLastColumn(), lr = sh.getLastRow();
  var head = sh.getRange(1, 1, 1, lc).getDisplayValues()[0];
  var rows = [];
  if (lr > 1) sh.getRange(2, 1, lr - 1, lc).getValues().forEach(function (v, i) {
    var o = { _r: i + 2 }; head.forEach(function (k, j) { if (k) o[k] = v[j]; }); if (v[0] !== "" && v[0] != null) rows.push(o);
  });
  return { sh: sh, head: head, rows: rows };
}
function find(t, key, val) { for (var i = 0; i < t.rows.length; i++) if (String(t.rows[i][key]) === String(val)) return t.rows[i]; return null; }
/* dòng Sheet → đối tượng cho app */
function toDoc(o) {
  var x = {};
  Object.keys(o).forEach(function (k) {
    if (k.charAt(0) === "_" || !k) return; var v = o[k];
    if (v instanceof Date) v = Utilities.formatDate(v, TZ, "yyyy-MM-dd");
    if (JSON_F.indexOf(k) > -1) { if (typeof v === "string" && v.charAt(0) === "'") v = v.slice(1); try { v = v === "" ? (k === "tinhTrang" ? {} : []) : JSON.parse(v); } catch (e) { v = k === "tinhTrang" ? {} : []; } }
    else if (BOOL_F.indexOf(k) > -1) v = v === true || v === "Có" || v === "TRUE";
    else if (NUM_F.indexOf(k) > -1) v = v === "" ? 0 : Number(v) || 0;
    else if (k === "hhRieng") v = v === "" ? null : Number(v);
    else { v = v == null ? "" : String(v); if (v.charAt(0) === "'") v = v.slice(1); }
    x[k] = v;
  });
  return x;
}
/* giá trị app → ô Sheet */
function toCell(k, v) {
  if (JSON_F.indexOf(k) > -1) return JSON.stringify(v == null ? (k === "tinhTrang" ? {} : []) : v).slice(0, 45000);
  if (BOOL_F.indexOf(k) > -1) return v ? "Có" : "";
  if (NUM_F.indexOf(k) > -1) return Math.max(0, Number(v) || 0);
  if (k === "hhRieng") { var n = Number(v); return v === null || v === "" || !isFinite(n) || n < 0 || n > 0.6 ? "" : n; }
  return cell(txt(v, k === "moTa" || k === "ghiChu" || k === "loi" || k === "ghiChuKhach" ? 1500 : 200));
}
function writeObj(t, r, obj) {
  var row = t.sh.getRange(r, 1, 1, t.head.length);
  var vals = row.getValues()[0].map(function (v) { return typeof v === "string" ? cell(v) : v; });
  Object.keys(obj).forEach(function (k) { var j = t.head.indexOf(k); if (j < 0 || k === "id" || k.charAt(0) === "_") return; vals[j] = toCell(k, obj[k]); });
  row.setValues([vals]);
}
function appendObj(t, obj) {
  var vals = t.head.map(function (k) { return k === "id" ? obj.id : (obj[k] === undefined ? "" : toCell(k, obj[k])); });
  t.sh.getRange(t.sh.getLastRow() + 1, 1, 1, t.head.length).setValues([vals]);
}
function newId(c) { return PREFIX[c] + "-" + now("ddMM") + "-" + Utilities.getUuid().slice(0, 6).toUpperCase(); }
function nextMa(rows, prefix) {
  var mx = 0; rows.forEach(function (r) { var v = String(r.id || ""); if (v.indexOf(prefix) === 0) { var n = +v.slice(prefix.length); if (n > mx) mx = n; } });
  return prefix + ("00" + (mx + 1)).slice(-2);
}
function log(me, viec, ma, ct) {
  try { var t = tab("NhatKy"); t.sh.appendRow([now("yyyy-MM-dd HH:mm:ss"), me ? me.id : "web", me ? me.ten : "Website", viec, ma || "", txt(ct, 300)]); } catch (e) {}
}
function xoaCache() { CacheService.getScriptCache().remove("pub"); }

/* ---------- nhân sự & đăng nhập ---------- */
function staffList() {
  return tab("NhanSu").rows.filter(function (n) { return n.Ten && n.Nghi !== "Có"; })
    .map(function (n) { return { id: String(n.MaNV), ten: n.Ten, vaiTro: n.VaiTro, taoPin: !String(n.PIN || "").trim() && n.VaiTro === "Chủ tiệm" }; });
}
function salt() { var s = props().getProperty("SALT"); if (!s) { s = Utilities.getUuid(); props().setProperty("SALT", s); } return s; }
function hashPin(pin) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt() + "|" + pin).map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
}
function login(nv, pin) {
  pin = String(pin || "").trim();
  if (!/^\d{4,8}$/.test(pin)) fail("Mã PIN gồm 4–8 chữ số", "bad_pin");
  var cache = CacheService.getScriptCache(), key = "fail_" + nv, n = +(cache.get(key) || 0);
  if (n >= 5) fail("Sai quá 5 lần. Đợi 15 phút rồi thử lại.", "locked");
  return withLock(function () {
    var t = tab("NhanSu"), u = t.rows.filter(function (x) { return String(x.MaNV) === String(nv) && x.Nghi !== "Có"; })[0];
    if (!u) fail("Không tìm thấy nhân sự", "bad_pin");
    var stored = String(u.PIN || "").trim(), ok = false, col = t.head.indexOf("PIN") + 1;
    if (!stored && u.VaiTro === "Chủ tiệm") { ok = true; t.sh.getRange(u._r, col).setNumberFormat("@").setValue(hashPin(pin)); }
    else if (/^[0-9a-f]{64}$/.test(stored)) ok = stored === hashPin(pin);
    else if (stored) { ok = stored === pin; if (ok) t.sh.getRange(u._r, col).setNumberFormat("@").setValue(hashPin(pin)); }
    if (!ok) { cache.put(key, String(n + 1), 900); fail("Sai mã PIN", "bad_pin"); }
    cache.remove(key);
    var tk = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
    props().setProperty("tk_" + tk, JSON.stringify({ nv: String(nv), exp: Date.now() + TOKEN_DAYS * 864e5 }));
    log(meOf(u), "Đăng nhập", nv, "");
    return { token: tk, me: meOf(u) };
  });
}
function meOf(u) { return { id: String(u.MaNV), ten: u.Ten, vaiTro: pick(u.VaiTro, ROLES, "Nhân viên") }; }
function auth(token) {
  if (!token) fail("Chưa đăng nhập", "revoked");
  var raw = props().getProperty("tk_" + token); if (!raw) fail("Phiên đăng nhập đã hết", "revoked");
  var t = JSON.parse(raw);
  if (t.exp < Date.now()) { props().deleteProperty("tk_" + token); fail("Phiên đăng nhập đã hết", "revoked"); }
  var u = tab("NhanSu").rows.filter(function (x) { return String(x.MaNV) === t.nv && x.Nghi !== "Có"; })[0];
  if (!u) { props().deleteProperty("tk_" + token); fail("Tài khoản đã bị tắt", "revoked"); }
  return meOf(u);
}
function isOwner(me) { return me.vaiTro === "Chủ tiệm"; }

/* ---------- quản trị: đọc toàn bộ, ghi theo danh sách cột cho phép ---------- */
function loadAll() {
  var d = {}; Object.keys(TAB).forEach(function (c) { d[c] = tab(TAB[c]).rows.map(toDoc); }); return d;
}
function put(me, q) {
  var c = txt(q.c, 20); if (!TAB[c]) fail("Sai loại dữ liệu", "bad_request");
  var o = q.obj || {};
  if (c === "mon" && o.tt != null) o.tt = pick(o.tt, TT_MON, "cho");
  return withLock(function () {
    var t = tab(TAB[c]), w = {};
    Object.keys(o).forEach(function (k) { if (t.head.indexOf(k) > -1 && k !== "id" && k !== "capNhat") w[k] = o[k]; });
    w.capNhat = now();
    var r;
    if (q.id) {
      r = find(t, "id", txt(q.id, 40)); if (!r) fail("Không tìm thấy " + q.id, "not_found");
      writeObj(t, r._r, w); Object.keys(w).forEach(function (k) { r[k] = toCell(k, w[k]); });
    } else {
      w.id = newId(c); appendObj(t, w); r = {}; t.head.forEach(function (k) { r[k] = k === "id" ? w.id : (w[k] === undefined ? "" : toCell(k, w[k])); });
    }
    var doc = toDoc(r); xoaCache();
    log(me, (q.id ? "Sửa " : "Thêm ") + c, doc.id, JSON.stringify(o).slice(0, 280));
    return { ok: true, doc: doc };
  });
}
function del(me, q) {
  var c = txt(q.c, 20); if (c !== "mon") fail("Chỉ xoá được món", "forbidden");
  return withLock(function () {
    var t = tab(TAB[c]), r = find(t, "id", txt(q.id, 40)); if (!r) return { ok: true };
    if (!isOwner(me) && r.tt !== "cho" && r.vidu !== "Có") fail("Chỉ chủ tiệm được xoá món đã đăng", "forbidden");
    t.sh.deleteRow(r._r); xoaCache(); log(me, "Xoá món", r.id, r.ten);
    return { ok: true };
  });
}
function luuNhanSu(me, q) {
  if (!isOwner(me)) fail("Chỉ chủ tiệm được sửa nhân sự", "forbidden");
  return withLock(function () {
    var t = tab("NhanSu"), o = q.obj || {}, r = o.MaNV ? find(t, "MaNV", txt(o.MaNV, 10)) : null;
    var w = { Ten: txt(o.Ten, 60), VaiTro: pick(o.VaiTro, ROLES, "Nhân viên"), SDT: sdtOk(o.SDT), Nghi: o.Nghi === "Có" ? "Có" : "" };
    if (!w.Ten) fail("Nhập tên nhân sự", "bad_request");
    if (r && String(r.MaNV) === me.id && (w.VaiTro !== "Chủ tiệm" || w.Nghi)) fail("Không tự đổi vai trò hoặc tự cho mình nghỉ", "bad_request");
    if (o.PIN) { if (!/^\d{4,8}$/.test(String(o.PIN))) fail("PIN gồm 4–8 chữ số", "bad_pin"); w.PIN = hashPin(String(o.PIN)); }
    var row = function (x) { return t.head.map(function (k) { return k === "SDT" ? cell(x[k] || "") : (x[k] == null ? "" : x[k]); }); };
    if (r) { var cur = {}; t.head.forEach(function (k) { cur[k] = r[k]; }); Object.keys(w).forEach(function (k) { cur[k] = w[k]; }); t.sh.getRange(r._r, 1, 1, t.head.length).setValues([row(cur)]); }
    else { if (!w.PIN) fail("Nhân sự mới cần mã PIN", "bad_pin"); var mx = 0; t.rows.forEach(function (x) { var n = +String(x.MaNV).replace(/\D/g, ""); if (n > mx) mx = n; }); w.MaNV = "NV" + ("0" + (mx + 1)).slice(-2); t.sh.appendRow(row(w)); }
    log(me, "Nhân sự", w.MaNV || o.MaNV, w.Ten + " · " + w.VaiTro);
    return { ok: true, staff: staffList() };
  });
}

/* ---------- ảnh: lưu Drive, ai có link mới xem được ---------- */
function folder() {
  var id = props().getProperty("ANH_FOLDER");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var p = DriveApp.getFileById(SHEET_ID).getParents(), f = (p.hasNext() ? p.next() : DriveApp.getRootFolder()).createFolder("CHÉRIE Seconde · Ảnh sản phẩm");
  props().setProperty("ANH_FOLDER", f.getId()); return f;
}
function upAnh(me, q) {
  var b64 = String(q.data || "").replace(/^data:image\/\w+;base64,/, "");
  if (!b64 || b64.length > 2800000) fail("Ảnh trống hoặc quá lớn", "bad_request");
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", "sc-" + now("yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0, 4) + ".jpg");
  var f = folder().createFile(blob);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, id: f.getId() };
}

/* ---------- công khai: kệ hàng, đặt giữ, đăng ký ký gửi, tra cứu ---------- */
var AN = ["chuDo", "chuTen", "giaSan", "hhRieng", "bangChung", "ghiChuKhach", "lichSu", "maGoc", "vidu", "live", "capNhat", "ngayNhan", "giaVon"];
var HINH = ["ban", "thue", "bandut", "tindung"], DM = ["dam", "congso", "ao", "tui", "giay", "phukien"], PKS = ["tamtrung", "caocap", "luxury"];
function rate(key, max, sec) {
  var c = CacheService.getScriptCache(), n = +(c.get(key) || 0), n0 = +(c.get("web_all") || 0);
  if (n >= max) fail("Bạn gửi hơi nhiều lần. Nhắn Zalo " + ZALO + " giúp tiệm nhé.", "rate");
  if (n0 >= 800) fail("Hệ thống đang bận, thử lại sau ít phút.", "rate");
  c.put(key, String(n + 1), sec); c.put("web_all", String(n0 + 1), 3600);
}
function congKhai(m) { var x = {}; Object.keys(m).forEach(function (k) { if (AN.indexOf(k) < 0) x[k] = m[k]; }); return x; }
function pub() {
  var c = CacheService.getScriptCache(), hit = c.get("pub"); if (hit) return JSON.parse(hit);
  var mon = tab("Mon").rows.map(toDoc).filter(function (m) { return m.tt === "dang" && m.nguon !== "kyguithue"; }).map(congKhai);
  var r = { ok: true, mon: mon, luc: now() }, s = JSON.stringify(r);
  if (s.length < 95000) c.put("pub", s, 60);
  return r;
}
function datHang(q) {
  var sdt = sdtOk(q.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(q.ten, 80); if (!ten) fail("Nhập họ tên để tiệm gọi cho đúng", "bad_request");
  var ids = (Array.isArray(q.items) ? q.items : []).slice(0, 10).map(function (i) { return txt(i && i.monId, 40); }).filter(String);
  if (!ids.length) fail("Giỏ hàng trống", "bad_request");
  rate("dh_" + sdt, 6, 21600);
  return withLock(function () {
    var tm = tab("Mon"), td = tab("DatHang"), items = [], hom = now("yyyy-MM-dd");
    ids.forEach(function (id) {
      var r = find(tm, "id", id); if (!r) return; var m = toDoc(r);
      if (m.tt !== "dang" || m.nguon === "kyguithue") return;
      var gia = giaNay(m); items.push({ monId: m.id, ma: m.ma, ten: m.ten, gia: gia });
      var ls = (m.lichSu || []).concat([{ n: hom, v: "Khách " + ten + " đặt giữ" }]).slice(-30);
      writeObj(tm, r._r, { tt: "giu", lichSu: ls, capNhat: now() });
    });
    if (!items.length) fail("Món trong giỏ vừa có người mua. Tải lại trang để xem món khác.", "sold");
    var tong = items.reduce(function (s, i) { return s + i.gia; }, 0);
    var row = { id: nextMa(td.rows, "DH-" + now("ddMM") + "-"), items: items, ten: ten, sdt: sdt, noi: txt(q.noi, 200), ghiChu: txt(q.ghiChu, 300), tong: tong, ngay: hom, gio: new Date().toISOString(), tt: "moi", capNhat: now() };
    appendObj(td, row); xoaCache();
    log(null, "Đặt giữ", row.id, items.length + " món, " + tong + "đ");
    return { ok: true, id: row.id, items: items, tong: tong };
  });
}
function dangKy(q) {
  var sdt = sdtOk(q.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(q.ten, 80); if (!ten) fail("Nhập tên của bạn", "bad_request");
  if (q.web2) return { ok: true, id: "DK-0000" };
  rate("dk_" + sdt, 6, 21600);
  return withLock(function () {
    var t = tab("DangKy");
    var row = { id: nextMa(t.rows, "DK-" + now("ddMM") + "-"), ten: ten, sdt: sdt, brand: txt(q.brand, 60), loai: txt(q.loai, 60), giaMua: num(q.giaMua), giaMuon: num(q.giaMuon), giaSan: num(q.giaSan),
      hinh: pick(q.hinh, HINH, "ban"), danhMuc: pick(q.danhMuc, DM, ""), phanKhuc: pick(q.phanKhuc, PKS, ""), hangKhach: pick(q.hangKhach, ["A", "B", "C"], ""), uocTinh: num(q.uocTinh),
      bangChung: txt(q.bangChung, 60), moTa: txt(q.moTa, 1000), ngay: now("yyyy-MM-dd"), gio: new Date().toISOString(), tt: "moi", capNhat: now() };
    appendObj(t, row);
    log(null, "Đăng ký ký gửi", row.id, row.brand + " " + row.loai);
    return { ok: true, id: row.id };
  });
}
/* tra cứu: cần số Zalo + một mã của chính người đó (mã đăng ký DK-… hoặc mã món trên biên nhận) */
function traCuu(q) {
  var sdt = sdtOk(q.sdt), ma = txt(q.ma, 40).toUpperCase().replace(/\s/g, "");
  if (!sdt || !ma) fail("Nhập số Zalo và mã đăng ký hoặc mã món", "bad_request");
  rate("tc_" + sdt, 40, 3600);
  var mon = tab("Mon").rows.map(toDoc).filter(function (m) { return m.chuDo === sdt; });
  var dk = tab("DangKy").rows.map(toDoc).filter(function (x) { return x.sdt === sdt; });
  var ok = mon.some(function (m) { return String(m.ma).toUpperCase() === ma; }) || dk.some(function (x) { return String(x.id).toUpperCase() === ma; });
  if (!ok) fail("Không khớp. Kiểm tra lại số Zalo và mã trên biên nhận.", "not_found");
  var don = tab("DonBan").rows.map(toDoc).filter(function (d) { return d.chuDo === sdt; })
    .map(function (d) { return { monId: d.monId, ten: d.ten, gia: d.gia, ngayGiao: d.ngayGiao, tienChuDo: d.tienChuDo, hanTra: d.hanTra, daTra: d.daTra, ngayTraTien: d.ngayTraTien }; });
  var thue = tab("LuotThue").rows.map(toDoc).filter(function (x) { return x.chuDo === sdt; })
    .map(function (x) { return { monId: x.monId, ten: x.ten, ngay: x.ngay, chiaChuDo: x.chiaChuDo, daTra: x.daTra }; });
  return { ok: true, mon: mon.map(function (m) { var x = congKhai(m); x.chuDo = sdt; x.giaSan = m.giaSan; return x; }), don: don, thue: thue, dangky: dk.filter(function (x) { return x.tt === "moi"; }) };
}

/* Chạy tay trong trình chỉnh sửa nếu muốn đăng xuất mọi người */
function dangXuatTatCa() { var p = props(), all = p.getProperties(); Object.keys(all).forEach(function (k) { if (k.indexOf("tk_") === 0) p.deleteProperty(k); }); }
/* Chạy tay một lần sau khi dán code để Google hỏi quyền */
function kiemTra() { Logger.log(JSON.stringify({ tab: ss().getSheets().map(function (s) { return s.getName(); }), anh: folder().getName() })); }

/* =====================================================================
   BÁN & KÝ GỬI ONLINE: ảnh khách gửi, AI đánh giá sơ bộ, hợp đồng ký điện tử
   - Ảnh món, ảnh hóa đơn, ảnh CCCD, chữ ký: lưu thư mục RIÊNG TƯ (không chia sẻ link).
   - Số CCCD, số tài khoản: chỉ ở tab HopDong, chỉ Chủ tiệm đọc được.
   - AI: cần Script Property AI_KEY (khóa API Anthropic); AI_MODEL mặc định claude-sonnet-5-5.
   ===================================================================== */
var FOLDER_KH = { sp: "CHÉRIE Seconde · Ảnh khách gửi (riêng tư)", hd: "CHÉRIE Seconde · Ảnh khách gửi (riêng tư)", cccd: "CHÉRIE Seconde · CCCD và chữ ký (riêng tư)", ky: "CHÉRIE Seconde · CCCD và chữ ký (riêng tư)", vb: "CHÉRIE Seconde · Hợp đồng ký gửi (riêng tư)" };
function folderRieng(loai) {
  var key = "F_" + loai, id = props().getProperty(key), name = FOLDER_KH[loai];
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var p = DriveApp.getFileById(SHEET_ID).getParents(), parent = p.hasNext() ? p.next() : DriveApp.getRootFolder();
  var it = parent.getFoldersByName(name), f = it.hasNext() ? it.next() : parent.createFolder(name);
  Object.keys(FOLDER_KH).forEach(function (k) { if (FOLDER_KH[k] === name) props().setProperty("F_" + k, f.getId()); });
  return f;
}
function phienOk(p) { p = txt(p, 40); if (!/^[a-z0-9]{10,40}$/.test(p)) fail("Phiên không hợp lệ, tải lại trang", "bad_request"); return p; }
function idsPhien(p) { var c = CacheService.getScriptCache().get("ph_" + p); return c ? JSON.parse(c) : []; }
function upAnhKH(q) {
  var p = phienOk(q.phien), loai = pick(q.loai, ["sp", "hd", "cccd"], "sp");
  rate("up_" + p, 16, 21600);
  var b64 = String(q.data || "").replace(/^data:image\/\w+;base64,/, "");
  if (!b64 || b64.length > 2800000) fail("Ảnh trống hoặc quá lớn", "bad_request");
  var f = folderRieng(loai).createFile(Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", loai + "-" + now("yyyyMMdd-HHmmss") + "-" + p.slice(-6) + "-" + Utilities.getUuid().slice(0, 4) + ".jpg"));
  var ds = idsPhien(p); ds.push({ id: f.getId(), loai: loai }); CacheService.getScriptCache().put("ph_" + p, JSON.stringify(ds.slice(-30)), 21600);
  return { ok: true, id: f.getId() };
}
function cuaPhien(p, ids, loai) {
  var ds = idsPhien(p); return (ids || []).filter(function (id) { return ds.some(function (x) { return x.id === id && (!loai || x.loai === loai); }); });
}
function aiDanhGia(q) {
  var p = phienOk(q.phien), key = props().getProperty("AI_KEY");
  if (!key) return { ok: true, khongCo: true };
  rate("ai_" + p, 4, 21600);
  var ids = cuaPhien(p, q.ids, "sp").slice(0, 6); if (ids.length < 1) fail("Chưa có ảnh hợp lệ, gửi lại ảnh", "bad_request");
  var content = ids.map(function (id) { return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()) } }; });
  content.push({ type: "text", text: "Bạn là chuyên viên thẩm định đồ hiệu secondhand của tiệm CHÉRIE Seconde tại Việt Nam. Khách khai: thương hiệu \"" + txt(q.brand, 60) + "\", danh mục \"" + txt(q.danhMuc, 40) + "\", giá mua " + num(q.giaMua) + " đồng. " +
    "Hãy xem các ảnh và trả lời CHỈ bằng một đối tượng JSON, tiếng Việt, không thêm chữ nào khác:\n" +
    '{"hang":"A"|"B"|"C","doMoi":số 0-100,"namSanXuat":"khoảng năm, ví dụ 2019–2021, hoặc rỗng nếu không đủ căn cứ","canCuNam":"căn cứ ngắn (mã sản xuất, kiểu mẫu…) hoặc rỗng","ruiRo":"thap"|"trungbinh"|"cao"|"khongro","lyDo":["tối đa 4 lý do ngắn về độ tin cậy nguồn gốc, dựa trên chi tiết thấy được: logo, font, đường may, kim loại, tem, mã"],"loi":["hao mòn, lỗi thấy được"],"model":"tên mẫu nếu nhận ra","mau":"màu chính","size":"kích cỡ nếu thấy","moTa":"2 câu mô tả trung thực cho người mua","canThemAnh":["ảnh nên chụp thêm để kiểm tra"]}\n' +
    "Quy ước hạng: A như mới, không lỗi thấy được; B đã dùng, còn đẹp; C có lỗi thấy được. Không khẳng định chắc chắn hàng thật hay giả: đây chỉ là nhận định sơ bộ từ ảnh. Nếu ảnh không đủ để nhận định nguồn gốc, dùng \"khongro\" và liệt kê ảnh cần thêm. Không bịa chi tiết không thấy trong ảnh." });
  var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", { method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    payload: JSON.stringify({ model: props().getProperty("AI_MODEL") || "claude-sonnet-5-5", max_tokens: 1200, messages: [{ role: "user", content: content }] }) });
  if (res.getResponseCode() !== 200) { log(null, "AI lỗi", p, res.getResponseCode() + " " + res.getContentText().slice(0, 200)); fail("AI đang bận, thử lại sau ít phút", "ai"); }
  var t = (JSON.parse(res.getContentText()).content || []).map(function (c) { return c.text || ""; }).join("");
  var m = t.match(/\{[\s\S]*\}/); if (!m) fail("AI chưa trả kết quả rõ, thử lại", "ai");
  var a = JSON.parse(m[0]), s = function (v, n) { return txt(v, n || 120); }, arr = function (v) { return (Array.isArray(v) ? v : []).slice(0, 5).map(function (x) { return s(x, 160); }); };
  var out = { hang: pick(a.hang, ["A", "B", "C"], ""), doMoi: Math.max(0, Math.min(100, Math.round(+a.doMoi || 0))), namSanXuat: s(a.namSanXuat, 40), canCuNam: s(a.canCuNam, 160),
    ruiRo: pick(a.ruiRo, ["thap", "trungbinh", "cao", "khongro"], "khongro"), lyDo: arr(a.lyDo), loi: arr(a.loi), model: s(a.model, 80), mau: s(a.mau, 40), size: s(a.size, 30), moTa: s(a.moTa, 400), canThemAnh: arr(a.canThemAnh) };
  CacheService.getScriptCache().put("ai_" + p, JSON.stringify(out), 21600);
  return { ok: true, ai: out };
}
function sha256(t) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8).map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join(""); }
function tabCo(name, head) { var sh = ss().getSheetByName(name); if (!sh) { sh = ss().insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]); sh.setFrozenRows(1); } return tab(name); }
var HD_HEAD = ["id", "dangkyId", "ngayKy", "gioMayChu", "phienBan", "hash", "hinh", "hoTen", "ngaySinh", "cccd", "diaChi", "sdt", "nganHang", "soTK", "chuTK", "cccdTruoc", "cccdSau", "dongYAnh", "chuKy", "vanBan", "thietBi", "phien", "trangThai"];
function kyHopDong(q) {
  var p = phienOk(q.phien), h = q.hd || {};
  var sdt = sdtOk(h.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(h.hoTen, 80); if (ten.length < 4) fail("Nhập họ tên đầy đủ", "bad_request");
  var cccd = String(h.cccd || "").replace(/\D/g, ""); if (!/^\d{12}$/.test(cccd)) fail("Số CCCD gồm 12 chữ số", "bad_request");
  var cach = pick(q.cach, ["ban", "thue", "bandut", "tindung"], "ban");
  var anh = cuaPhien(p, q.anh, "sp"); if (anh.length < 3) fail("Cần ít nhất 3 ảnh món đồ", "bad_request");
  var cT = cuaPhien(p, [q.cccdT], "cccd")[0] || "", cS = cuaPhien(p, [q.cccdS], "cccd")[0] || "";
  if ((cT || cS) && !q.dongAnh) fail("Cần đồng ý riêng về ảnh CCCD", "bad_request");
  var ky = String(q.ky || ""); if (!/^data:image\/png;base64,/.test(ky) || ky.length > 600000) fail("Thiếu chữ ký", "bad_request");
  var vb = String(q.vanBan || "").slice(0, 30000); if (vb.length < 500) fail("Thiếu nội dung hợp đồng", "bad_request");
  rate("hd_" + sdt, 5, 86400);
  var gio = now("yyyy-MM-dd HH:mm:ss"), hash = sha256(vb + "\n" + gio + "\n" + cccd);
  var kyId = folderRieng("ky").createFile(Utilities.newBlob(Utilities.base64Decode(ky.split(",")[1]), "image/png", "chuky-" + now("yyyyMMdd-HHmmss") + "-" + sdt.slice(-4) + ".png")).getId();
  var vbId = folderRieng("vb").createFile(Utilities.newBlob(vb + "\n\n---\nKý lúc " + gio + " (giờ máy chủ, UTC+7) · SHA-256 " + hash + " · Phiên bản " + txt(q.phienBan, 20) + " · Thiết bị " + txt(q.ua, 200), "text/plain", "hopdong-" + now("yyyyMMdd-HHmmss") + "-" + sdt.slice(-4) + ".txt")).getId();
  var aiC = CacheService.getScriptCache().get("ai_" + p);
  return withLock(function () {
    var t = tab("DangKy"), hd = tabCo("HopDong", HD_HEAD);
    var id = nextMa(t.rows, "DK-" + now("ddMM") + "-"), maHD = nextMa(hd.rows, "HD-" + now("ddMM") + "-");
    var dk = { id: id, ten: ten, sdt: sdt, brand: txt(q.brand, 60), loai: txt(q.model, 80) || txt(q.danhMuc, 30), danhMuc: pick(q.danhMuc, DM, ""), phanKhuc: pick(q.phanKhuc, PKS, ""), hangKhach: pick(q.hang, ["A", "B", "C"], ""),
      giaMua: num(q.giaMua), giaMuon: 0, giaSan: cach === "ban" ? num(q.giaSan) : 0, uocTinh: num(q.uocTinh), hinh: cach, bangChung: txt(q.bangChung, 60),
      moTa: [txt(q.size, 30) ? "Size " + txt(q.size, 30) : "", txt(q.mau, 40), txt(q.namMua, 10) ? "Mua năm " + txt(q.namMua, 10) : "", txt(q.ghiChu, 600)].filter(String).join(" · "),
      anhKH: { sp: anh, hd: cuaPhien(p, q.hdAnh, "hd") }, ai: aiC ? JSON.parse(aiC) : null, phuKien: (Array.isArray(q.phuKien) ? q.phuKien : []).slice(0, 8).map(function (x) { return txt(x, 40); }),
      maHD: maHD, ngay: now("yyyy-MM-dd"), gio: new Date().toISOString(), tt: "moi", capNhat: now() };
    appendObj(t, dk);
    var row = { id: maHD, dangkyId: id, ngayKy: now("yyyy-MM-dd"), gioMayChu: gio, phienBan: txt(q.phienBan, 20), hash: hash, hinh: cach, hoTen: ten, ngaySinh: txt(h.ngaySinh, 10), cccd: cccd, diaChi: txt(h.diaChi, 200), sdt: sdt,
      nganHang: txt(h.nganHang, 60), soTK: txt(h.soTK, 30).replace(/\s/g, ""), chuTK: txt(h.chuTK, 80), cccdTruoc: cT, cccdSau: cS, dongYAnh: (cT || cS) ? "Có" : "", chuKy: kyId, vanBan: vbId, thietBi: txt(q.ua, 200), phien: p, trangThai: "Đã ký" };
    hd.sh.appendRow(hd.head.map(function (k) { return cell(row[k] == null ? "" : row[k]); }));
    log(null, "Ký hợp đồng", maHD, id + " · " + cach + " · " + dk.brand);
    return { ok: true, id: id, maHD: maHD, hash: hash };
  });
}
/* Quản trị: xem ảnh riêng tư (ảnh CCCD, chữ ký chỉ Chủ tiệm) */
function anhRieng(me, q) {
  var f = DriveApp.getFileById(txt(q.id, 80)), parents = f.getParents(), ok = false, nhay = false;
  while (parents.hasNext()) { var pid = parents.next().getId(); if (pid === props().getProperty("F_sp")) ok = true; if (pid === props().getProperty("F_cccd")) { ok = true; nhay = true; } }
  if (!ok) fail("Không xem được ảnh này", "forbidden"); if (nhay && !isOwner(me)) fail("Chỉ chủ tiệm xem được CCCD và chữ ký", "forbidden");
  var b = f.getBlob(); return { ok: true, data: "data:" + b.getContentType() + ";base64," + Utilities.base64Encode(b.getBytes()) };
}
function hoSoDK(me, q) {
  var hd = tab("HopDong").rows.filter(function (r) { return r.dangkyId === txt(q.id, 30); })[0]; if (!hd) return { ok: true, hd: null };
  var x = toDoc(hd); delete x.phien;
  if (!isOwner(me)) { x.cccd = "••••" + String(x.cccd).slice(-4); x.soTK = x.soTK ? "••••" + String(x.soTK).slice(-4) : ""; x.cccdTruoc = ""; x.cccdSau = ""; x.chuKy = ""; x.ngaySinh = ""; }
  if (x.vanBan) { try { x.noiDung = DriveApp.getFileById(x.vanBan).getBlob().getDataAsString("UTF-8"); } catch (e) {} }
  return { ok: true, hd: x };
}
