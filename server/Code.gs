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
var JSON_F = ["tinhTrang", "anh", "lichSu", "items", "anhKH", "ai", "phuKien", "nhatTrinh", "dieuKhoan"];
var BOOL_F = ["daTra", "live", "vidu"];
var NUM_F = ["soLuot", "giaNiemYet", "giaSale", "giaDang", "giaSan", "gia", "tiemHuong", "phiSan", "tienChuDo", "tienThueDaTra", "giaMua", "giaMuon", "tien", "chiaChuDo", "tong", "uocTinh", "offer", "giaVon", "giaChot"];
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
    case "docGiayTo": return docGiayTo(q);
    case "guiDinhGia": return guiDinhGia(q);
    case "xemHD": return xemHD(q);
    case "kyHD": return kyHD(q);
    case "theoDoi": return theoDoiKH(q);
    case "phanHoiGia": return phanHoiGia(q);
    case "guiVanDon": return guiVanDon(q);
    case "taoHD": return taoHD(auth(q.token), q);
    case "themKhau": return themKhau(auth(q.token), q);
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
/* AI nhận diện và đánh giá sơ bộ từ ảnh.
   - Chỉ đọc tối đa AI_MAX_ANH ảnh đầu (tiết kiệm token: mỗi ảnh ~1.300–1.600 token).
   - Cùng bộ ảnh thì trả kết quả đã lưu, không gọi AI lần nữa.
   - Ép AI trả về đúng khuôn JSON (structured outputs, output_config.format).
   - Giới hạn: 4 lần / phiên / 6 giờ; AI_MOI_NGAY lần / ngày cho cả web [GĐ]. */
var AI_MAX_ANH = 4, AI_MOI_NGAY = 150;
var AI_DM = ["dam", "congso", "ao", "tui", "giay", "phukien"];
var AI_SCHEMA = { type: "object", properties: {
  danhMuc: { type: "string", enum: AI_DM, description: "dam=đầm dự tiệc, congso=đồ công sở, ao=áo/chân váy, tui=túi/ví, giay=giày, phukien=phụ kiện" },
  brand: { type: "string", description: "Tên thương hiệu chính thức (ví dụ Saint Laurent, Louis Vuitton), rỗng nếu không thấy" },
  brandChac: { type: "string", enum: ["chac", "doan", "khong"], description: "chac = thấy rõ logo/tem; doan = đoán theo kiểu dáng; khong = không nhận ra" },
  model: { type: "string", description: "Tên mẫu ngắn, tối đa 6 chữ, ví dụ Le 5 à 7 Hobo; không chắc thì để rỗng (ghi phân vân vào lyDo)" },
  mau: { type: "string", description: "Màu chính, tối đa 3 chữ" }, chatLieu: { type: "string", description: "Chất liệu chính, tối đa 5 chữ" }, size: { type: "string", description: "Kích cỡ nếu thấy" },
  namSanXuat: { type: "string", description: "Khoảng năm, ví dụ 2019–2021; rỗng nếu không đủ căn cứ" },
  canCuNam: { type: "string" },
  giaMoiUoc: { type: "integer", description: "Giá bán mới chính hãng hiện tại tại Việt Nam, đồng; 0 nếu không chắc" },
  hang: { type: "string", enum: ["A", "B", "C"], description: "A như mới, không lỗi thấy được; B đã dùng còn đẹp; C có lỗi thấy được" },
  doMoi: { type: "integer", description: "0-100" },
  ruiRo: { type: "string", enum: ["thap", "trungbinh", "cao", "khongro"] },
  lyDo: { type: "array", items: { type: "string" }, description: "Tối đa 4 ý ngắn về độ tin cậy nguồn gốc dựa trên chi tiết thấy được" },
  loi: { type: "array", items: { type: "string" }, description: "Hao mòn, lỗi thấy được, tối đa 5 ý ngắn" },
  moTa: { type: "string", description: "2 câu mô tả trung thực cho người mua" },
  canThemAnh: { type: "array", items: { type: "string" }, description: "Tối đa 3 ảnh nên chụp thêm" }
}, additionalProperties: false };
AI_SCHEMA.required = Object.keys(AI_SCHEMA.properties);
function aiDanhGia(q) {
  var p = phienOk(q.phien), key = props().getProperty("AI_KEY"), c = CacheService.getScriptCache();
  if (!key) return { ok: true, khongCo: true };
  var ids = cuaPhien(p, q.ids, "sp").slice(0, AI_MAX_ANH); if (ids.length < 1) fail("Chưa có ảnh hợp lệ, gửi lại ảnh", "bad_request");
  var khoa = "aiK_" + sha256(p + "|" + ids.join(",")).slice(0, 32), cu = c.get(khoa);
  if (cu) return { ok: true, ai: JSON.parse(cu), cu: true };
  rate("ai_" + p, 4, 21600);
  var nk = "ai_ngay_" + now("yyyyMMdd"), n = +(c.get(nk) || 0);
  if (n >= AI_MOI_NGAY) fail("AI đã hết lượt hôm nay. Bạn điền thông tin, tiệm xem ảnh và báo lại.", "rate");
  c.put(nk, String(n + 1), 90000);
  var goiY = [txt(q.brand, 60) ? "thương hiệu \"" + txt(q.brand, 60) + "\"" : "", txt(q.danhMuc, 40) ? "danh mục \"" + txt(q.danhMuc, 40) + "\"" : ""].filter(String).join(", ");
  var content = ids.map(function (id) { return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()) } }; });
  content.push({ type: "text", text: "Bạn là chuyên viên thẩm định đồ hiệu secondhand của tiệm CHÉRIE Seconde tại Việt Nam. " +
    "Xem " + ids.length + " ảnh của MỘT món đồ khách muốn bán" + (goiY ? " (khách gợi ý: " + goiY + ")" : "") + ". " +
    "Nhận diện danh mục, thương hiệu, mẫu, màu, chất liệu, size, năm sản xuất, ước giá mới chính hãng, tình trạng và rủi ro nguồn gốc. Trường không xác định thì để chuỗi rỗng hoặc 0. " +
    "Viết tiếng Việt, ngắn gọn. Chỉ dựa vào chi tiết THẤY trong ảnh, không bịa. Không khẳng định chắc chắn hàng thật hay giả: đây là nhận định sơ bộ. " +
    "Không thấy logo hoặc tem thì brandChac = \"doan\" hoặc \"khong\" và ruiRo = \"khongro\"." });
  var res;
  try {
    res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", { method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      payload: JSON.stringify({ model: props().getProperty("AI_MODEL") || "claude-sonnet-5-5", max_tokens: 6000,
        output_config: { format: { type: "json_schema", schema: AI_SCHEMA } },
        messages: [{ role: "user", content: content }] }) });
  } catch (e) { log(null, "AI lỗi mạng", p, String(e).slice(0, 200)); fail("AI phản hồi chậm, bấm Thử lại", "ai"); }
  var code = res.getResponseCode(), body = res.getContentText();
  if (code !== 200) { log(null, "AI lỗi", p, code + " " + body.slice(0, 250)); fail(code === 401 ? "Khóa AI chưa đúng, tiệm sẽ kiểm tra" : code === 429 || code === 529 ? "AI đang bận, thử lại sau ít phút" : "AI chưa đánh giá được, thử lại", "ai"); }
  var j = JSON.parse(body), t = (j.content || []).filter(function (x) { return x.type === "text"; }).map(function (x) { return x.text; }).join(""), a = null;
  try { a = JSON.parse(t); } catch (e) { var m = t.match(/\{[\s\S]*\}/); try { a = m ? JSON.parse(m[0]) : null; } catch (e2) {} }
  if (!a) { log(null, "AI không trả mẫu", p, (j.stop_reason || "") + " " + body.slice(0, 250)); fail(j.stop_reason === "refusal" ? "AI không đánh giá được bộ ảnh này. Bạn điền tay giúp tiệm nhé." : "AI chưa trả kết quả rõ, thử lại", "ai"); }
  var lo = function (v) { return String(v || "").toLowerCase(); };
  a.danhMuc = lo(a.danhMuc); a.brandChac = lo(a.brandChac); a.ruiRo = lo(a.ruiRo); a.hang = String(a.hang || "").toUpperCase();
  var s = function (v, n) { return txt(v, n || 120); }, arr = function (v, k) { return (Array.isArray(v) ? v : []).slice(0, k || 5).map(function (x) { return s(x, 160); }); };
  var out = { danhMuc: pick(a.danhMuc, AI_DM, ""), brand: s(a.brand, 60), brandChac: pick(a.brandChac, ["chac", "doan", "khong"], "khong"), model: s(a.model, 80), mau: s(a.mau, 40), chatLieu: s(a.chatLieu, 60), size: s(a.size, 30),
    namSanXuat: s(a.namSanXuat, 40), canCuNam: s(a.canCuNam, 160), giaMoiUoc: Math.max(0, Math.min(5000000000, Math.round(+a.giaMoiUoc || 0))),
    hang: pick(a.hang, ["A", "B", "C"], ""), doMoi: Math.max(0, Math.min(100, Math.round(+a.doMoi || 0))),
    ruiRo: pick(a.ruiRo, ["thap", "trungbinh", "cao", "khongro"], "khongro"), lyDo: arr(a.lyDo, 4), loi: arr(a.loi, 5), moTa: s(a.moTa, 400), canThemAnh: arr(a.canThemAnh, 3), soAnh: ids.length };
  c.put(khoa, JSON.stringify(out), 21600); c.put("ai_" + p + "_kq", JSON.stringify(out), 21600);
  log(null, "AI đánh giá", p.slice(-6), out.brand + " · " + out.danhMuc + " · " + out.hang + " · " + (j.usage ? j.usage.input_tokens + "+" + j.usage.output_tokens + " token" : ""));
  return { ok: true, ai: out };
}
/* Gọi Claude với ảnh + khuôn JSON (structured outputs). Trả object đã parse. */
function goiClaude_(ids, loiNhac, schema, maxTok, nhan) {
  var key = props().getProperty("AI_KEY");
  var content = ids.map(function (id) { return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()) } }; });
  content.push({ type: "text", text: loiNhac });
  var res;
  try {
    res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", { method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      payload: JSON.stringify({ model: props().getProperty("AI_MODEL") || "claude-sonnet-5-5", max_tokens: maxTok || 4000,
        output_config: { format: { type: "json_schema", schema: schema } }, messages: [{ role: "user", content: content }] }) });
  } catch (e) { log(null, nhan + " lỗi mạng", "", String(e).slice(0, 200)); fail("AI phản hồi chậm, bấm Thử lại", "ai"); }
  var code = res.getResponseCode(), body = res.getContentText();
  if (code !== 200) { log(null, nhan + " lỗi", "", code + " " + body.slice(0, 250)); fail(code === 429 || code === 529 ? "AI đang bận, thử lại sau ít phút" : "AI chưa đọc được, thử lại", "ai"); }
  var j = JSON.parse(body), t = (j.content || []).filter(function (x) { return x.type === "text"; }).map(function (x) { return x.text; }).join(""), a = null;
  try { a = JSON.parse(t); } catch (e) {}
  if (!a) { log(null, nhan + " không trả mẫu", "", (j.stop_reason || "")); fail(j.stop_reason === "refusal" ? "AI không đọc được ảnh này" : "AI chưa trả kết quả rõ, thử lại", "ai"); }
  log(null, nhan, "", j.usage ? j.usage.input_tokens + "+" + j.usage.output_tokens + " token" : "");
  return a;
}
/* Đọc giấy tờ tùy thân (CCCD 2 mặt hoặc ảnh màn hình VNeID) để tự điền hợp đồng.
   Chỉ chạy khi khách đã tích đồng ý xử lý ảnh giấy tờ. KHÔNG ghi số CCCD, họ tên vào nhật ký. Kết quả chỉ trả về trình duyệt của khách. */
var GT_SCHEMA = { type: "object", properties: {
  hopLe: { type: "boolean", description: "true nếu đây là thẻ CCCD/căn cước Việt Nam hoặc màn hình thẻ căn cước trong ứng dụng VNeID và đọc được rõ" },
  cccd: { type: "string", description: "Số CCCD / số định danh cá nhân 12 chữ số, chỉ chữ số" },
  hoTen: { type: "string", description: "Họ và tên đúng như trên giấy tờ, viết hoa chữ đầu mỗi từ, có dấu" },
  ngaySinh: { type: "string", description: "Ngày sinh dạng yyyy-mm-dd" },
  diaChi: { type: "string", description: "Nơi thường trú (hoặc nơi cư trú) đầy đủ như trên giấy tờ" },
  ghiChu: { type: "string", description: "Nếu không hợp lệ: lý do ngắn bằng tiếng Việt (ảnh mờ, bị che, không phải giấy tờ…); nếu hợp lệ để rỗng" }
}, additionalProperties: false };
GT_SCHEMA.required = Object.keys(GT_SCHEMA.properties);
function docGiayTo(q) {
  var p = phienOk(q.phien);
  if (!q.dong) fail("Cần tích ô đồng ý xử lý ảnh giấy tờ", "bad_request");
  if (!props().getProperty("AI_KEY")) return { ok: true, khongCo: true };
  var ids = cuaPhien(p, q.ids, "cccd").slice(0, 2); if (!ids.length) fail("Chưa có ảnh giấy tờ, chụp lại", "bad_request");
  rate("gt_" + p, 4, 21600);
  var c = CacheService.getScriptCache(), nk = "ai_ngay_" + now("yyyyMMdd"), n = +(c.get(nk) || 0);
  if (n >= AI_MOI_NGAY) fail("Đọc tự động đã hết lượt hôm nay, bạn điền tay giúp tiệm.", "rate"); c.put(nk, String(n + 1), 90000);
  var a = goiClaude_(ids, "Đây là ảnh " + (q.loai === "vneid" ? "chụp màn hình thẻ căn cước trong ứng dụng VNeID" : "hai mặt thẻ căn cước công dân / thẻ căn cước Việt Nam") +
    " do chính chủ gửi để ký hợp đồng ký gửi với cửa hàng CHÉRIE Seconde (đã đồng ý xử lý dữ liệu). Hãy đọc chính xác các trường theo khuôn. Không đoán chữ bị che hoặc mờ: để rỗng. Nếu không phải giấy tờ tùy thân Việt Nam thì hopLe=false.", GT_SCHEMA, 2000, "Đọc giấy tờ");
  var so = String(a.cccd || "").replace(/\D/g, ""), ns = String(a.ngaySinh || "");
  return { ok: true, gt: { hopLe: !!a.hopLe && /^\d{12}$/.test(so), cccd: /^\d{12}$/.test(so) ? so : "", hoTen: txt(a.hoTen, 80), ngaySinh: /^\d{4}-\d{2}-\d{2}$/.test(ns) ? ns : "", diaChi: txt(a.diaChi, 200), ghiChu: txt(a.ghiChu, 160) } };
}
function sha256(t) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8).map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join(""); }
function tabCo(name, head) { var sh = ss().getSheetByName(name); if (!sh) { sh = ss().insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]); sh.setFrozenRows(1); } return tab(name); }
var HD_HEAD = ["id", "dangkyId", "ngayKy", "gioMayChu", "phienBan", "hash", "hinh", "hoTen", "ngaySinh", "cccd", "diaChi", "sdt", "nganHang", "soTK", "chuTK", "cccdTruoc", "cccdSau", "dongYAnh", "chuKy", "vanBan", "thietBi", "phien", "trangThai", "token", "dieuKhoan", "taoLuc", "taoBoi"];
function kyHopDong(q) {
  var p = phienOk(q.phien), h = q.hd || {};
  var sdt = sdtOk(h.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(h.hoTen, 80); if (ten.length < 4) fail("Nhập họ tên đầy đủ", "bad_request");
  var cccd = String(h.cccd || "").replace(/\D/g, ""); if (!/^\d{12}$/.test(cccd)) fail("Số CCCD gồm 12 chữ số", "bad_request");
  var cach = pick(q.cach, ["ban", "thue", "bandut", "tindung"], "ban");
  var anh = cuaPhien(p, q.anh, "sp"); if (anh.length < 3) fail("Cần ít nhất 3 ảnh món đồ", "bad_request");
  var cT = cuaPhien(p, [q.cccdT], "cccd")[0] || "", cS = cuaPhien(p, [q.cccdS], "cccd")[0] || "";
  if (!q.dongAnh) fail("Cần đồng ý xử lý ảnh giấy tờ", "bad_request");
  var gt = pick(q.giayTo, ["cccd", "vneid"], "cccd");
  if (!cT || (gt === "cccd" && !cS)) fail(gt === "cccd" ? "Cần ảnh CCCD 2 mặt" : "Cần ảnh màn hình VNeID", "bad_request");
  var ky = String(q.ky || ""); if (!/^data:image\/png;base64,/.test(ky) || ky.length > 600000) fail("Thiếu chữ ký", "bad_request");
  var vb = String(q.vanBan || "").slice(0, 30000); if (vb.length < 500) fail("Thiếu nội dung hợp đồng", "bad_request");
  rate("hd_" + sdt, 5, 86400);
  var gio = now("yyyy-MM-dd HH:mm:ss"), hash = sha256(vb + "\n" + gio + "\n" + cccd);
  var kyId = folderRieng("ky").createFile(Utilities.newBlob(Utilities.base64Decode(ky.split(",")[1]), "image/png", "chuky-" + now("yyyyMMdd-HHmmss") + "-" + sdt.slice(-4) + ".png")).getId();
  var vbId = folderRieng("vb").createFile(Utilities.newBlob(vb + "\n\n---\nKý lúc " + gio + " (giờ máy chủ, UTC+7) · SHA-256 " + hash + " · Phiên bản " + txt(q.phienBan, 20) + " · Thiết bị " + txt(q.ua, 200), "text/plain", "hopdong-" + now("yyyyMMdd-HHmmss") + "-" + sdt.slice(-4) + ".txt")).getId();
  var aiC = CacheService.getScriptCache().get("ai_" + p + "_kq");
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
      nganHang: txt(h.nganHang, 60), soTK: txt(h.soTK, 30).replace(/\s/g, ""), chuTK: txt(h.chuTK, 80), cccdTruoc: cT, cccdSau: cS, dongYAnh: "Có · " + (gt === "vneid" ? "VNeID" : "CCCD") + (q.docTu === "qr" ? " · đọc QR" : q.docTu === "ai" ? " · AI đọc" : ""), chuKy: kyId, vanBan: vbId, thietBi: txt(q.ua, 200), phien: p, trangThai: "Đã ký" };
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


/* =====================================================================
   QUY TRÌNH MỚI (02/11 17:30, theo chị Phúc):
   1. Web: khách chỉ ĐỊNH GIÁ (ảnh → AI → cách bán → giá ước tính) rồi gửi tên + Zalo (guiDinhGia).
   2. Nhân viên sale tư vấn qua Zalo, kiểm đồ, chốt giá trong app nội bộ → tạo LINK HỢP ĐỒNG (taoHD).
   3. Khách mở link: ảnh CCCD/VNeID → kiểm tra thông tin → ký (xemHD, kyHD). Tại quầy: nhân viên mở cùng link trên máy tiệm.
   4. Mỗi khâu sau đó (nhận đồ, kiểm định, vệ sinh, chụp ảnh, gắn tag, lên kệ, bán, trả tiền) ghi kèm ảnh (themKhau).
   5. Khách theo dõi bằng link riêng (theoDoiKH).
   ===================================================================== */
/* Thứ tự (02/11 17:55, chị Phúc): gửi yêu cầu → tiệm báo giá → khách đồng ý / thương lượng → (tỉnh khác: khách gửi đồ, nhập mã vận đơn) → tiệm nhận đồ → kiểm định, chốt giá → hợp đồng → ký → vệ sinh, chụp ảnh, gắn tag, lên kệ, bán, chuyển tiền. */
var KHAU = ["guiDK", "baoGia", "thuongLuong", "dongY", "guiDo", "nhanDo", "kiemDinh", "taoHD", "kyHD", "veSinh", "chupAnh", "ganTag", "lenKe", "daBan", "traTien", "traDo", "ghiChu"];
var TT_HANG = ["moi", "baogia", "dongy", "danhan", "hd", "daky", "lenke", "daban", "xong"];
var KHAU_TT = { baoGia: "baogia", thuongLuong: "baogia", dongY: "dongy", guiDo: "dongy", nhanDo: "danhan", kiemDinh: "danhan", taoHD: "hd", kyHD: "daky", lenKe: "lenke", daBan: "daban", traTien: "xong", traDo: "xong" };
function ttSau_(cur, b) { var m = KHAU_TT[b]; if (!m) return cur; if (b === "traDo") return "xong"; var a = TT_HANG.indexOf(cur), c = TT_HANG.indexOf(m); return a < 0 && cur !== "moi" ? (cur === "khongdat" ? cur : m) : (c > a ? m : cur); }
function maNgauNhien_(n) { var s = ""; while (s.length < n) s += Utilities.getUuid().replace(/-/g, ""); return s.slice(0, n).toLowerCase(); }
function damBaoCot_(name, cols) {
  var sh = ss().getSheetByName(name); if (!sh) return;
  var head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getDisplayValues()[0], thieu = cols.filter(function (c) { return head.indexOf(c) < 0; });
  if (!thieu.length) return;
  if (sh.getMaxColumns() < head.length + thieu.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length + thieu.length - sh.getMaxColumns());
  sh.getRange(1, head.length + 1, 1, thieu.length).setValues([thieu]);
}
function dkCot_() { damBaoCot_("DangKy", ["theoDoi", "nhatTrinh", "giaChot", "noiO", "anhKH", "ai", "phuKien", "maHD", "uocTinh", "danhMuc", "phanKhuc", "hangKhach", "offer", "hdToken"]); }
function soDep_(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function khau_(b, extra) { var o = { b: b, luc: now("yyyy-MM-dd HH:mm") }; Object.keys(extra || {}).forEach(function (k) { if (extra[k] !== "" && extra[k] != null) o[k] = extra[k]; }); return o; }

/* 1. Khách gửi yêu cầu định giá (không có CCCD, không hợp đồng) */
function guiDinhGia(q) {
  var p = phienOk(q.phien), sdt = sdtOk(q.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(q.ten, 80); if (ten.length < 2) fail("Nhập tên để tiệm xưng hô cho đúng", "bad_request");
  if (!q.dong) fail("Cần đồng ý để tiệm liên hệ qua Zalo", "bad_request");
  var anh = cuaPhien(p, q.anh, "sp"); if (anh.length < 3) fail("Cần ít nhất 3 ảnh món đồ", "bad_request");
  rate("dg_" + sdt, 6, 86400);
  var aiC = CacheService.getScriptCache().get("ai_" + p + "_kq"), cach = pick(q.cach, HINH, "ban");
  dkCot_();
  return withLock(function () {
    var t = tab("DangKy"), id = nextMa(t.rows, "DK-" + now("ddMM") + "-"), td = maNgauNhien_(20);
    var dk = { id: id, ten: ten, sdt: sdt, brand: txt(q.brand, 60), loai: txt(q.model, 80) || txt(q.danhMuc, 30), danhMuc: pick(q.danhMuc, DM, ""), phanKhuc: pick(q.phanKhuc, PKS, ""), hangKhach: pick(q.hang, ["A", "B", "C"], ""),
      giaMua: num(q.giaMua), giaMuon: 0, giaSan: cach === "ban" ? num(q.giaSan) : 0, uocTinh: num(q.uocTinh), hinh: cach, bangChung: txt(q.bangChung, 60), noiO: txt(q.noiO, 60),
      moTa: [txt(q.size, 30) ? "Size " + txt(q.size, 30) : "", txt(q.mau, 40), txt(q.namMua, 10) ? "Mua năm " + txt(q.namMua, 10) : "", txt(q.ghiChu, 600)].filter(String).join(" · "),
      anhKH: { sp: anh, hd: cuaPhien(p, q.hdAnh, "hd") }, ai: aiC ? JSON.parse(aiC) : null, phuKien: (Array.isArray(q.phuKien) ? q.phuKien : []).slice(0, 8).map(function (x) { return txt(x, 40); }),
      giaMuon: num(q.giaMuon), theoDoi: td, nhatTrinh: [khau_("guiDK", { ghiChu: "Giá ước tính trên web " + soDep_(num(q.uocTinh)) + "đ" + (num(q.giaMuon) ? " · bạn mong muốn " + soDep_(num(q.giaMuon)) + "đ" : "") })], ngay: now("yyyy-MM-dd"), gio: new Date().toISOString(), tt: "moi", capNhat: now() };
    appendObj(t, dk);
    log(null, "Yêu cầu định giá", id, dk.brand + " · " + cach);
    return { ok: true, id: id, theoDoi: td };
  });
}

/* 2. Nhân viên tạo (hoặc làm lại) link hợp đồng sau khi chốt giá */
function taoHD(me, q) {
  var id = txt(q.id, 30), d = q.dk || {};
  var cach = pick(d.cach, HINH, "ban"), giaChot = num(d.giaChot); if (!giaChot) fail("Nhập giá chốt", "bad_request");
  dkCot_(); tabCo("HopDong", HD_HEAD); damBaoCot_("HopDong", ["token", "dieuKhoan", "taoLuc", "taoBoi"]);
  return withLock(function () {
    var t = tab("DangKy"), r = find(t, "id", id); if (!r) fail("Không tìm thấy " + id, "not_found");
    var x = toDoc(r), hd = tab("HopDong"), cu = hd.rows.filter(function (h) { return h.dangkyId === id && h.trangThai !== "Đã ký" && h.trangThai !== "Huỷ"; })[0];
    var dieu = { brand: txt(d.brand || x.brand, 60), model: txt(d.model || x.loai, 80), dm: pick(d.dm || x.danhMuc, DM, "tui"), hang: pick(d.hang, ["A", "B", "C"], x.hangKhach || "B"), giaMua: num(d.giaMua || x.giaMua),
      cach: cach, giaChot: giaChot, giaSan: cach === "ban" ? num(d.giaSan) : 0, size: txt(d.size, 30), mau: txt(d.mau, 40), namMua: txt(d.namMua, 10), phuKien: x.phuKien || [], bangChung: txt(d.bangChung || x.bangChung, 60),
      ketQuaKiem: txt(d.ketQuaKiem, 600), soAnh: ((x.anhKH && x.anhKH.sp) || []).length, ten: x.ten, sdt: x.sdt };
    var tok = cu ? cu.token : maNgauNhien_(24), maHD = cu ? cu.id : nextMa(hd.rows, "HD-" + now("ddMM") + "-");
    if (cu) writeObj(hd, cu._r, { hinh: cach, dieuKhoan: dieu, taoLuc: now(), taoBoi: me.ten, trangThai: "Chờ ký" });
    else { var row = { id: maHD, dangkyId: id, hinh: cach, sdt: x.sdt, hoTen: x.ten, trangThai: "Chờ ký", token: tok, dieuKhoan: JSON.stringify(dieu), taoLuc: now(), taoBoi: me.ten };
      hd.sh.appendRow(hd.head.map(function (k) { return row[k] == null ? "" : cell(row[k]); })); }
    var nt = (x.nhatTrinh || []).concat([khau_("taoHD", { nv: me.ten, ghiChu: "Giá chốt " + soDep_(giaChot) + "đ" })]);
    writeObj(t, r._r, { maHD: maHD, hdToken: tok, giaChot: giaChot, offer: giaChot, hinh: cach, tt: ttSau_(x.tt, "taoHD"), nhatTrinh: nt, capNhat: now() });
    log(me, "Tạo link hợp đồng", maHD, id + " · " + cach + " · " + giaChot);
    return { ok: true, maHD: maHD, token: tok, theoDoi: x.theoDoi || "", doc: toDoc(find(tab("DangKy"), "id", id)) };
  });
}
function hdTheoToken_(tok) {
  tok = txt(tok, 40); if (!/^[a-z0-9]{20,40}$/.test(tok)) fail("Link hợp đồng không đúng", "not_found");
  var hd = tab("HopDong"), r = find(hd, "token", tok); if (!r) fail("Link hợp đồng không đúng hoặc đã bị huỷ", "not_found");
  return { hd: hd, r: r };
}
/* 3a. Khách mở link: xem điều khoản (không trả số CCCD, số tài khoản) */
function xemHD(q) {
  var o = hdTheoToken_(q.token), r = o.r, dk = find(tab("DangKy"), "id", r.dangkyId), dd = dk ? toDoc(dk) : {};
  var dieu = {}; try { dieu = JSON.parse(String(r.dieuKhoan).replace(/^'/, "")); } catch (e) {}
  return { ok: true, maHD: r.id, trangThai: r.trangThai, dk: dieu, theoDoi: dd.theoDoi || "", ngayKy: r.ngayKy || "" };
}
/* 3b. Khách ký qua link (online) hoặc nhân viên hỗ trợ tại quầy trên cùng link */
function kyHD(q) {
  var o = hdTheoToken_(q.token), r = o.r, p = String(r.token), h = q.hd || {};
  if (r.trangThai === "Đã ký") fail("Hợp đồng này đã ký rồi", "bad_request");
  var sdt = sdtOk(h.sdt); if (!sdt) fail("Số Zalo chưa đúng (10 số, bắt đầu bằng 0)", "bad_request");
  var ten = txt(h.hoTen, 80); if (ten.length < 4) fail("Nhập họ tên đầy đủ", "bad_request");
  var cccd = String(h.cccd || "").replace(/\D/g, ""); if (!/^\d{12}$/.test(cccd)) fail("Số CCCD gồm 12 chữ số", "bad_request");
  if (!q.dongAnh) fail("Cần đồng ý xử lý ảnh giấy tờ", "bad_request");
  var gt = pick(q.giayTo, ["cccd", "vneid"], "cccd"), cT = cuaPhien(p, [q.cccdT], "cccd")[0] || "", cS = cuaPhien(p, [q.cccdS], "cccd")[0] || "";
  if (!cT || (gt === "cccd" && !cS)) fail(gt === "cccd" ? "Cần ảnh CCCD 2 mặt" : "Cần ảnh màn hình VNeID", "bad_request");
  var ky = String(q.ky || ""); if (!/^data:image\/png;base64,/.test(ky) || ky.length > 600000) fail("Thiếu chữ ký", "bad_request");
  var vb = String(q.vanBan || "").slice(0, 30000); if (vb.length < 500) fail("Thiếu nội dung hợp đồng", "bad_request");
  rate("hd_" + sdt, 6, 86400);
  var gio = now("yyyy-MM-dd HH:mm:ss"), hash = sha256(vb + "\n" + gio + "\n" + cccd);
  var kyId = folderRieng("ky").createFile(Utilities.newBlob(Utilities.base64Decode(ky.split(",")[1]), "image/png", "chuky-" + r.id + ".png")).getId();
  var vbId = folderRieng("vb").createFile(Utilities.newBlob(vb + "\n\n---\nKý lúc " + gio + " (giờ máy chủ, UTC+7) · SHA-256 " + hash + " · Phiên bản " + txt(q.phienBan, 20) + " · Thiết bị " + txt(q.ua, 200), "text/plain", "hopdong-" + r.id + ".txt")).getId();
  return withLock(function () {
    var hd = tab("HopDong"), rr = find(hd, "token", p);
    writeObj(hd, rr._r, { ngayKy: now("yyyy-MM-dd"), gioMayChu: gio, phienBan: txt(q.phienBan, 20), hash: hash, hoTen: ten, ngaySinh: txt(h.ngaySinh, 10), cccd: cccd, diaChi: txt(h.diaChi, 200), sdt: sdt,
      nganHang: txt(h.nganHang, 60), soTK: txt(h.soTK, 30).replace(/\s/g, ""), chuTK: txt(h.chuTK, 80), cccdTruoc: cT, cccdSau: cS, dongYAnh: "Có · " + (gt === "vneid" ? "VNeID" : "CCCD") + (q.docTu === "qr" ? " · đọc QR" : q.docTu === "ai" ? " · AI đọc" : ""),
      chuKy: kyId, vanBan: vbId, thietBi: txt(q.ua, 200), phien: p, trangThai: "Đã ký" });
    var t = tab("DangKy"), d = find(t, "id", rr.dangkyId), td = "";
    if (d) { var x = toDoc(d); td = x.theoDoi; writeObj(t, d._r, { tt: "daky", nhatTrinh: (x.nhatTrinh || []).concat([khau_("kyHD", { ghiChu: "Hợp đồng " + rr.id })]), capNhat: now() }); }
    log(null, "Ký hợp đồng", rr.id, rr.dangkyId);
    return { ok: true, maHD: rr.id, hash: hash, theoDoi: td };
  });
}
/* 4. Nhân viên ghi một khâu (kèm ảnh, ghi chú, số tiền, mã món) */
function themKhau(me, q) {
  var id = txt(q.id, 30), b = pick(q.b, KHAU, ""); if (!b || ["guiDK", "taoHD", "kyHD", "thuongLuong"].indexOf(b) > -1) fail("Chọn khâu", "bad_request");
  dkCot_();
  return withLock(function () {
    var t = tab("DangKy"), r = find(t, "id", id); if (!r) fail("Không tìm thấy " + id, "not_found");
    var x = toDoc(r), e = khau_(b, { nv: me.ten, ghiChu: txt(q.ghiChu, 400), anh: (Array.isArray(q.anh) ? q.anh : []).slice(0, 8).map(function (a) { return txt(a, 80); }), so: num(q.so), ma: txt(q.ma, 30), dat: q.dat === false ? "khong" : "" });
    if (!e.anh.length) delete e.anh;
    var w = { nhatTrinh: (x.nhatTrinh || []).concat([e]).slice(-60), capNhat: now() };
    w.tt = ttSau_(x.tt, b);
    if (b === "kiemDinh" && q.dat === false) w.tt = "khongdat";
    if (b === "baoGia" && e.so) w.offer = e.so;
    if (b === "kiemDinh" && e.so) w.giaChot = e.so;
    writeObj(t, r._r, w);
    log(me, "Khâu " + b, id, txt(q.ghiChu, 120));
    var nx = toDoc(find(tab("DangKy"), "id", id));
    return { ok: true, doc: nx };
  });
}
/* 5. Khách theo dõi: chỉ thông tin món, các khâu, ảnh khâu (ảnh sản phẩm công khai), quy tắc nhận tiền */
function theoDoiKH(q) {
  var tok = txt(q.token, 40); if (!/^[a-z0-9]{16,40}$/.test(tok)) fail("Link theo dõi không đúng", "not_found");
  rate("td_" + tok, 120, 3600);
  var r = find(tab("DangKy"), "theoDoi", tok); if (!r) fail("Link theo dõi không đúng", "not_found");
  var x = toDoc(r), hdLink = "";
  if (x.tt === "hd") { try { var h = tab("HopDong").rows.filter(function (y) { return y.dangkyId === x.id && y.trangThai === "Chờ ký"; })[0]; if (h) hdLink = h.token; } catch (e) {} }
  return { ok: true, dk: { id: x.id, ten: x.ten, brand: x.brand, loai: x.loai, danhMuc: x.danhMuc, hinh: x.hinh, uocTinh: x.uocTinh, giaChot: x.giaChot, offer: x.offer, giaMuon: x.giaMuon, noiO: x.noiO, maHD: x.maHD, tt: x.tt, ngay: x.ngay, nhatTrinh: x.nhatTrinh || [] }, hdToken: hdLink };
}
/* Khách trả lời báo giá trên trang theo dõi: đồng ý, hoặc đề nghị giá khác (thương lượng) */
function phanHoiGia(q) {
  var tok = txt(q.token, 40); if (!/^[a-z0-9]{16,40}$/.test(tok)) fail("Link theo dõi không đúng", "not_found");
  rate("ph_" + tok, 10, 86400);
  return withLock(function () {
    var t = tab("DangKy"), r = find(t, "theoDoi", tok); if (!r) fail("Link theo dõi không đúng", "not_found");
    var x = toDoc(r), nt = x.nhatTrinh || [], bg = nt.filter(function (e) { return e.b === "baoGia"; }).slice(-1)[0];
    if (!bg) fail("Tiệm chưa báo giá", "bad_request");
    var e, w = { capNhat: now() };
    if (q.dongY) { e = khau_("dongY", { so: bg.so, ghiChu: txt(q.ghiChu, 300) }); w.giaMuon = 0; }
    else { var gm = num(q.giaMuon); if (!gm) fail("Nhập giá bạn mong muốn", "bad_request"); e = khau_("thuongLuong", { so: gm, ghiChu: txt(q.ghiChu, 300) }); w.giaMuon = gm; }
    w.nhatTrinh = nt.concat([e]).slice(-60); w.tt = ttSau_(x.tt, e.b);
    writeObj(t, r._r, w); log(null, q.dongY ? "Khách đồng ý giá" : "Khách thương lượng", x.id, String(e.so || ""));
    return { ok: true };
  });
}
/* Khách tỉnh khác nhập mã vận đơn sau khi gửi đồ */
function guiVanDon(q) {
  var tok = txt(q.token, 40); if (!/^[a-z0-9]{16,40}$/.test(tok)) fail("Link theo dõi không đúng", "not_found");
  var ma = txt(q.ma, 40).replace(/\s/g, ""); if (ma.length < 6) fail("Nhập mã vận đơn", "bad_request");
  rate("vd_" + tok, 6, 86400);
  return withLock(function () {
    var t = tab("DangKy"), r = find(t, "theoDoi", tok); if (!r) fail("Link theo dõi không đúng", "not_found");
    var x = toDoc(r); if (!(x.nhatTrinh || []).some(function (e) { return e.b === "dongY"; })) fail("Bạn đồng ý giá trước rồi mới gửi đồ nhé", "bad_request");
    writeObj(t, r._r, { nhatTrinh: (x.nhatTrinh || []).concat([khau_("guiDo", { ma: ma, ghiChu: txt(q.dvvc, 40) })]).slice(-60), tt: ttSau_(x.tt, "guiDo"), capNhat: now() });
    log(null, "Khách gửi đồ", x.id, ma);
    return { ok: true };
  });
}
