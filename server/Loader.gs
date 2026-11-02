/* CHÉRIE Seconde · bộ nạp máy chủ. Mã thật nằm ở GitHub (server/Code.gs), tự tải về và lưu đệm 10 phút.
   Sửa máy chủ chỉ cần đẩy code lên GitHub, không phải dán lại ở đây. Chạy hàm lamMoi() để nạp bản mới ngay. */
var NGUON = "https://raw.githubusercontent.com/leenguyenhongphuc-netizen/cherie-seconde/main/server/Code.gs";
function napMa_() {
  var c = CacheService.getScriptCache(), code = c.get("ma");
  if (!code) { code = UrlFetchApp.fetch(NGUON + "?t=" + Date.now()).getContentText(); if (code.length < 95000) c.put("ma", code, 600); }
  return new Function(code + "\nreturn {doGet:doGet,doPost:doPost,kiemTra:kiemTra,dangXuatTatCa:dangXuatTatCa};")();
}
function doGet(e) { return napMa_().doGet(e); }
function doPost(e) { return napMa_().doPost(e); }
function lamMoi() { CacheService.getScriptCache().remove("ma"); napMa_().kiemTra(); }
function dangXuatTatCa() { napMa_().dangXuatTatCa(); }
/* Không cần chạy: chỉ để Google biết máy chủ cần quyền Sheet, Drive, tải mạng */
function quyen_() { SpreadsheetApp.openById("x"); DriveApp.getRootFolder().createFolder("x"); DriveApp.createFile("x", "x"); DriveApp.getFileById("x").setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); UrlFetchApp.fetch("x"); }
