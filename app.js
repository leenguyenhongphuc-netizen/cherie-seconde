"use strict";
/* ===================== QUY TẮC KINH DOANH ===================== */
const HANG={A:{pct:.35,ten:"Hạng A",mo:"Như mới"},B:{pct:.24,ten:"Hạng B",mo:"Đã mặc, còn đẹp"},C:{pct:.14,ten:"Hạng C",mo:"Có lỗi nhỏ, đã ghi rõ"}};
const TRAN_SALE=.70, GIA_TOI_THIEU=300000, HAN_NGAY=60, PHI_SHOPEE=.253, THUE_ROI_MUA=.45, CHIA_THUE=.5, ZALO="0377159189";
const KENH=["Web / Zalo","Instagram","Livestream","Shopee","Tại tiệm","Thuê rồi mua"];
const TT={cho:"Chờ đăng",dang:"Đang bán",giu:"Khách giữ",ban:"Đã bán",thue:"Cho thuê",tra:"Đã trả chủ đồ"};
const NGUON={cherie:"Đầm CHÉRIE",kygui:"Ký gửi bán",kyguithue:"Ký gửi cho thuê"};
const LOI=[["vet","Vết bẩn khó"],["sut","Sút chỉ, bung đường may"],["phai","Phai, xỉn màu"],["xu","Xù, sờn vải"],["cuc","Thiếu cúc, hỏng khoá"],["mui","Mùi, ố vàng"]];
const TOT=[["tag","Còn tag hãng"],["hoadon","Có hóa đơn / bằng chứng mua"],["giat","Đã giặt hấp qua Care"],["form","Giữ form, không giãn"]];

function tyLeHH(g,r){ if(r!=null&&r!==""&&!isNaN(r)) return Number(r); return g<500000?.30:(g<=10000000?.25:.20); }
function tron(n){ return Math.floor((Number(n)||0)/1000)*1000; }
function giaGoiY(m){ const ny=Number(m.giaNiemYet)||0; let g=ny*(HANG[m.hang]||HANG.B).pct; if(Number(m.giaSale)>0) g=Math.min(g,Number(m.giaSale)*TRAN_SALE); return tron(g); }
function heSo(n){ return n>=45?.65:(n>=30?.80:1); }
function giaNay(m,t){ const goc=Number(m.giaDang)||0; if(!m.ngayDang) return goc; let g=tron(goc*heSo(soNgay(m.ngayDang,t||homNay()))); if(m.nguon!=="cherie"&&Number(m.giaSan)>0) g=Math.max(g,Number(m.giaSan)); return g; }
function lanGiamToi(m,t){ if(!m.ngayDang) return null; const n=soNgay(m.ngayDang,t); if(n<30) return {ngay:cong(m.ngayDang,30),con:30-n,he:.8}; if(n<45) return {ngay:cong(m.ngayDang,45),con:45-n,he:.65}; return null; }
function hangGoiY(c,luot){ const loi=LOI.some(([k])=>c[k]); if(loi) return "C"; if(c.tag||Number(luot)<=2) return "A"; return "B"; }
/* ngày */
function homNay(){ return fromD(new Date()); }
function toD(s){ const [y,m,d]=String(s).split("-").map(Number); return new Date(y,(m||1)-1,d||1); }
function fromD(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function cong(s,n){ const d=toD(s); d.setDate(d.getDate()+n); return fromD(d); }
function soNgay(a,b){ return Math.round((toD(b)-toD(a))/864e5); }
function hanTra(g){ let d=cong(g,3),n=0; while(n<3){ d=cong(d,1); if(toD(d).getDay()!==0) n++; } return d; }
const THU=["Chủ nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
function vnd(n){ n=Math.round(Number(n)||0); return (n<0?"-":"")+Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".")+"đ"; }
function ngVN(s){ if(!s) return ""; const [y,m,d]=s.split("-"); return d+"/"+m+"/"+y; }
function ngNgan(s){ if(!s) return ""; const [,m,d]=s.split("-"); return d+"/"+m; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function tien(v){ return Number(String(v==null?"":v).replace(/[^\d]/g,""))||0; }
function sdt(v){ return String(v||"").replace(/[^\d]/g,""); }
function val(id){ const e=document.getElementById(id); return e?e.value:""; }
function gioNay(){ return new Date().toISOString(); }
function soGio(iso){ return iso?Math.floor((Date.now()-Date.parse(iso))/36e5):0; }

/* ===================== TRẠNG THÁI ===================== */
const S={mon:[],don:[],dangky:[],thue:[],dathang:[],db:null,assets:null,sample:null,aiImg:false,user:null,canWrite:null,ready:false,
  shop:{cat:"all",hang:"all",size:"all",sort:"moi",q:""}, cart:[], kho:{tt:"dang",q:"",sort:"moi",chon:new Set(),chonMode:false}, chu:{seg:"all"}, W:null};
try{ S.cart=JSON.parse(localStorage.getItem("seconde-gio")||"[]")||[]; }catch(e){ S.cart=[]; }
function luuGio(){ try{ localStorage.setItem("seconde-gio",JSON.stringify(S.cart)); }catch(e){} }
function toast(m){ const t=document.getElementById("toast"); t.textContent=m; t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>t.hidden=true,2600); }
function openSheet(html,side){ const s=document.getElementById("sheet"); s.className="sheet"+(side?" side":""); document.getElementById("sheetIn").innerHTML=html; s.hidden=false; }
function closeSheet(){ const s=document.getElementById("sheet"); s.hidden=true; document.getElementById("sheetIn").innerHTML=""; }
function sheetOpen(){ return !document.getElementById("sheet").hidden; }
function loiGhi(e){ const c=e&&e.code; if(c==="revoked"){ SC.saveAuth("",null); lastShell=""; toast("Phiên đăng nhập hết, đăng nhập lại."); veLai(); return; } if(e&&e.message&&c!=="unavailable"&&c!=="invalid_argument"){ toast(e.message); return; } if(c==="invalid_argument"){ S.canWrite=false; toast("Bạn chưa có quyền ghi dữ liệu."); veLai(); } else if(c==="quota_exceeded") toast("Kho dữ liệu đầy, xoá bớt món cũ."); else toast("Chưa lưu được. Kiểm tra mạng rồi thử lại."); }
async function chep(text,ok){ try{ await navigator.clipboard.writeText(text); toast(ok||"Đã chép."); }catch(e){ toast("Không chép tự động được, hãy giữ ngón tay lên đoạn tin để chép."); } }
function anh(id,w){ return "https://drive.google.com/thumbnail?id="+encodeURIComponent(id)+"&sz=w"+(w||800); }
function phHtml(m,cls){ const a=(m.anh||[])[0]; return `<div class="ph ${cls||""}">${a?`<img src="${anh(a)}" alt="${esc(m.ten)}" loading="lazy">`:`<div class="mono">${esc((m.brand||"CHÉRIE").toUpperCase())}</div>`}</div>`; }
function lichSu(m,viec){ return (m.lichSu||[]).concat([{n:homNay(),v:viec}]).slice(-30); }

/* ===================== ĐIỀU HƯỚNG ===================== */
const SHOP=["cua-hang","ky-gui"], ADM=["quan-tri","qt-nhan","qt-kho","qt-don","qt-chu"];
const MODE=window.SC_MODE==="adm"?"adm":"shop";
function hienTai(){ const h=(location.hash||"").slice(1); return MODE==="adm"?(ADM.includes(h)?h:"quan-tri"):(SHOP.includes(h)?h:"cua-hang"); }
function laAdmin(){ return MODE==="adm"; }
let lastShell="";
function render(){ const v=hienTai(), shell=laAdmin()?"adm":"shop";
  if(shell!==lastShell){ lastShell=shell; document.getElementById("app").innerHTML=shell==="adm"?admShell():shopShell(); }
  if(shell==="adm") renderAdm(v); else renderShop(v); }
let hen=0; function veLai(){ cancelAnimationFrame(hen); hen=requestAnimationFrame(render); }
window.addEventListener("hashchange",()=>{ closeSheet(); render(); window.scrollTo({top:0}); });

/* =================================================================
   CỬA HÀNG (khách)
   ================================================================= */
function shopShell(){ return `
 <div class="annc gut"><span>Giặt hấp chuẩn CHÉRIE Care · Ảnh tình trạng thật · Giao toàn quốc · Đổi trả 3 ngày</span></div>
 <header class="shead"><div class="in max gut">
   <a class="word" href="#cua-hang">CHÉRIE<em>Seconde</em></a>
   <div class="snav-wrap"><nav class="snav" id="snav"></nav></div>
   <div class="ssearch"><input id="sq" type="search" placeholder="Tìm thương hiệu, kiểu đầm, màu…" aria-label="Tìm sản phẩm"></div>
   <button class="cartbtn" data-a="gio">Giỏ<b id="cartN">0</b></button>
 </div></header>
 <main id="smain"></main>`; }
function renderShop(v){
  document.getElementById("snav").innerHTML=[["cua-hang","all","Tất cả"],["cua-hang","cherie","Đầm CHÉRIE"],["cua-hang","kygui","Đồ ký gửi"],["cua-hang","giam","Đang giảm giá"],["ky-gui","","Ký gửi đồ"]]
    .map(([h,c,t])=>`<a href="#${h}" data-a="cat" data-v="${c}" aria-current="${(v===h&&(h==="ky-gui"||S.shop.cat===c))?"page":"false"}">${t}</a>`).join("");
  document.getElementById("cartN").textContent=gioHop().length;
  const q=document.getElementById("sq"); if(q&&!q._b){ q._b=1; q.value=S.shop.q; q.addEventListener("input",()=>{ S.shop.q=q.value; if(hienTai()!=="cua-hang") location.hash="cua-hang"; else veSP(); }); }
  const hh=document.querySelector(".shead"); if(hh) document.documentElement.style.setProperty("--hh",hh.offsetHeight+"px");
  if(v==="ky-gui") renderKyGui(); else renderCuaHang();
  if(sheetOpen()&&document.getElementById("cartPanel")) veGio();
}
function dsBan(){ return S.mon.filter(m=>m.tt==="dang"&&m.nguon!=="kyguithue"); }
function gioHop(){ const ids=new Set(dsBan().map(m=>m.id)); return S.cart.filter(id=>ids.has(id)); }
function renderCuaHang(){
  const el=document.getElementById("smain"); if(!document.getElementById("spList")){
  el.innerHTML=`<div class="max gut">
   <section class="hero"><div><div class="eyebrow">Secondhand thương hiệu Việt & luxury</div>
     <h1>Đầm đẹp đã qua một mùa tiệc, giá chỉ bằng một phần.</h1>
     <p>Mỗi món qua xưởng CHÉRIE Care giặt hấp và kiểm từng đường may. Hạng A, B, C và mọi lỗi nhỏ đều ghi rõ, kèm ảnh thật.</p></div>
     <div class="usp"><div><b>Rẻ hơn giá hãng 60–80%</b>Giá gốc in cạnh giá bán</div><div><b>Ảnh tình trạng thật</b>4 góc, không dùng ảnh hãng</div>
       <div><b>Đổi trả 3 ngày</b>Không vừa thì gửi lại</div><div><b>Giao toàn quốc</b>Đà Nẵng giao thứ 2, thứ 6</div></div></section>
   <div class="toolbar" id="spBar"></div><div id="spList"></div>
   <section class="trust"><div><b>Kiểm định nguồn gốc</b>Chỉ nhận hàng có hóa đơn, tag hoặc bằng chứng mua.</div><div><b>Phân hạng minh bạch</b>A như mới, B đã mặc còn đẹp, C có lỗi nhỏ ghi rõ.</div>
     <div><b>Thanh toán VietQR</b>Chuyển khoản đúng tên tiệm, có biên nhận.</div><div><b>Có đồ đẹp muốn bán?</b><a href="#ky-gui">Ký gửi cùng CHÉRIE</a>, nhận tiền sau 3 ngày làm việc.</div></section>
  </div>${footer()}`; }
  veSP();
}
function footer(){ return `<footer class="max gut sfoot"><div><b style="color:var(--ink)">CHÉRIE Seconde</b><br>Một nhánh của CHÉRIE · Đà Nẵng</div><div>Zalo đặt hàng: <span class="num" style="user-select:all">${ZALO}</span></div><div>Mỗi lần, một chiếc mới.</div></footer>`; }
function locSP(){ const f=S.shop,t=homNay(),q=f.q.trim().toLowerCase(); let l=dsBan();
  if(f.cat==="cherie") l=l.filter(m=>m.nguon==="cherie"); if(f.cat==="kygui") l=l.filter(m=>m.nguon!=="cherie"); if(f.cat==="giam") l=l.filter(m=>m.ngayDang&&heSo(soNgay(m.ngayDang,t))<1);
  if(f.hang!=="all") l=l.filter(m=>m.hang===f.hang); if(f.size!=="all") l=l.filter(m=>m.size===f.size);
  if(q) l=l.filter(m=>[m.ten,m.brand,m.mau,m.loai,m.moTa].join(" ").toLowerCase().includes(q));
  const s=f.sort; l.sort((a,b)=>s==="tang"?giaNay(a,t)-giaNay(b,t):s==="giam"?giaNay(b,t)-giaNay(a,t):s==="re"?(1-giaNay(b,t)/(b.giaNiemYet||1e12))-(1-giaNay(a,t)/(a.giaNiemYet||1e12)):String(b.ngayDang).localeCompare(String(a.ngayDang)));
  return l; }
function veSP(){
  const bar=document.getElementById("spBar"), box=document.getElementById("spList"); if(!bar) return; const t=homNay(), l=locSP(), f=S.shop;
  const sizes=[...new Set(dsBan().map(m=>m.size).filter(Boolean))].sort();
  const c=(k,v,tx)=>`<button class="chip" data-a="sf" data-k="${k}" data-v="${esc(v)}" aria-pressed="${f[k]===v}">${esc(tx)}</button>`;
  bar.innerHTML=`<div class="chips">${c("hang","all","Mọi hạng")}${c("hang","A","Hạng A")}${c("hang","B","Hạng B")}${c("hang","C","Hạng C")}${sizes.length?c("size","all","Mọi size")+sizes.map(s=>c("size",s,"Size "+s)).join(""):""}</div>
   <div class="row"><span class="small muted num">${l.length} món</span><select id="sSort" aria-label="Sắp xếp"><option value="moi">Mới lên kệ</option><option value="re">Tiết kiệm nhiều nhất</option><option value="tang">Giá thấp đến cao</option><option value="giam">Giá cao đến thấp</option></select></div>`;
  const ss=document.getElementById("sSort"); ss.value=f.sort; ss.onchange=()=>{f.sort=ss.value;veSP()};
  const trong=new Set(S.cart);
  box.innerHTML=l.length?`<div class="grid">${l.map(m=>{ const g=giaNay(m,t),n=m.ngayDang?soNgay(m.ngayDang,t):0,h=heSo(n),ny=Number(m.giaNiemYet)||0;
    return `<article class="pcard"><div class="media"><button class="imgbtn" data-a="xem" data-id="${m.id}" aria-label="Xem ${esc(m.ten)}">${phHtml(m)}
      <span class="badges"><span class="pill ${m.hang}">${m.hang}</span>${m.nguon!=="cherie"?`<span class="pill">Ký gửi</span>`:""}</span>${h<1?`<span class="off pill sale">−${Math.round((1-h)*100)}%</span>`:""}</button>
      <button class="quick" data-a="them" data-id="${m.id}" ${trong.has(m.id)?"disabled":""}>${trong.has(m.id)?"Đã trong giỏ":"+ Thêm vào giỏ"}</button></div>
      <div class="meta"><span>${esc(m.brand||"")}</span>${m.size?`<span>· Size ${esc(m.size)}</span>`:""}${m.mau?`<span>· ${esc(m.mau)}</span>`:""}</div>
      <div class="nm" data-a="xem" data-id="${m.id}">${esc(m.ten)}</div>
      <div class="price"><b class="num">${vnd(g)}</b>${ny>g?`<s class="num">${vnd(ny)}</s>`:""}</div>
      ${ny>g?`<div class="save num">Rẻ hơn giá hãng ${Math.round((1-g/ny)*100)}%</div>`:""}</article>`; }).join("")}</div>`
    :`<div class="empty" style="margin-block:12px 30px"><b>${S.ready?(dsBan().length?"Không có món khớp bộ lọc":"Kệ đang được làm mới"):"Đang tải sản phẩm…"}</b>${S.ready?(dsBan().length?"Thử bỏ bớt bộ lọc hoặc từ khoá.":"Món mới lên kệ mỗi tuần. Nhắn Zalo "+ZALO+" để được báo trước."):""}</div>`;
}
function xemSP(id){ const m=S.mon.find(x=>x.id===id); if(!m) return; const t=homNay(),g=giaNay(m,t),ny=Number(m.giaNiemYet)||0,a=m.anh||[];
  const c=m.tinhTrang||{}, loi=LOI.filter(([k])=>c[k]).map(x=>x[1]), tot=TOT.filter(([k])=>c[k]).map(x=>x[1]);
  openSheet(`<div class="row"><div><div class="eyebrow">${esc(m.brand||"")}</div><h2>${esc(m.ten)}</h2></div><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
   ${a.length?`<div class="gal">${a.map(i=>`<div class="ph"><img src="${anh(i)}" alt="${esc(m.ten)}" loading="lazy"></div>`).join("")}</div>`:`<div style="max-width:260px">${phHtml(m)}</div>`}
   <div class="price" style="font-size:20px"><b class="num" style="font-size:24px">${vnd(g)}</b>${ny>g?`<s class="num">Giá hãng ${vnd(ny)}</s><span class="save">Rẻ hơn ${Math.round((1-g/ny)*100)}%</span>`:""}</div>
   <div class="row"><span class="pill ${m.hang}">${HANG[m.hang].ten} · ${HANG[m.hang].mo}</span>${m.size?`<span class="pill">Size ${esc(m.size)}</span>`:""}${m.mau?`<span class="pill">${esc(m.mau)}</span>`:""}${m.chatLieu?`<span class="pill">${esc(m.chatLieu)}</span>`:""}</div>
   ${m.moTa?`<p style="margin:0;max-width:62ch">${esc(m.moTa)}</p>`:""}
   <div class="card stack" style="gap:6px"><b>Tình trạng</b>
     ${tot.map(x=>`<div class="small">✓ ${esc(x)}</div>`).join("")}${loi.map(x=>`<div class="small" style="color:var(--wine)">• ${esc(x)}</div>`).join("")}
     ${m.loi?`<div class="small" style="color:var(--wine)">• ${esc(m.loi)}</div>`:""}${!tot.length&&!loi.length&&!m.loi?`<div class="small muted">Đã kiểm tại xưởng Care, không có lỗi cần ghi.</div>`:""}</div>
   <div class="row"><button class="btn wine" data-a="muangay" data-id="${m.id}">Mua ngay</button><button class="btn line" data-a="them" data-id="${m.id}">${S.cart.includes(m.id)?"Đã trong giỏ":"Thêm vào giỏ"}</button></div>
   <p class="small muted" style="margin:0">Mỗi món chỉ có một chiếc. Đặt xong tiệm giữ 24 giờ và nhắn Zalo gửi mã VietQR.</p>`); }
function moGio(){ openSheet(`<div id="cartPanel" class="stack"></div>`,true); veGio(); }
function veGio(){ const p=document.getElementById("cartPanel"); if(!p) return; const t=homNay(); const ids=gioHop(), ms=ids.map(id=>S.mon.find(m=>m.id===id));
  const tong=ms.reduce((s,m)=>s+giaNay(m,t),0), goc=ms.reduce((s,m)=>s+(Number(m.giaNiemYet)||0),0);
  const keep={ten:val("oTen"),sdt:val("oSdt"),noi:val("oNoi"),ghi:val("oGhi")};
  p.innerHTML=`<div class="row"><h2>Giỏ hàng</h2><span class="muted num">${ms.length} món</span><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
   ${ms.length?ms.map(m=>`<div class="cline">${phHtml(m)}<div><div style="font-weight:600">${esc(m.ten)}</div><div class="small muted">${esc(m.brand||"")} · ${HANG[m.hang].ten}${m.size?" · Size "+esc(m.size):""}</div><button class="btn sm line" style="margin-top:6px" data-a="bo" data-id="${m.id}">Bỏ</button></div><b class="num">${vnd(giaNay(m,t))}</b></div>`).join("")
     +`<div class="breakdown num"><div><span>Giá hãng</span><s>${vnd(goc)}</s></div><div><span>Bạn tiết kiệm</span><span style="color:var(--wine)">${vnd(goc-tong)}</span></div><div><span>Tạm tính</span><span>${vnd(tong)}</span></div></div>
     <form id="fOrder" class="stack"><b>Thông tin nhận hàng</b>
      <label class="f">Họ tên<input id="oTen" required autocomplete="name" value="${esc(keep.ten)}"></label>
      <label class="f">Số Zalo<input id="oSdt" required inputmode="tel" autocomplete="tel" value="${esc(keep.sdt)}"></label>
      <label class="f">Địa chỉ nhận<input id="oNoi" autocomplete="street-address" value="${esc(keep.noi)}"></label>
      <label class="f">Ghi chú (size bạn hay mặc, giờ nhận…)<input id="oGhi" value="${esc(keep.ghi)}"></label>
      <button class="btn wine block" type="submit" ${S.canWrite===false?"disabled":""}>Đặt giữ ${ms.length} món · ${vnd(tong)}</button>
      <p class="small muted" style="margin:0">Phí ship báo khi tiệm nhắn Zalo. ${S.canWrite===false?"Trang đang ở chế độ xem, nhắn Zalo "+ZALO+" để đặt.":""}</p></form>`
   :`<div class="empty"><b>Giỏ đang trống</b>Chọn món bạn thích rồi bấm "Thêm vào giỏ".</div>`}`;
  const f=document.getElementById("fOrder"); if(f) f.addEventListener("submit",async ev=>{ ev.preventDefault();
    const ten=val("oTen").trim(), so=sdt(val("oSdt")); if(!ten||so.length<9){ toast("Nhập họ tên và số Zalo."); return; }
    const con=gioHop().map(id=>S.mon.find(m=>m.id===id)).filter(m=>m&&m.tt==="dang"); if(!con.length){ toast("Món trong giỏ vừa có người mua."); veGio(); return; }
    try{ const items=con.map(m=>({monId:m.id,ma:m.ma||"",ten:m.ten,gia:giaNay(m,homNay())}));
      await S.db.collection("dathang").add({items,ten,sdt:so,noi:val("oNoi").trim(),ghiChu:val("oGhi").trim(),tong:items.reduce((s,i)=>s+i.gia,0),ngay:homNay(),gio:gioNay(),tt:"moi"});
      for(const m of con) await S.db.doc("mon/"+m.id).update({tt:"giu",lichSu:lichSu(m,"Khách "+ten+" đặt giữ")});
      S.cart=[]; luuGio(); document.getElementById("cartPanel").outerHTML=`<div class="stack"><div class="row"><h2>Đã nhận đơn</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div><div class="banner ok">Tiệm đang giữ ${items.length} món cho bạn trong 24 giờ và sẽ nhắn Zalo ${esc(so)} để gửi mã VietQR.</div><button class="btn" data-a="dong">Tiếp tục xem</button></div>`; veSP();
    }catch(e){ loiGhi(e); } });
  document.getElementById("cartN").textContent=ids.length; }

/* ---------- Ký gửi (khách) ---------- */
function renderKyGui(){ const el=document.getElementById("smain"); if(document.getElementById("fKg")){ traCuu(); return; }
  el.innerHTML=`<div class="max gut stack" style="gap:26px;padding-block:24px">
   <section class="hero" style="padding:0"><div><div class="eyebrow">Ký gửi tại CHÉRIE Seconde</div><h1>Tủ đồ đẹp nằm yên thì tiếc. Gửi CHÉRIE bán giúp bạn.</h1>
     <p>Tiệm lo giặt hấp, chụp ảnh, đăng bán toàn quốc. Bạn chọn giá sàn, tiền về sau 3 ngày làm việc kể từ khi hết hạn đổi trả.</p></section>
   <div class="steps"><div><b>Đăng ký</b>Điền form bên dưới hoặc nhắn Zalo.</div><div><b>Tiệm nhận và kiểm</b>Kiểm nguồn gốc, phân hạng, giặt hấp qua Care.</div><div><b>Đăng bán toàn quốc</b>Web, Zalo, Instagram, livestream.</div><div><b>Nhận tiền</b>Trong 3 ngày làm việc sau khi hết hạn đổi trả.</div></div>
   <div class="g2">
    <div class="card"><h3>Phí ký gửi</h3><div class="tiers num"><div><span>Món dưới 500.000đ</span><b>30%</b></div><div><span>500.000đ – 10.000.000đ</span><b>25%</b></div><div><span>Trên 10.000.000đ</span><b>20%</b></div><div><span>Hàng luxury</span><b>Thỏa thuận</b></div></div></div>
    <div class="card"><h3>Thời hạn và giá</h3><div class="tiers"><div><span>Giữ đồ tối đa</span><b>${HAN_NGAY} ngày</b></div><div><span>Từ ngày 30</span><b>Giảm 20%</b></div><div><span>Từ ngày 45</span><b>Giảm 35%</b></div><div><span>Không bao giờ thấp hơn</span><b>Giá sàn của bạn</b></div></div></div>
    <div class="card stack" style="gap:8px"><h3>Bạn nhận được bao nhiêu?</h3><label class="f">Giá bán dự kiến<input id="tinhGia" inputmode="numeric" placeholder="1.200.000"></label><div id="tinhKq" class="num"></div><p class="small muted" style="margin:0">Giá bán tối thiểu ${vnd(GIA_TOI_THIEU)}. Nhận hàng thương hiệu có hóa đơn, tag hoặc bằng chứng mua.</p></div>
   </div>
   <form id="fKg" class="card stack"><h2>Đăng ký gửi đồ</h2>
    <div class="g2"><label class="f">Tên của bạn<input id="kgTen" required autocomplete="name"></label><label class="f">Số Zalo<input id="kgSdt" required inputmode="tel" autocomplete="tel"></label>
     <label class="f">Thương hiệu<input id="kgBrand" required placeholder="SIXDO, Chanel, Coach…"></label><label class="f">Loại đồ<input id="kgLoai" placeholder="Đầm, túi, giày…"></label>
     <label class="f">Giá mua lúc đầu<input id="kgGiaMua" inputmode="numeric"></label><label class="f">Giá muốn bán<input id="kgGiaMuon" inputmode="numeric"></label>
     <label class="f">Giá sàn (thấp nhất bạn đồng ý)<input id="kgGiaSan" inputmode="numeric"></label>
     <label class="f">Hình thức<select id="kgHinh"><option value="ban">Ký gửi bán</option><option value="thue">Ký gửi cho thuê (chia 50/50 tiền thuê)</option></select></label>
     <label class="f">Bằng chứng mua<select id="kgBC"><option>Hóa đơn</option><option>Còn tag</option><option>Ảnh đơn hàng online</option><option>Chưa có</option></select></label></div>
    <label class="f">Tình trạng, size, số lần đã mặc<textarea id="kgMoTa"></textarea></label>
    <div class="row"><button class="btn wine" type="submit" ${S.canWrite===false?"disabled":""}>Gửi đăng ký</button><span class="small muted">Tiệm nhắn Zalo hẹn nhận đồ trong ngày làm việc.</span></div></form>
   <div class="card stack"><h2>Tra cứu đồ ký gửi</h2><div class="row"><input id="traSdt" inputmode="tel" placeholder="Số Zalo đã đăng ký" style="flex:1 1 180px"><input id="traMa" placeholder="Mã đăng ký hoặc mã món" style="flex:1 1 180px;text-transform:uppercase"><button class="btn line" data-a="tra">Xem</button></div><p class="small muted" style="margin:0">Mã DK-… nhận khi gửi đăng ký, hoặc mã món trên biên nhận ký gửi.</p><div id="traKq"></div></div>
  </div>${footer()}`;
  const tinh=()=>{ const g=tien(val("tinhGia")),k=document.getElementById("tinhKq"); if(!g){k.innerHTML=`<span class="small muted">Nhập giá để xem phí và số tiền bạn nhận.</span>`;return}
    const r=tyLeHH(g),h=Math.round(g*r); k.innerHTML=g<GIA_TOI_THIEU?`<span class="pill warn">Dưới mức tối thiểu ${vnd(GIA_TOI_THIEU)}</span>`:`<div class="breakdown"><div><span>Phí ${Math.round(r*100)}%</span><span>${vnd(h)}</span></div><div><span>Bạn nhận</span><span>${vnd(g-h)}</span></div></div>`; };
  document.getElementById("tinhGia").addEventListener("input",tinh); tinh();
  document.getElementById("fKg").addEventListener("submit",async ev=>{ ev.preventDefault(); const so=sdt(val("kgSdt")),san=tien(val("kgGiaSan")),muon=tien(val("kgGiaMuon"));
    if(so.length<9){toast("Số Zalo chưa đúng.");return} if(muon&&muon<GIA_TOI_THIEU){toast("Giá muốn bán cần từ "+vnd(GIA_TOI_THIEU)+".");return} if(san&&muon&&san>muon){toast("Giá sàn cao hơn giá muốn bán.");return}
    try{ const kq=await S.db.collection("dangky").add({ten:val("kgTen").trim(),sdt:so,brand:val("kgBrand").trim(),loai:val("kgLoai").trim(),giaMua:tien(val("kgGiaMua")),giaMuon:muon,giaSan:san,hinh:val("kgHinh"),bangChung:val("kgBC"),moTa:val("kgMoTa").trim(),ngay:homNay(),gio:gioNay(),tt:"moi"}); S.dkMoi=kq&&kq.id;
      ["kgBrand","kgLoai","kgGiaMua","kgGiaMuon","kgGiaSan","kgMoTa"].forEach(i=>document.getElementById(i).value=""); openSheet(`<div class="row"><h2>Đã nhận đăng ký</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div><div class="banner ok">Mã đăng ký của bạn: <b class="num" style="user-select:all">${esc(S.dkMoi||"")}</b>. Giữ mã này để tra cứu đồ ký gửi.</div><p class="small muted" style="margin:0">Tiệm sẽ nhắn Zalo hẹn nhận đồ trong ngày làm việc.</p><button class="btn" data-a="dong">Xong</button>`); }catch(e){ loiGhi(e); } });
}
function traCuu(){ const k=document.getElementById("traKq"); if(!k||!S.traSo) return; const so=S.traSo, t=homNay();
  const T=S.tra||{}, mon=T.mon||[], dk=T.dangky||[], don=T.don||[], th=T.thue||[];
  if(!mon.length&&!dk.length){ k.innerHTML=`<div class="empty"><b>Chưa thấy đồ với số này</b>Kiểm tra lại số, hoặc gửi đăng ký ở trên.</div>`; return; }
  const cho=don.filter(d=>!d.daTra).reduce((s,d)=>s+d.tienChuDo,0)+th.filter(x=>!x.daTra).reduce((s,x)=>s+x.chiaChuDo,0), da=don.filter(d=>d.daTra).reduce((s,d)=>s+d.tienChuDo,0)+th.filter(x=>x.daTra).reduce((s,x)=>s+x.chiaChuDo,0);
  k.innerHTML=`<div class="kpis"><div class="kpi"><span class="k">Tiền sắp nhận</span><span class="v num">${vnd(cho)}</span></div><div class="kpi"><span class="k">Đã nhận</span><span class="v num">${vnd(da)}</span></div><div class="kpi"><span class="k">Đang bán</span><span class="v num">${mon.filter(m=>m.tt==="dang").length}</span></div><div class="kpi"><span class="k">Đã bán</span><span class="v num">${mon.filter(m=>m.tt==="ban").length}</span></div></div>
  <div class="stack" style="margin-top:12px;gap:8px">${dk.map(x=>`<div class="irow nosel" style="cursor:default"><div class="ph"><div class="mono">${esc((x.brand||"").slice(0,6).toUpperCase())}</div></div><div><div class="ttl">${esc(x.brand)} ${esc(x.loai)}</div><div class="sub"><span class="pill warn">Chờ tiệm nhận</span>Đăng ký ${ngVN(x.ngay)}</div></div><div class="pr num">${x.giaMuon?vnd(x.giaMuon):""}</div></div>`).join("")}
  ${mon.map(m=>{ const d=don.find(x=>x.monId===m.id); let note=""; if(m.tt==="dang"&&m.ngayDang){ const n=soNgay(m.ngayDang,t); note=`Đã treo ${n} ngày`; const nx=lanGiamToi(m,t); if(nx) note+=` · ${ngNgan(nx.ngay)} giảm còn ${vnd(Math.max(tron(m.giaDang*nx.he),Number(m.giaSan)||0))}`; }
    if(d) note=d.daTra?`Đã chuyển ${vnd(d.tienChuDo)} ngày ${ngVN(d.ngayTraTien)}`:`Bạn nhận ${vnd(d.tienChuDo)} trước ${ngVN(d.hanTra)}`; if(m.tt==="thue") note=`${th.filter(x=>x.monId===m.id).length} lượt thuê`;
    return `<div class="irow nosel" style="cursor:default">${phHtml(m)}<div><div class="ttl">${esc(m.ten)}</div><div class="sub">${pillTT(m)}<span>${note}</span></div></div><div class="pr num">${vnd(m.tt==="ban"&&d?d.gia:giaNay(m,t))}</div></div>`; }).join("")}</div>`; }
function pillTT(m){ const c={cho:"info",dang:"ok",giu:"warn",ban:"",thue:"ok",tra:"bad"}[m.tt]||""; return `<span class="pill ${c}">${esc(TT[m.tt]||m.tt)}</span>`; }

/* =================================================================
   QUẢN TRỊ (nhân viên)
   ================================================================= */
const IC={
 home:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
 plus:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
 box:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
 bag:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
 user:'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.6 2 3 5"/></svg>'};
const MENU=[["quan-tri","Hôm nay","home"],["qt-nhan","Nhận đồ","plus"],["qt-kho","Kho","box"],["qt-don","Đơn","bag"],["qt-chu","Chủ đồ","user"]];
const TITLE={"quan-tri":"Hôm nay","qt-nhan":"Nhận đồ","qt-kho":"Kho","qt-don":"Đơn hàng","qt-chu":"Chủ đồ ký gửi"};
function admShell(){ return `<div class="adm">
  <aside class="aside"><a class="word" href="#quan-tri" style="padding:4px 10px 14px">CHÉRIE<em>Seconde</em></a><nav id="aNav" class="stack" style="gap:2px"></nav>
   <div class="foot">Quản trị nội bộ<br><a href="../" target="_blank" rel="noopener" style="padding:0;display:inline;color:var(--wine)">Xem cửa hàng như khách ↗</a> · <a href="#" data-a="dangXuat" style="padding:0;display:inline;color:var(--muted)">Đăng xuất</a></div></aside>
  <div class="amain"><header class="atop"><div class="in gut"><h1 id="aTitle"></h1><div class="q"><input id="aq" type="search" placeholder="Tìm món, mã, chủ đồ, khách…" aria-label="Tìm nhanh" autocomplete="off"><div id="aqRes" class="qres" hidden></div></div></div></header>
   <div id="aBody" class="abody gut max"></div></div>
  <nav class="bnav" id="bNav"></nav></div>`; }
function demViec(){ return taoViec().filter(v=>v.p<=2).length; }
function renderAdm(v){
  const cnt={"quan-tri":demViec(),"qt-don":S.dathang.filter(x=>x.tt==="moi").length,"qt-chu":S.dangky.filter(x=>x.tt==="moi").length};
  document.getElementById("aNav").innerHTML=MENU.map(([h,t,i])=>`<a href="#${h}" aria-current="${v===h?"page":"false"}">${IC[i]}${t}${cnt[h]?`<span class="cnt pill wine">${cnt[h]}</span>`:""}</a>`).join("");
  document.getElementById("bNav").innerHTML=MENU.map(([h,t,i])=>`<a href="#${h}" class="${h==="qt-nhan"?"plus":""}" aria-current="${v===h?"page":"false"}">${IC[i]}<span>${t}</span>${cnt[h]?`<span class="dot">${cnt[h]}</span>`:""}</a>`).join("");
  document.getElementById("aTitle").textContent=TITLE[v];
  const q=document.getElementById("aq"); if(!q._b){ q._b=1; q.addEventListener("input",timNhanh); q.addEventListener("focus",timNhanh); document.addEventListener("click",e=>{ if(!e.target.closest(".q")) document.getElementById("aqRes").hidden=true; }); }
  const b=document.getElementById("aBody");
  if(S.canWrite===false){ b.innerHTML=`<div class="empty"><b>Bạn chưa có quyền quản trị</b>Đăng nhập lại bằng tài khoản nhân sự.</div>`; return; }
  if(!S.ready){ b.innerHTML=`<div class="empty"><b>Đang mở dữ liệu…</b></div>`; return; }
  if(v==="qt-nhan"){ if(!document.getElementById("wiz")) veWizard(); return; }
  ({"quan-tri":admHomNay,"qt-kho":admKho,"qt-don":admDon,"qt-chu":admChu})[v](b);
}
/* ---------- Tìm nhanh ---------- */
function timNhanh(){ const q=val("aq").trim().toLowerCase(), r=document.getElementById("aqRes"); if(q.length<2){ r.hidden=true; return; }
  const ms=S.mon.filter(m=>[m.ten,m.brand,m.ma,m.maGoc,m.chuDo,m.chuTen].join(" ").toLowerCase().includes(q)).slice(0,6);
  const cs=dsChuDo().filter(c=>(c.ten+" "+c.sdt).toLowerCase().includes(q)).slice(0,4);
  const ds=S.dathang.filter(d=>(d.ten+" "+d.sdt).toLowerCase().includes(q)).slice(0,3);
  r.innerHTML=(ms.map(m=>`<button data-a="mo" data-id="${m.id}"><div style="width:36px">${phHtml(m)}</div><div><b>${esc(m.ten)}</b><div class="small muted">${esc(m.ma||"")} · ${TT[m.tt]}</div></div></button>`).join("")
   +cs.map(c=>`<button data-a="moChu" data-v="${c.sdt}">${IC.user}<div><b>${esc(c.ten||c.sdt)}</b><div class="small muted num">Chủ đồ · ${esc(c.sdt)} · ${c.mon.length} món</div></div></button>`).join("")
   +ds.map(d=>`<button data-a="goDon">${IC.bag}<div><b>${esc(d.ten)}</b><div class="small muted num">Khách đặt ${ngVN(d.ngay)} · ${vnd(d.tong)}</div></div></button>`).join(""))||`<div class="small muted" style="padding:12px">Không thấy kết quả.</div>`;
  r.hidden=false; }

/* ---------- Việc cần làm (tự xếp ưu tiên) ---------- */
function taoViec(){ const t=homNay(), v=[];
  S.dathang.filter(d=>d.tt==="moi").forEach(d=>{ const h=soGio(d.gio); v.push({p:h>=24?1:2,t:`${d.ten} đặt giữ ${(d.items||[]).length} món · ${vnd(d.tong)}`,d:h>=24?`Đã giữ ${h} giờ, quá hạn 24 giờ`:`Đặt ${h<1?"vừa xong":h+" giờ trước"} · Zalo ${d.sdt}`,
    a:[["chot","Chốt đơn",d.id,"wine"],["tinKhach","Soạn tin Zalo",d.id],h>=24?["boDat","Bỏ giữ",d.id]:null]}); });
  noChuDo().forEach(r=>{ if(r.han<t) v.push({p:1,t:`Trả ${vnd(r.tien)} cho ${r.chuTen||r.chu}`,d:`Quá hạn từ ${ngVN(r.han)} · ${r.ten}`,a:[["moChu","Mở chủ đồ",r.chu,"wine"]]});
    else if(soNgay(t,r.han)<=1) v.push({p:2,t:`Sắp đến hạn trả ${vnd(r.tien)} cho ${r.chuTen||r.chu}`,d:`Hạn ${ngVN(r.han)} · ${r.ten}`,a:[["moChu","Mở chủ đồ",r.chu]]}); });
  S.dangky.filter(x=>x.tt==="moi").forEach(x=>v.push({p:2,t:`${x.ten} muốn ký gửi ${x.brand} ${x.loai}`.trim(),d:`${x.hinh==="thue"?"Cho thuê":"Bán"} · muốn ${x.giaMuon?vnd(x.giaMuon):"chưa ghi giá"} · ${x.bangChung||""}`,a:[["nhanDK","Nhận đồ",x.id,"wine"],["tinHen","Soạn tin hẹn",x.id],["tuChoi","Từ chối",x.id]]}));
  S.mon.filter(m=>m.tt==="dang"&&m.ngayDang).forEach(m=>{ const n=soNgay(m.ngayDang,t);
    if(n>=HAN_NGAY) v.push({p:2,t:`${m.ten} đã treo ${n} ngày`,d:m.nguon==="cherie"?"Đưa vào buổi livestream xả hoặc giảm thêm":"Hết hạn ký gửi: hỏi chủ đồ giảm tiếp hay nhận lại",a:[[m.nguon==="cherie"?"mo":"tinHetHan",m.nguon==="cherie"?"Xem món":"Soạn tin chủ đồ",m.id,"wine"]]});
    else if(n>=50&&m.nguon!=="cherie") v.push({p:3,t:`${m.ten} còn ${HAN_NGAY-n} ngày hết hạn`,d:`Nhắc ${m.chuTen||m.chuDo} trước để chủ đồ chọn`,a:[["tinHetHan","Soạn tin chủ đồ",m.id]]}); });
  const cho=S.mon.filter(m=>m.tt==="cho"); if(cho.length) v.push({p:3,t:`${cho.length} món chờ chụp ảnh và đăng bán`,d:cho.slice(0,3).map(m=>m.ten).join(", ")+(cho.length>3?"…":""),a:[["goKho","Mở danh sách","cho"]]});
  const sapGiam=S.mon.filter(m=>m.tt==="dang"&&(()=>{const x=lanGiamToi(m,t);return x&&x.con<=3})()); if(sapGiam.length) v.push({p:3,t:`${sapGiam.length} món sẽ tự giảm giá trong 3 ngày tới`,d:"Gợi ý: đưa vào bài đăng hoặc livestream trước khi giảm",a:[["goKho","Xem","dang"]]});
  return v.sort((a,b)=>a.p-b.p); }
function noChuDo(){ return [...S.don.filter(d=>d.tienChuDo>0&&!d.daTra).map(d=>({k:"don",id:d.id,chu:d.chuDo,chuTen:d.chuTen,tien:d.tienChuDo,han:d.hanTra,ten:d.ten,gia:d.gia,ngay:d.ngayGiao})),
  ...S.thue.filter(x=>!x.daTra).map(x=>({k:"thue",id:x.id,chu:x.chuDo,chuTen:x.chuTen,tien:x.chiaChuDo,han:cong(x.ngay,7),ten:x.ten+" (lượt thuê)",gia:x.tien,ngay:x.ngay}))]; }
function tiemHuongDon(d){ return (d.tiemHuong||0)-(d.phiSan||0); }
function admHomNay(b){ const t=homNay(), d0=toD(t), th=t.slice(0,7);
  const dang=S.mon.filter(m=>m.tt==="dang"||m.tt==="giu"), treo=dang.reduce((s,m)=>s+giaNay(m,t),0);
  const donT=S.don.filter(d=>String(d.ngayGiao).slice(0,7)===th), thueT=S.thue.filter(x=>String(x.ngay).slice(0,7)===th);
  const huong=donT.reduce((s,d)=>s+tiemHuongDon(d),0)+thueT.reduce((s,x)=>s+x.tien-x.chiaChuDo,0);
  const no=noChuDo(), phaiTra=no.reduce((s,r)=>s+r.tien,0), qh=no.filter(r=>r.han<t).length;
  const ban30=S.don.filter(d=>soNgay(d.ngayGiao,t)<=30), st=ban30.length+dang.length?Math.round(ban30.length/(ban30.length+dang.length)*100):0;
  const ngayBan=S.don.filter(d=>d.ngayDang).map(d=>soNgay(d.ngayDang,d.ngayGiao)); const tbNgay=ngayBan.length?Math.round(ngayBan.reduce((a,b)=>a+b,0)/ngayBan.length):null;
  const viec=taoViec();
  b.innerHTML=`<div><div class="eyebrow">${THU[d0.getDay()]}, ${ngVN(t)}</div><h2 style="margin-top:4px">${viec.filter(x=>x.p===1).length?`Có ${viec.filter(x=>x.p===1).length} việc gấp cần xử lý trước`:viec.length?`${viec.length} việc hôm nay, chưa có gì quá hạn`:"Mọi việc đã xong. Kệ đang chạy tốt."}</h2></div>
  <div class="kpis">
   <div class="kpi"><span class="k">Tiệm hưởng tháng này</span><span class="v num">${vnd(huong)}</span><span class="s num">${donT.length} món bán · ${thueT.length} lượt thuê ký gửi</span></div>
   <div class="kpi"><span class="k">Đang trên kệ</span><span class="v num">${dang.length} món</span><span class="s num">Giá trị ${vnd(treo)}</span></div>
   <div class="kpi"><span class="k">Phải trả chủ đồ</span><span class="v num">${vnd(phaiTra)}</span><span class="s">${qh?`<span class="pill bad">${qh} khoản quá hạn</span>`:"Không có khoản quá hạn"}</span></div>
   <div class="kpi"><span class="k">Tỷ lệ bán 30 ngày</span><span class="v num">${st}%</span><span class="s">${tbNgay!=null?`Bán sau ${tbNgay} ngày bình quân · `:""}mục tiêu 50%</span></div>
  </div>
  <div class="two"><section class="stack"><h3>Việc cần làm</h3><div class="todo">${viec.length?viec.map(x=>`<div class="task p${x.p}"><span class="bar"></span><div><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div></div><div class="acts">${x.a.filter(Boolean).map(([a,tx,id,c])=>`<button class="btn sm ${c==="wine"?"wine":"line"}" data-a="${a}" data-id="${esc(id)}" data-v="${esc(id)}">${tx}</button>`).join("")}</div></div>`).join(""):`<div class="empty"><b>Không có việc tồn</b>Đơn mới, đăng ký ký gửi và khoản trả tiền sẽ tự hiện ở đây theo mức gấp.</div>`}</div></section>
   <section class="stack"><h3>Doanh thu tiệm hưởng 8 tuần</h3><div class="card chart">${bieuDoTuan(t)}</div>
    <h3>Tuổi hàng trên kệ</h3><div class="card stack" style="gap:10px">${tuoiHang(t)}</div>
    <h3>Kênh bán 30 ngày</h3><div class="card">${kenhBan(t)}</div></section></div>`; }
function bieuDoTuan(t){ const d=toD(t); const dow=(d.getDay()+6)%7; const monday=cong(t,-dow); const tuan=[];
  for(let i=7;i>=0;i--){ const a=cong(monday,-7*i), z=cong(a,6); const s=S.don.filter(x=>x.ngayGiao>=a&&x.ngayGiao<=z).reduce((s,x)=>s+tiemHuongDon(x),0)+S.thue.filter(x=>x.ngay>=a&&x.ngay<=z).reduce((s,x)=>s+x.tien-x.chiaChuDo,0); tuan.push({a,s}); }
  const mx=Math.max(1,...tuan.map(x=>x.s)), W=320,H=150,pad=24,bw=(W-pad)/8;
  if(!tuan.some(x=>x.s)) return `<div class="small muted" style="padding:24px 0;text-align:center">Chưa có đơn nào. Biểu đồ hiện khi ghi đơn bán đầu tiên.</div>`;
  return `<svg viewBox="0 0 ${W} ${H+28}" role="img" aria-label="Doanh thu 8 tuần">${[0,.5,1].map(k=>`<line x1="${pad}" x2="${W}" y1="${H-k*(H-10)}" y2="${H-k*(H-10)}" stroke="var(--line)" stroke-width="1"/>`).join("")}
   <text x="0" y="14" font-size="9" fill="var(--muted)">${Math.round(mx/1e6*10)/10}tr</text>
   ${tuan.map((x,i)=>{ const h=x.s/mx*(H-10), xx=pad+i*bw+bw*.18; return `<rect x="${xx}" y="${H-h}" width="${bw*.64}" height="${Math.max(h,1)}" rx="4" fill="${i===7?"var(--wine)":"var(--gold)"}"><title>Tuần ${ngNgan(x.a)}: ${vnd(x.s)}</title></rect><text x="${xx+bw*.32}" y="${H+16}" font-size="9" text-anchor="middle" fill="var(--muted)">${ngNgan(x.a)}</text>`; }).join("")}</svg>`; }
function tuoiHang(t){ const l=S.mon.filter(m=>m.tt==="dang"&&m.ngayDang).map(m=>soNgay(m.ngayDang,t)); const n=l.length;
  if(!n) return `<div class="small muted">Chưa có món đang bán.</div>`;
  const b=[["0–29 ngày",l.filter(x=>x<30).length,"var(--ok)"],["30–44 (−20%)",l.filter(x=>x>=30&&x<45).length,"var(--gold)"],["45–59 (−35%)",l.filter(x=>x>=45&&x<60).length,"var(--warn)"],["Từ 60 ngày",l.filter(x=>x>=60).length,"var(--bad)"]];
  return `<div class="aging">${b.map(([,c,col])=>c?`<span style="width:${c/n*100}%;background:${col}"></span>`:"").join("")}</div><div class="legend num">${b.map(([tx,c,col])=>`<span><i style="background:${col}"></i>${tx}: ${c}</span>`).join("")}</div>`; }
function kenhBan(t){ const l=S.don.filter(d=>soNgay(d.ngayGiao,t)<=30); if(!l.length) return `<div class="small muted">Chưa có đơn trong 30 ngày.</div>`;
  const m={}; l.forEach(d=>m[d.kenh]=(m[d.kenh]||0)+1); return `<div class="tiers num">${Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,c])=>`<div><span>${esc(k)}${k==="Shopee"?' <span class="pill warn">phí ~25%</span>':""}</span><b>${c} đơn · ${Math.round(c/l.length*100)}%</b></div>`).join("")}</div>`; }

/* ---------- Kho ---------- */
function admKho(b){ const t=homNay(), K=S.kho, q=K.q.trim().toLowerCase();
  const dem=k=>k==="all"?S.mon.length:S.mon.filter(m=>m.tt===k).length;
  let l=K.tt==="all"?S.mon.slice():S.mon.filter(m=>m.tt===K.tt);
  if(q) l=l.filter(m=>[m.ten,m.brand,m.ma,m.maGoc,m.chuDo,m.chuTen,m.mau].join(" ").toLowerCase().includes(q));
  l.sort((a,c)=>K.sort==="lau"?String(a.ngayDang||"9").localeCompare(String(c.ngayDang||"9")):K.sort==="gia"?giaNay(c,t)-giaNay(a,t):String(c.ngayNhan||"").localeCompare(String(a.ngayNhan||"")));
  const segs=[["dang","Đang bán"],["cho","Chờ đăng"],["giu","Khách giữ"],["thue","Cho thuê"],["ban","Đã bán"],["tra","Đã trả"],["all","Tất cả"]];
  b.innerHTML=`<div class="seg">${segs.map(([k,tx])=>`<button class="chip" data-a="khoTT" data-v="${k}" aria-pressed="${K.tt===k}">${tx} <span class="num muted">${dem(k)}</span></button>`).join("")}</div>
   <div class="row"><input id="khoQ" type="search" placeholder="Lọc theo tên, mã, màu, chủ đồ" style="flex:1 1 200px" value="${esc(K.q)}">
    <select id="khoSort" style="width:auto"><option value="moi">Mới nhận</option><option value="lau">Treo lâu nhất</option><option value="gia">Giá cao nhất</option></select>
    <button class="btn line sm" data-a="chonMode">${K.chonMode?"Xong":"Chọn nhiều"}</button><a class="btn wine sm" href="#qt-nhan" data-a="nhanMoi">+ Nhận đồ</a></div>
   <div class="stack" style="gap:8px">${l.length?l.map(m=>{ const n=m.ngayDang&&m.tt==="dang"?soNgay(m.ngayDang,t):null, nx=m.tt==="dang"?lanGiamToi(m,t):null, g=giaNay(m,t);
     return `<div class="irow ${K.chonMode?"":"nosel"}" role="button" tabindex="0" data-a="mo" data-id="${m.id}">${K.chonMode?`<input type="checkbox" data-a="chon" data-id="${m.id}" ${K.chon.has(m.id)?"checked":""} aria-label="Chọn">`:""}${phHtml(m)}
      <div style="min-width:0"><div class="ttl">${esc(m.ten)} ${m.vidu?'<span class="pill warn">Ví dụ</span>':""}</div><div class="sub">${pillTT(m)}<span class="pill ${m.hang}">${m.hang}</span><span>${esc(m.brand||"")}${m.size?" · "+esc(m.size):""}</span>${m.nguon!=="cherie"?`<span>· ${esc(m.chuTen||m.chuDo)}</span>`:""}
       ${n!=null?`<span class="pill ${n>=HAN_NGAY?"bad":n>=45?"warn":""}">${n} ngày</span>`:""}${!(m.anh||[]).length&&m.tt==="cho"?'<span class="pill info">Thiếu ảnh</span>':""}</div></div>
      <div class="pr num">${vnd(g)}<small>${nx?`${ngNgan(nx.ngay)} → ${vnd(Math.max(tron(m.giaDang*nx.he),m.nguon!=="cherie"?Number(m.giaSan)||0:0))}`:Number(m.giaDang)>g?"gốc "+vnd(m.giaDang):""}</small></div></div>`; }).join("")
     :`<div class="empty"><b>${q?"Không có món khớp":"Chưa có món ở mục này"}</b>${q?"Thử từ khoá khác.":"Bấm Nhận đồ để thêm món đầu tiên."}</div>`}</div>
   ${K.chonMode&&K.chon.size?`<div class="bulk"><span class="num">${K.chon.size} món đã chọn</span><button class="btn sm" data-a="bulkDang">Đăng bán</button><button class="btn sm" data-a="bulkLive">Gắn livestream</button><button class="btn sm" data-a="bulkBo">Bỏ chọn</button></div>`:""}`;
  const so=document.getElementById("khoSort"); so.value=K.sort; so.onchange=()=>{K.sort=so.value;admKho(b)};
  const qi=document.getElementById("khoQ"); qi.oninput=()=>{ K.q=qi.value; clearTimeout(admKho.t); admKho.t=setTimeout(()=>{ admKho(b); const n=document.getElementById("khoQ"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); },200); }; }
function moMon(id){ const m=S.mon.find(x=>x.id===id); if(!m) return; const t=homNay(), g=giaNay(m,t), n=m.ngayDang?soNgay(m.ngayDang,t):null, nx=m.tt==="dang"?lanGiamToi(m,t):null;
  const don=S.don.find(d=>d.monId===m.id); const r=m.nguon!=="cherie"?tyLeHH(g,m.hhRieng):null;
  const c=m.tinhTrang||{}, loi=LOI.filter(([k])=>c[k]).map(x=>x[1]);
  const acts=[]; const B=(a,tx,cls)=>acts.push(`<button class="btn sm ${cls||"line"}" data-a="${a}" data-id="${m.id}">${tx}</button>`);
  if(m.tt==="cho") m.nguon==="kyguithue"?B("vaoThue","Đưa vào kho cho thuê","wine"):B("dang","Đăng bán","wine");
  if(m.tt==="dang"||m.tt==="giu") B("ban","Ghi bán","wine");
  if(m.tt==="giu") B("boGiu","Bỏ giữ");
  if(m.tt==="thue") B("luotThue","Ghi lượt thuê","wine");
  B("sua","Sửa"); if(m.tt==="dang"&&m.nguon!=="cherie") B("tinHetHan","Soạn tin chủ đồ");
  if(m.nguon!=="cherie"&&["cho","dang","thue","giu"].includes(m.tt)) B("traDo","Trả chủ đồ");
  if(m.vidu||m.tt==="cho") B("xoa","Xoá");
  openSheet(`<div class="row"><div><div class="eyebrow">${esc(m.ma||"")} · ${NGUON[m.nguon]}</div><h2>${esc(m.ten)}</h2></div><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
   ${(m.anh||[]).length?`<div class="gal">${m.anh.map(i=>`<div class="ph" style="flex-basis:min(42%,180px)"><img src="${anh(i)}" alt=""></div>`).join("")}</div>`:`<div class="banner info">Chưa có ảnh. Bấm Sửa để thêm ảnh trước khi đăng.</div>`}
   <div class="row">${pillTT(m)}<span class="pill ${m.hang}">${HANG[m.hang].ten}</span>${m.size?`<span class="pill">Size ${esc(m.size)}</span>`:""}${m.mau?`<span class="pill">${esc(m.mau)}</span>`:""}${m.live?'<span class="pill info">Livestream</span>':""}${loi.map(x=>`<span class="pill wine">${esc(x)}</span>`).join("")}</div>
   <div class="row">${acts.join("")}</div>
   <div class="g2"><div class="card"><b>Giá</b><div class="breakdown num">
     ${Number(m.giaNiemYet)?`<div><span>Giá niêm yết hãng</span><span>${vnd(m.giaNiemYet)}</span></div>`:""}
     <div><span>Giá đăng gốc</span><span>${vnd(m.giaDang)}</span></div>
     ${n!=null?`<div><span>Đã treo ${n} ngày</span><span>${heSo(n)<1?"−"+Math.round((1-heSo(n))*100)+"%":"chưa giảm"}</span></div>`:""}
     ${Number(m.giaSan)?`<div><span>Giá sàn chủ đồ</span><span>${vnd(m.giaSan)}</span></div>`:""}
     ${r!=null?`<div><span>Phí ${Math.round(r*1000)/10}% · chủ đồ nhận</span><span>${vnd(g-Math.round(g*r))}</span></div>`:""}
     <div><span>${don?"Đã bán":"Giá hiện tại"}</span><span>${vnd(don?don.gia:g)}</span></div></div>
     ${nx?`<p class="small muted" style="margin:8px 0 0">Ngày ${ngVN(nx.ngay)} (còn ${nx.con} ngày) tự giảm còn ${vnd(Math.max(tron(m.giaDang*nx.he),m.nguon!=="cherie"?Number(m.giaSan)||0:0))}.</p>`:""}</div>
    <div class="card stack" style="gap:8px"><b>${m.nguon==="cherie"?"Nguồn":"Chủ đồ"}</b>${m.nguon==="cherie"?`<div class="small">Mã đồ tổ hợp: ${esc(m.maGoc||"—")}<br>Đã thuê: ${esc(m.soLuot||0)} lượt</div>`:`<div class="small">${esc(m.chuTen||"")} · <span class="num">${esc(m.chuDo)}</span><br>Bằng chứng: ${esc(m.bangChung||"—")}</div><button class="btn sm line" data-a="moChu" data-v="${esc(m.chuDo)}">Mở hồ sơ chủ đồ</button>`}
     <b>Lịch sử</b><div class="tl">${(m.lichSu||[{n:m.ngayNhan,v:"Nhận đồ"}]).slice().reverse().map(x=>`<div><small class="num">${ngVN(x.n)}</small>${esc(x.v)}</div>`).join("")}</div></div></div>
   ${m.moTa?`<div class="card"><b>Mô tả cho khách</b><p style="margin:6px 0 0">${esc(m.moTa)}</p></div>`:""}`); }

/* ---------- Nhận đồ: trình hướng dẫn 5 bước ---------- */
function wizMoi(pre){ S.W={buoc:1,id:null,files:[],ai:"",d:Object.assign({nguon:"cherie",hang:"B",tinhTrang:{},anh:[]},pre||{})}; }
function veWizard(){ if(!S.W) wizMoi(); const W=S.W, d=W.d, b=document.getElementById("aBody");
  const ten=["Nguồn đồ","Thông tin","Tình trạng & ảnh","Định giá","Xem lại"];
  b.innerHTML=`<div id="wiz" class="stack" style="max-width:760px;width:100%">
   <div><div class="eyebrow">${W.id?"Sửa món "+esc(d.ma||""):"Bước "+W.buoc+" / 5"}</div><h2 style="margin-top:4px">${ten[W.buoc-1]}</h2></div>
   <div class="wiz">${[1,2,3,4,5].map(i=>`<span class="${i<=W.buoc?"on":""}"></span>`).join("")}</div>
   <div id="wb" class="stack"></div>
   <div class="row" style="justify-content:space-between">${W.buoc>1?`<button class="btn line" data-a="wLui">Quay lại</button>`:`<span></span>`}
    ${W.buoc<5?`<button class="btn wine" data-a="wTiep">Tiếp tục</button>`:`<div class="row"><button class="btn line" data-a="wLuu" data-v="cho">Lưu, đăng sau</button><button class="btn wine" data-a="wLuu" data-v="dang" ${(d.anh||[]).length&&d.giaDang?"":"disabled"}>Lưu và đăng bán</button></div>`}</div></div>`;
  const wb=document.getElementById("wb");
  if(W.buoc===1){
    wb.innerHTML=`<div class="choose">${Object.entries({cherie:["Đầm CHÉRIE","Hết vòng đời thuê hoặc lỗi mốt"],kygui:["Ký gửi bán","Đồ của khách, hưởng hoa hồng"],kyguithue:["Ký gửi cho thuê","Vào kho thuê, chia 50/50"]}).map(([k,[a,s]])=>`<button data-a="wNguon" data-v="${k}" aria-pressed="${d.nguon===k}"><b>${a}</b><span>${s}</span></button>`).join("")}</div>
     ${d.nguon!=="cherie"?`<div class="card stack"><b>Chủ đồ</b><div class="g2"><label class="f">Số Zalo<input id="wSdt" inputmode="tel" value="${esc(d.chuDo||"")}" list="dsChu"></label><label class="f">Tên<input id="wChuTen" value="${esc(d.chuTen||"")}"></label></div>
       <datalist id="dsChu">${dsChuDo().map(c=>`<option value="${esc(c.sdt)}">${esc(c.ten)}</option>`).join("")}</datalist><div id="wChuInfo" class="small muted"></div>
       <label class="f">Bằng chứng mua<select id="wBC">${["Hóa đơn","Còn tag","Ảnh đơn hàng online","Chưa có"].map(x=>`<option ${d.bangChung===x?"selected":""}>${x}</option>`).join("")}</select></label></div>`
     :`<div class="card"><label class="f">Mã đồ trong tổ hợp (để nối với kho Thuê đầm)<input id="wMaGoc" placeholder="CH-PR-001-S" value="${esc(d.maGoc||"")}"></label></div>`}`;
    const s=document.getElementById("wSdt"); if(s){ const show=()=>{ const c=dsChuDo().find(x=>x.sdt===sdt(s.value)); document.getElementById("wChuInfo").innerHTML=c?`Khách cũ · ${c.mon.length} món đã gửi${c.no?` · đang chờ nhận ${vnd(c.no)}`:""}`:(sdt(s.value).length>=9?"Chủ đồ mới":""); if(c&&!val("wChuTen")) document.getElementById("wChuTen").value=c.ten||""; }; s.oninput=show; show(); }
  }
  if(W.buoc===2){
    wb.innerHTML=`<div class="g2"><label class="f">Tên món<input id="wTen" value="${esc(d.ten||"")}" placeholder="Pivoine Noire, Túi Coach Tabby…"></label><label class="f">Thương hiệu<input id="wBrand" value="${esc(d.brand||"")}" list="dsBrand"></label>
     <label class="f">Loại<input id="wLoai" value="${esc(d.loai||"")}" placeholder="Đầm xoè, đầm midi, túi…"></label><label class="f">Size<input id="wSize" value="${esc(d.size||"")}"></label>
     <label class="f">Màu<input id="wMau" value="${esc(d.mau||"")}"></label><label class="f">Chất liệu<input id="wCL" value="${esc(d.chatLieu||"")}"></label>
     <label class="f">${d.nguon==="cherie"?"Số lượt đã cho thuê":"Số lần chủ đồ đã mặc"}<input id="wLuot" inputmode="numeric" value="${esc(d.soLuot??"")}"></label></div>
     <datalist id="dsBrand">${[...new Set(S.mon.map(m=>m.brand).filter(Boolean).concat(["SIXDO","D.CHIC","Elise","NEM","Chanel","Dior","Coach","Gucci","Louis Vuitton","Zara"]))].map(x=>`<option value="${esc(x)}">`).join("")}</datalist>`; }
  if(W.buoc===3){ const c=d.tinhTrang||{}, gy=hangGoiY(c,d.soLuot);
    wb.innerHTML=`<div class="stack"><b>Kiểm tra tình trạng</b><div class="checks">${TOT.concat(LOI).map(([k,tx])=>`<label><input type="checkbox" data-tt="${k}" ${c[k]?"checked":""}>${tx}</label>`).join("")}</div>
     <label class="f">Ghi rõ lỗi cho khách thấy (nếu có)<input id="wLoi" value="${esc(d.loi||"")}"></label></div>
     <div class="card stack" style="gap:8px"><div class="row"><b>Hạng</b><span class="small muted">Gợi ý theo checklist: <b>${HANG[gy].ten}</b>${d.hang!==gy?` <button class="btn sm line" data-a="wHang" data-v="${gy}">Dùng gợi ý</button>`:""}</span></div>
      <div class="chips">${Object.entries(HANG).map(([k,h])=>`<button class="chip" data-a="wHang" data-v="${k}" aria-pressed="${d.hang===k}">${h.ten} · ${h.mo}</button>`).join("")}</div></div>
     <div class="stack"><b>Ảnh (1 ảnh mặc thật + 4 ảnh tình trạng)</b><div class="thumbs" id="wThumbs"></div>
      ${S.assets?`<label class="drop">Bấm để chụp hoặc chọn ảnh<input type="file" id="wFile" accept="image/*" multiple></label>`:`<div class="banner">Chỉ người có quyền Editor mới tải ảnh lên được.</div>`}</div>
     ${S.sample&&S.aiImg?`<div class="ai"><div class="row"><b>Trợ lý AI xem ảnh</b><span class="small muted">Nhận diện lỗi, đề xuất hạng, viết mô tả</span><button class="btn sm" data-a="aiAnh" ${W.files.length?"":"disabled"}>${W.files.length?"Phân tích "+Math.min(W.files.length,4)+" ảnh":"Thêm ảnh để dùng"}</button></div><div id="aiOut" class="small">${esc(W.ai)}</div></div>`:""}`;
    veThumbs();
    const fi=document.getElementById("wFile"); if(fi) fi.onchange=async()=>{ for(const f of [...fi.files].slice(0,8)){ try{ toast("Đang tải ảnh…"); const bl=await nenAnh(f); const r=await S.assets.upload(bl,{type:"image/jpeg"}); d.anh.push(r.id); W.files.push(bl); veThumbs(); }catch(e){ toast(e&&e.code==="too_large"?"Ảnh quá lớn.":"Chưa tải được ảnh, thử lại."); } } fi.value=""; veWizard(); };
    wb.querySelectorAll("[data-tt]").forEach(x=>x.onchange=()=>{ d.tinhTrang[x.dataset.tt]=x.checked; d.loi=val("wLoi"); veWizard(); }); }
  if(W.buoc===4){ const ky=d.nguon!=="cherie";
    wb.innerHTML=`<div class="g2"><label class="f">Giá niêm yết hãng${ky?" / giá chủ đồ mua":""}<input id="wNY" inputmode="numeric" value="${d.giaNiemYet||""}"></label>
      <label class="f">Giá sale chính hãng hiện tại (nếu có)<input id="wSale" inputmode="numeric" value="${d.giaSale||""}"></label>
      <label class="f">Giá đăng bán${d.nguon==="kyguithue"?" (để trống nếu chỉ cho thuê)":""}<input id="wGia" inputmode="numeric" value="${d.giaDang||""}"></label>
      ${ky?`<label class="f">Giá sàn chủ đồ<input id="wSan" inputmode="numeric" value="${d.giaSan||""}"></label><label class="f">Hoa hồng riêng (luxury, ví dụ 0,18; trống = theo bậc)<input id="wHH" inputmode="decimal" value="${d.hhRieng??""}"></label>`:""}</div>
     <div class="card" id="wGiaKq"></div>
     <div class="stack"><label class="f">Mô tả cho khách<textarea id="wMoTa">${esc(d.moTa||"")}</textarea></label>
      ${S.sample?`<div class="row"><button class="btn sm soft" data-a="aiMoTa">✦ AI viết mô tả</button><span class="small muted" id="aiMoTaSt"></span></div>`:""}</div>`;
    const tinh=()=>{ luuBuoc(); const k=document.getElementById("wGiaKq"), g=Number(d.giaDang)||0;
      if(d.nguon==="cherie"){ const gy=giaGoiY(d); k.innerHTML=d.giaNiemYet?`<div class="breakdown num"><div><span>${HANG[d.hang].ten}: ${Math.round(HANG[d.hang].pct*100)}% × ${vnd(d.giaNiemYet)}</span><span>${vnd(tron(d.giaNiemYet*HANG[d.hang].pct))}</span></div>${d.giaSale?`<div><span>Trần 70% giá sale ${vnd(d.giaSale)}</span><span>${vnd(tron(d.giaSale*TRAN_SALE))}</span></div>`:""}<div><span>Giá gợi ý</span><span>${vnd(gy)}</span></div></div>
        <div class="row" style="margin-top:8px">${g!==gy?`<button class="btn sm wine" data-a="wDungGY" data-v="${gy}">Dùng ${vnd(gy)}</button>`:'<span class="pill ok">Đang dùng giá gợi ý</span>'}<span class="small muted">Lịch tự giảm: ngày 30 còn ${vnd(tron((g||gy)*.8))}, ngày 45 còn ${vnd(tron((g||gy)*.65))}</span></div>`:`<span class="small muted">Nhập giá niêm yết để tính giá gợi ý.</span>`; }
      else { const r=tyLeHH(g,d.hhRieng),h=Math.round(g*r); k.innerHTML=g?(g<GIA_TOI_THIEU?`<span class="pill warn">Dưới giá tối thiểu ${vnd(GIA_TOI_THIEU)}</span>`:`<div class="breakdown num"><div><span>Phí ${Math.round(r*1000)/10}%</span><span>${vnd(h)}</span></div><div><span>Ngày 30 / 45 tự giảm còn</span><span>${vnd(Math.max(tron(g*.8),d.giaSan||0))} / ${vnd(Math.max(tron(g*.65),d.giaSan||0))}</span></div><div><span>Chủ đồ nhận nếu bán giá đăng</span><span>${vnd(g-h)}</span></div></div>${d.giaSan&&d.giaSan>g?'<span class="pill bad">Giá sàn cao hơn giá đăng</span>':""}`)
        :(d.nguon==="kyguithue"?`Mỗi lượt thuê chia ${CHIA_THUE*100}% cho chủ đồ.`:`<span class="small muted">Nhập giá đăng bán.</span>`); } };
    ["wNY","wSale","wGia","wSan","wHH"].forEach(i=>{ const e=document.getElementById(i); if(e) e.oninput=tinh; }); tinh(); }
  if(W.buoc===5){ const g=Number(d.giaDang)||0;
    wb.innerHTML=`<div class="card" style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px">${phHtml(d)}<div class="stack" style="gap:6px"><b style="font-size:17px">${esc(d.ten||"(chưa đặt tên)")}</b>
     <div class="row"><span class="pill ${d.hang}">${HANG[d.hang].ten}</span><span class="pill">${NGUON[d.nguon]}</span>${d.size?`<span class="pill">Size ${esc(d.size)}</span>`:""}</div>
     <div class="small muted">${esc(d.brand||"")}${d.mau?" · "+esc(d.mau):""}${d.chuDo?" · Chủ đồ "+esc(d.chuTen||"")+" "+esc(d.chuDo):""}</div>
     <div class="num"><b>${g?vnd(g):"Chưa có giá"}</b>${d.giaNiemYet?` <s class="muted small">${vnd(d.giaNiemYet)}</s>`:""}</div><div class="small muted">${(d.anh||[]).length} ảnh</div></div></div>
     ${!(d.anh||[]).length?`<div class="banner">Chưa có ảnh: món sẽ lưu ở "Chờ đăng".</div>`:""}${!d.ten?`<div class="banner bad">Cần tên món (bước 2).</div>`:""}
     ${d.nguon!=="cherie"&&sdt(d.chuDo).length<9?`<div class="banner bad">Cần số Zalo chủ đồ (bước 1).</div>`:""}`; }
}
function veThumbs(){ const el=document.getElementById("wThumbs"); if(!el) return; const d=S.W.d; el.innerHTML=(d.anh||[]).map((a,i)=>`<div class="t"><div class="ph"><img src="${anh(a)}" alt="Ảnh ${i+1}"></div><button type="button" data-a="wBoAnh" data-v="${i}" aria-label="Bỏ ảnh">×</button></div>`).join("")||`<span class="small muted">Chưa có ảnh.</span>`; }
function luuBuoc(){ const W=S.W; if(!W) return; const d=W.d, g=id=>document.getElementById(id);
  if(g("wSdt")){ d.chuDo=sdt(val("wSdt")); d.chuTen=val("wChuTen").trim(); d.bangChung=val("wBC"); }
  if(g("wMaGoc")) d.maGoc=val("wMaGoc").trim();
  if(g("wTen")){ d.ten=val("wTen").trim(); d.brand=val("wBrand").trim(); d.loai=val("wLoai").trim(); d.size=val("wSize").trim(); d.mau=val("wMau").trim(); d.chatLieu=val("wCL").trim(); d.soLuot=tien(val("wLuot")); }
  if(g("wLoi")) d.loi=val("wLoi").trim();
  if(g("wNY")){ d.giaNiemYet=tien(val("wNY")); d.giaSale=tien(val("wSale")); d.giaDang=tien(val("wGia")); if(g("wSan")){ d.giaSan=tien(val("wSan")); const h=String(val("wHH")).replace(",",".").trim(); d.hhRieng=h===""?null:Number(h); } }
  if(g("wMoTa")) d.moTa=val("wMoTa").trim(); }
async function nenAnh(file){ try{ const bmp=await createImageBitmap(file); const k=Math.min(1,1400/Math.max(bmp.width,bmp.height)); const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k); c.getContext("2d").drawImage(bmp,0,0,c.width,c.height); const b=await new Promise(r=>c.toBlob(r,"image/jpeg",.84)); return b||file; }catch(e){ return file; } }
async function luuWizard(dang){ luuBuoc(); const W=S.W, d=W.d;
  if(!d.ten){ W.buoc=2; veWizard(); toast("Cần tên món."); return; }
  if(d.nguon!=="cherie"&&sdt(d.chuDo).length<9){ W.buoc=1; veWizard(); toast("Cần số Zalo chủ đồ."); return; }
  if(d.nguon==="kygui"&&d.giaDang&&d.giaDang<GIA_TOI_THIEU){ W.buoc=4; veWizard(); toast("Giá đồ ký gửi cần từ "+vnd(GIA_TOI_THIEU)+"."); return; }
  const data=Object.assign({},d); delete data.dangkyId;
  if(d.nguon==="cherie"){ data.chuDo=""; data.chuTen=""; data.giaSan=0; data.hhRieng=null; }
  try{
    if(W.id){ const m=S.mon.find(x=>x.id===W.id)||{}; data.lichSu=lichSu(m,"Sửa thông tin"); await S.db.doc("mon/"+W.id).update(data); toast("Đã lưu thay đổi."); }
    else{ const t=homNay(); data.ma=taoMa(data); data.ngayNhan=t; data.lichSu=[{n:t,v:"Nhận đồ"+(d.nguon!=="cherie"?" từ "+(d.chuTen||d.chuDo):"")}];
      if(dang&&d.nguon==="kyguithue"){ data.tt="thue"; data.ngayDang=""; data.lichSu.push({n:t,v:"Vào kho cho thuê"}); }
      else if(dang){ data.tt="dang"; data.ngayDang=t; data.lichSu.push({n:t,v:"Đăng bán "+vnd(d.giaDang)}); } else { data.tt="cho"; data.ngayDang=""; }
      await S.db.collection("mon").add(data); if(d.dangkyId) await S.db.doc("dangky/"+d.dangkyId).update({tt:"danhan"});
      toast("Đã lưu "+data.ma+(dang?" và đăng bán.":".")); }
    S.W=null; S.kho.tt=dang?(d.nguon==="kyguithue"?"thue":"dang"):"cho"; location.hash="qt-kho";
  }catch(e){ loiGhi(e); } }
function taoMa(d){ const t=homNay().replace(/-/g,"").slice(2), r=Math.random().toString(36).slice(2,5).toUpperCase();
  if(d.nguon==="cherie") return d.maGoc?"SC-"+d.maGoc:"SC-"+t+"-"+r; return (d.nguon==="kygui"?"KG-":"KT-")+t+"-"+String(d.chuDo||"").slice(-4)+r.slice(0,2); }
/* ---------- Trợ lý AI ---------- */
async function aiAnh(btn){ const W=S.W, out=document.getElementById("aiOut"); btn.disabled=true; out.textContent="Đang xem ảnh…";
  try{ const imgs=W.files.slice(0,4); const r=await S.sample.json(`Bạn là chuyên viên kiểm đồ secondhand của tiệm CHÉRIE Seconde. Ảnh là một món thời trang (${W.d.brand||"chưa rõ hãng"}, ${W.d.loai||"chưa rõ loại"}). Hãy nhìn ảnh và trả lời CHỈ bằng JSON:
{"loi":["vet"|"sut"|"phai"|"xu"|"cuc"|"mui"], "hang":"A"|"B"|"C", "ghiChuLoi":"lỗi nhìn thấy, tiếng Việt, ngắn, rỗng nếu không có", "mau":"màu chính", "loai":"kiểu dáng", "moTa":"2 câu tiếng Việt mô tả cho khách, giọng sang, không phóng đại"}
Mã lỗi: vet=vết bẩn, sut=sút chỉ, phai=phai màu, xu=xù sờn, cuc=thiếu cúc/hỏng khoá, mui=ố vàng. Hạng A: như mới không lỗi; B: đã mặc còn đẹp; C: có lỗi thấy được. Chỉ ghi lỗi thật sự thấy trong ảnh.`,{images:imgs,modelTier:"default"});
    const d=W.d; (Array.isArray(r.loi)?r.loi:[]).forEach(k=>{ if(LOI.some(x=>x[0]===k)) d.tinhTrang[k]=true; });
    if(r.ghiChuLoi&&!d.loi) d.loi=String(r.ghiChuLoi); if(r.mau&&!d.mau) d.mau=String(r.mau); if(r.loai&&!d.loai) d.loai=String(r.loai); if(r.moTa&&!d.moTa) d.moTa=String(r.moTa);
    if(["A","B","C"].includes(r.hang)) d.hang=r.hang;
    W.ai=`AI đề xuất ${HANG[d.hang]?HANG[d.hang].ten:""}${r.ghiChuLoi?" · "+r.ghiChuLoi:" · không thấy lỗi"}. Đã điền checklist, màu, mô tả. Hãy kiểm lại bằng mắt trước khi lưu.`;
    veWizard();
  }catch(e){ out.textContent=aiLoi(e); btn.disabled=false; } }
async function aiMoTa(btn){ luuBuoc(); const d=S.W.d, st=document.getElementById("aiMoTaSt"), ta=document.getElementById("wMoTa"); btn.disabled=true; st.textContent="Đang viết…";
  const c=d.tinhTrang||{}; const tt=TOT.filter(([k])=>c[k]).map(x=>x[1]).concat(LOI.filter(([k])=>c[k]).map(x=>x[1])).join(", ");
  try{ const {text}=await S.sample(`Viết mô tả sản phẩm cho cửa hàng secondhand CHÉRIE Seconde (giọng sang, quyến rũ, không sến, không phóng đại, tiếng Việt, 2–3 câu, không dùng emoji, không nhắc giá). Nêu dáng, chất liệu, dịp mặc phù hợp, và nói thật về tình trạng.
Thông tin: tên "${d.ten||""}", hãng ${d.brand||""}, loại ${d.loai||""}, màu ${d.mau||""}, chất liệu ${d.chatLieu||""}, size ${d.size||""}, ${HANG[d.hang].ten} (${HANG[d.hang].mo}). Tình trạng: ${tt||"không ghi"}. Lỗi: ${d.loi||"không"}.
Chỉ trả về đoạn mô tả.`,{modelTier:"quick",onText:({text})=>{ ta.value=text; }});
    ta.value=text.trim(); d.moTa=ta.value; st.textContent="Đã viết, sửa lại nếu cần."; }catch(e){ st.textContent=aiLoi(e); } btn.disabled=false; }
function aiLoi(e){ const c=e&&e.code; return c==="not_granted"||c==="sampling_disabled"?"Trợ lý AI chưa được cho phép trên trang này.":c==="rate_limited"?"Đang dùng nhiều, thử lại sau ít phút.":c==="image_rejected"?"Ảnh không đọc được, thử ảnh khác.":"Chưa nhận được kết quả, thử lại."; }

/* ---------- Đơn ---------- */
function admDon(b){ const D=S.don2||(S.don2={seg:"giu"}), t=homNay(), th=t.slice(0,7);
  const giu=S.dathang.filter(x=>x.tt==="moi").sort((a,c)=>String(a.gio).localeCompare(String(c.gio)));
  const ban=S.don.slice().sort((a,c)=>String(c.ngayGiao).localeCompare(String(a.ngayGiao)));
  const banT=ban.filter(d=>String(d.ngayGiao).slice(0,7)===th);
  b.innerHTML=`<div class="seg"><button class="chip" data-a="donSeg" data-v="giu" aria-pressed="${D.seg==="giu"}">Khách đang giữ <span class="num muted">${giu.length}</span></button><button class="chip" data-a="donSeg" data-v="ban" aria-pressed="${D.seg==="ban"}">Đã bán <span class="num muted">${ban.length}</span></button></div>
  ${D.seg==="giu"?(giu.length?`<div class="stack" style="gap:10px">${giu.map(x=>{ const h=soGio(x.gio); return `<div class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between"><div><b>${esc(x.ten)}</b> <span class="muted num">${esc(x.sdt)}</span><div class="small muted">${esc(x.noi||"")}${x.ghiChu?" · "+esc(x.ghiChu):""}</div></div><span class="pill ${h>=24?"bad":"warn"} num">${h<1?"Vừa đặt":h+" giờ"}</span></div>
     ${(x.items||[]).map(i=>{const m=S.mon.find(y=>y.id===i.monId)||{ten:i.ten};return `<div class="cline">${phHtml(m)}<div><div style="font-weight:600">${esc(i.ten)}</div><div class="small muted">${esc(i.ma)}</div></div><b class="num">${vnd(i.gia)}</b></div>`}).join("")}
     <div class="row" style="justify-content:space-between"><b class="num">Tổng ${vnd(x.tong)}</b><div class="row"><button class="btn sm line" data-a="tinKhach" data-id="${x.id}">Soạn tin Zalo</button><button class="btn sm line" data-a="boDat" data-id="${x.id}">Bỏ giữ</button><button class="btn sm wine" data-a="chot" data-id="${x.id}">Chốt đơn</button></div></div></div>`; }).join("")}</div>`
    :`<div class="empty"><b>Không có khách đang giữ</b>Khách đặt trên cửa hàng sẽ hiện ở đây, kèm số giờ đã giữ.</div>`)
  :(ban.length?`<div class="kpis"><div class="kpi"><span class="k">Bán tháng này</span><span class="v num">${banT.length} món</span></div><div class="kpi"><span class="k">Khách trả</span><span class="v num">${vnd(banT.reduce((s,d)=>s+d.gia,0))}</span></div><div class="kpi"><span class="k">Tiệm hưởng</span><span class="v num">${vnd(banT.reduce((s,d)=>s+tiemHuongDon(d),0))}</span></div><div class="kpi"><span class="k">Phần chủ đồ</span><span class="v num">${vnd(banT.reduce((s,d)=>s+(d.tienChuDo||0),0))}</span></div></div>
    <div class="tbl"><table><thead><tr><th>Ngày</th><th>Món</th><th>Kênh</th><th class="r">Khách trả</th><th class="r">Tiệm hưởng</th></tr></thead><tbody>${ban.slice(0,100).map(d=>`<tr><td class="num">${ngVN(d.ngayGiao)}</td><td>${esc(d.ten)}<div class="small muted">${esc(d.ma)}</div></td><td>${esc(d.kenh)}</td><td class="r num">${vnd(d.gia)}</td><td class="r num">${vnd(tiemHuongDon(d))}</td></tr>`).join("")}</tbody></table></div>`
    :`<div class="empty"><b>Chưa có đơn bán</b>Đơn ghi từ Kho hoặc khi chốt khách giữ sẽ hiện ở đây.</div>`)}`; }
function moChot(datId){ const x=S.dathang.find(y=>y.id===datId); if(!x) return;
  openSheet(`<div class="row"><h2>Chốt đơn · ${esc(x.ten)}</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
   <form id="fChot" class="stack"><div class="g2"><label class="f">Kênh<select id="cKenh">${KENH.filter(k=>k!=="Thuê rồi mua").map(k=>`<option>${k}</option>`).join("")}</select></label><label class="f">Ngày giao<input id="cNgay" type="date" value="${homNay()}"></label></div>
   ${(x.items||[]).map((i,n)=>`<label class="f">${esc(i.ten)} · giá khách trả<input id="cGia${n}" inputmode="numeric" value="${i.gia}"></label>`).join("")}
   <div class="banner small">Đã nhận chuyển khoản VietQR trước khi chốt. Đồ ký gửi tự tạo khoản trả chủ đồ với hạn trả.</div><button class="btn wine" type="submit">Chốt và ghi bán</button></form>`);
  document.getElementById("fChot").addEventListener("submit",async ev=>{ ev.preventDefault(); const kenh=val("cKenh"), ngay=val("cNgay")||homNay();
    try{ for(const [n,i] of (x.items||[]).entries()){ const m=S.mon.find(y=>y.id===i.monId); if(!m) continue; await ghiBan(m,tien(val("cGia"+n))||i.gia,kenh,ngay,x.sdt,0); }
      await S.db.doc("dathang/"+x.id).update({tt:"chot"}); closeSheet(); toast("Đã chốt đơn của "+x.ten+"."); }catch(e){ loiGhi(e); } }); }
async function ghiBan(m,gia,kenh,ngay,khach,thueDaTra){ const phi=kenh==="Shopee"?Math.round(gia*PHI_SHOPEE):0; let hh=gia,chu=0; if(m.nguon!=="cherie"){ hh=Math.round(gia*tyLeHH(gia,m.hhRieng)); chu=gia-hh; }
  await S.db.collection("don").add({monId:m.id,ma:m.ma||"",ten:m.ten,nguon:m.nguon,gia,kenh,ngayGiao:ngay,ngayDang:m.ngayDang||"",khach:khach||"",tiemHuong:hh,phiSan:phi,chuDo:m.chuDo||"",chuTen:m.chuTen||"",tienChuDo:chu,hanTra:chu?hanTra(ngay):"",daTra:false,ngayTraTien:"",tienThueDaTra:thueDaTra||0});
  await S.db.doc("mon/"+m.id).update({tt:"ban",ngayBan:ngay,lichSu:lichSu(m,`Bán ${vnd(gia)} qua ${kenh}`)}); }
function moBan(id){ const m=S.mon.find(x=>x.id===id); if(!m) return; const t=homNay(), g=giaNay(m,t);
  openSheet(`<div class="row"><h2>Ghi bán · ${esc(m.ten)}</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
  <form id="fBan" class="stack"><div class="g2"><label class="f">Giá khách trả<input id="bGia" inputmode="numeric" value="${g}"></label><label class="f">Kênh<select id="bKenh">${KENH.filter(k=>k!=="Thuê rồi mua"||m.nguon==="cherie").map(k=>`<option>${k}</option>`).join("")}</select></label>
   <label class="f">Ngày giao<input id="bNgay" type="date" value="${t}"></label><label class="f">Số Zalo khách<input id="bSdt" inputmode="tel"></label><label class="f" id="bThueW" hidden>Tiền thuê khách đã trả<input id="bThue" inputmode="numeric"></label></div>
  <div id="bKq" class="card"></div><button class="btn wine" type="submit">Lưu đơn bán</button></form>`);
  const tinh=()=>{ const gia=tien(val("bGia")),k=val("bKenh"),phi=k==="Shopee"?Math.round(gia*PHI_SHOPEE):0; document.getElementById("bThueW").hidden=k!=="Thuê rồi mua"; let s="";
    if(m.nguon==="cherie") s=`<div class="breakdown num"><div><span>Khách trả</span><span>${vnd(gia)}</span></div>${phi?`<div><span>Phí Shopee ~25,3%</span><span>−${vnd(phi)}</span></div>`:""}<div><span>Tiệm thực nhận</span><span>${vnd(gia-phi)}</span></div></div>`;
    else { const r=tyLeHH(gia,m.hhRieng),h=Math.round(gia*r); s=`<div class="breakdown num"><div><span>Hoa hồng ${Math.round(r*1000)/10}%</span><span>${vnd(h)}</span></div>${phi?`<div><span>Phí Shopee (tiệm chịu)</span><span>−${vnd(phi)}</span></div>`:""}<div><span>Trả chủ đồ trước ${ngVN(hanTra(val("bNgay")||t))}</span><span>${vnd(gia-h)}</span></div></div>${Number(m.giaSan)>0&&gia<m.giaSan?`<span class="pill bad">Thấp hơn giá sàn ${vnd(m.giaSan)}</span>`:""}`; }
    document.getElementById("bKq").innerHTML=s; };
  document.getElementById("bThue").oninput=()=>{ document.getElementById("bGia").value=Math.max(0,tron(m.giaNiemYet*THUE_ROI_MUA)-tien(val("bThue"))); tinh(); };
  ["bGia","bKenh","bNgay"].forEach(i=>document.getElementById(i).oninput=tinh); tinh();
  document.getElementById("fBan").addEventListener("submit",async ev=>{ ev.preventDefault(); const gia=tien(val("bGia")); if(!gia){ toast("Nhập giá bán."); return; }
    try{ await ghiBan(m,gia,val("bKenh"),val("bNgay")||t,sdt(val("bSdt")),tien(val("bThue"))); for(const d of S.dathang.filter(x=>x.tt==="moi"&&(x.items||[]).some(i=>i.monId===m.id))) await S.db.doc("dathang/"+d.id).update({tt:"chot"}); closeSheet(); toast("Đã ghi bán "+vnd(gia)+"."); }catch(e){ loiGhi(e); } }); }
function moLuotThue(id){ const m=S.mon.find(x=>x.id===id); if(!m) return;
  openSheet(`<div class="row"><h2>Ghi lượt thuê · ${esc(m.ten)}</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
  <form id="fThue" class="stack"><div class="g2"><label class="f">Ngày khách trả đầm<input id="tNgay" type="date" value="${homNay()}"></label><label class="f">Tiền thuê khách trả<input id="tTien" inputmode="numeric"></label></div><div id="tKq" class="small"></div><button class="btn wine" type="submit">Lưu lượt thuê</button></form>`);
  const tinh=()=>{ const x=tien(val("tTien")); document.getElementById("tKq").innerHTML=x?`Chủ đồ nhận <b>${vnd(Math.round(x*CHIA_THUE))}</b> trong 7 ngày · tiệm giữ ${vnd(x-Math.round(x*CHIA_THUE))}`:""; }; document.getElementById("tTien").oninput=tinh;
  document.getElementById("fThue").addEventListener("submit",async ev=>{ ev.preventDefault(); const x=tien(val("tTien")); if(!x){ toast("Nhập tiền thuê."); return; }
    try{ await S.db.collection("thue").add({monId:m.id,ma:m.ma||"",ten:m.ten,chuDo:m.chuDo,chuTen:m.chuTen||"",ngay:val("tNgay")||homNay(),tien:x,chiaChuDo:Math.round(x*CHIA_THUE),daTra:false,ngayTraTien:""});
      await S.db.doc("mon/"+m.id).update({soLuot:(Number(m.soLuot)||0)+1,lichSu:lichSu(m,"Lượt thuê "+vnd(x))}); closeSheet(); toast("Đã ghi lượt thuê."); }catch(e){ loiGhi(e); } }); }

/* ---------- Chủ đồ ---------- */
function dsChuDo(){ const map={}; const add=(s,ten)=>{ if(!s) return null; map[s]=map[s]||{sdt:s,ten:"",mon:[],dk:[],no:0,qh:0,da:0}; if(ten&&!map[s].ten) map[s].ten=ten; return map[s]; };
  S.mon.filter(m=>m.chuDo).forEach(m=>add(m.chuDo,m.chuTen).mon.push(m)); S.dangky.forEach(x=>add(x.sdt,x.ten).dk.push(x));
  const t=homNay(); noChuDo().forEach(r=>{ const c=add(r.chu,r.chuTen); c.no+=r.tien; if(r.han<t) c.qh++; });
  S.don.filter(d=>d.daTra&&d.tienChuDo).forEach(d=>add(d.chuDo,d.chuTen).da+=d.tienChuDo); S.thue.filter(x=>x.daTra).forEach(x=>add(x.chuDo,x.chuTen).da+=x.chiaChuDo);
  return Object.values(map).sort((a,b)=>b.qh-a.qh||b.no-a.no||b.mon.length-a.mon.length); }
function admChu(b){ const moi=S.dangky.filter(x=>x.tt==="moi"), l=dsChuDo().filter(c=>c.mon.length||c.dk.some(x=>x.tt!=="tuchoi")), tong=l.reduce((s,c)=>s+c.no,0);
  b.innerHTML=`${moi.length?`<section class="stack"><h3>Đăng ký mới <span class="pill wine">${moi.length}</span></h3>${moi.map(x=>`<div class="task p2"><span class="bar"></span><div><div class="t">${esc(x.ten)} · ${esc(x.brand)} ${esc(x.loai)}</div><div class="d num">${esc(x.sdt)} · ${x.hinh==="thue"?"Cho thuê":"Bán"} · muốn ${x.giaMuon?vnd(x.giaMuon):"—"} · sàn ${x.giaSan?vnd(x.giaSan):"—"} · ${esc(x.bangChung||"")}${x.moTa?" · "+esc(x.moTa):""}</div></div>
    <div class="acts"><button class="btn sm wine" data-a="nhanDK" data-id="${x.id}">Nhận đồ</button><button class="btn sm line" data-a="tinHen" data-id="${x.id}">Soạn tin hẹn</button><button class="btn sm line" data-a="tuChoi" data-id="${x.id}">Từ chối</button></div></div>`).join("")}</section>`:""}
   <section class="stack"><div class="row" style="justify-content:space-between"><h3>Chủ đồ</h3><span class="small muted num">Đang chờ trả tổng ${vnd(tong)}</span></div>
   ${l.length?`<div class="tbl"><table><thead><tr><th>Chủ đồ</th><th class="r">Đang bán</th><th class="r">Đã bán</th><th class="r">Chờ trả</th><th class="r">Đã trả</th></tr></thead><tbody>${l.map(c=>`<tr class="row-chu" data-a="moChu" data-v="${c.sdt}" tabindex="0"><td><b>${esc(c.ten||"—")}</b><div class="small muted num">${esc(c.sdt)}</div></td><td class="r num">${c.mon.filter(m=>m.tt==="dang"||m.tt==="thue").length}</td><td class="r num">${c.mon.filter(m=>m.tt==="ban").length}</td><td class="r num">${c.no?vnd(c.no):"—"}${c.qh?` <span class="pill bad">${c.qh} quá hạn</span>`:""}</td><td class="r num">${c.da?vnd(c.da):"—"}</td></tr>`).join("")}</tbody></table></div>`
    :`<div class="empty"><b>Chưa có chủ đồ ký gửi</b>Khi nhận đồ ký gửi, hồ sơ chủ đồ tự tạo theo số Zalo.</div>`}</section>`; }
function moChu(so){ const c=dsChuDo().find(x=>x.sdt===so); if(!c) return; const t=homNay(), no=noChuDo().filter(r=>r.chu===so);
  openSheet(`<div class="row"><div><div class="eyebrow">Chủ đồ ký gửi</div><h2>${esc(c.ten||so)}</h2><div class="muted num">${esc(so)}</div></div><button class="x" data-a="dong" aria-label="Đóng">×</button></div>
   <div class="kpis"><div class="kpi"><span class="k">Chờ trả</span><span class="v num">${vnd(c.no)}</span></div><div class="kpi"><span class="k">Đã trả</span><span class="v num">${vnd(c.da)}</span></div><div class="kpi"><span class="k">Đang bán</span><span class="v num">${c.mon.filter(m=>m.tt==="dang").length}</span></div><div class="kpi"><span class="k">Đã bán</span><span class="v num">${c.mon.filter(m=>m.tt==="ban").length}</span></div></div>
   ${no.length?`<div class="card stack" style="gap:8px"><b>Khoản chờ trả</b>${no.map(r=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:8px"><div><div>${esc(r.ten)}</div><div class="small muted num">Hạn ${ngVN(r.han)} ${r.han<t?'<span class="pill bad">quá hạn</span>':""}</div></div><div class="row"><b class="num">${vnd(r.tien)}</b><button class="btn sm wine" data-a="daTra" data-k="${r.k}" data-id="${r.id}">Đã chuyển</button></div></div>`).join("")}
     <div class="row"><button class="btn sm line" data-a="tinTra" data-v="${so}">Soạn tin báo tiền</button>${no.length>1?`<button class="btn sm wine" data-a="traHet" data-v="${so}">Đã chuyển tất cả ${vnd(c.no)}</button>`:""}</div></div>`:""}
   <div class="stack" style="gap:8px"><b>Đồ đã gửi</b>${c.mon.map(m=>`<div class="irow nosel" data-a="mo" data-id="${m.id}" role="button" tabindex="0">${phHtml(m)}<div><div class="ttl">${esc(m.ten)}</div><div class="sub">${pillTT(m)}${m.ngayDang&&m.tt==="dang"?`<span>${soNgay(m.ngayDang,t)} ngày</span>`:""}</div></div><div class="pr num">${vnd(giaNay(m,t))}</div></div>`).join("")||`<span class="small muted">Chưa có món.</span>`}</div>`); }

/* ---------- Tin Zalo soạn sẵn ---------- */
function moTin(tieuDe,noiDung){ openSheet(`<div class="row"><h2>${esc(tieuDe)}</h2><button class="x" data-a="dong" aria-label="Đóng">×</button></div><div class="msg" id="msgTxt">${esc(noiDung)}</div><div class="row"><button class="btn wine" data-a="chepTin">Chép tin</button><span class="small muted">Dán vào Zalo ${ZALO.slice(0,0)}của khách.</span></div>`); }
function tinKhach(id){ const x=S.dathang.find(y=>y.id===id); if(!x) return; moTin("Tin gửi "+x.ten,`Chào ${x.ten}, CHÉRIE Seconde đang giữ ${(x.items||[]).length} món cho bạn:\n${(x.items||[]).map(i=>`• ${i.ten}: ${vnd(i.gia)}`).join("\n")}\nTổng: ${vnd(x.tong)} (chưa gồm phí ship).\nTiệm gửi mã VietQR ngay sau tin này, bạn chuyển khoản trong 24 giờ để tiệm đóng gói nhé. Cảm ơn bạn đã chọn CHÉRIE!`); }
function tinHen(id){ const x=S.dangky.find(y=>y.id===id); if(!x) return; moTin("Tin hẹn nhận đồ",`Chào ${x.ten}, CHÉRIE Seconde đã nhận đăng ký ký gửi ${[x.brand,x.loai].filter(Boolean).join(" ")} của bạn.\nBạn mang đồ đến tiệm, hoặc tiệm nhận tận nơi cùng tuyến giao thứ 2 và thứ 6 ở Đà Nẵng. Nhớ mang theo hóa đơn, tag hoặc ảnh đơn hàng để tiệm kiểm nguồn gốc.\nPhí ký gửi: 30% món dưới 500.000đ, 25% món 500.000đ–10 triệu, 20% món trên 10 triệu. Tiền về trong 3 ngày làm việc sau khi hết hạn đổi trả.\nBạn hẹn giúp tiệm ngày giờ tiện nhé!`); }
function tinHetHan(id){ const m=S.mon.find(y=>y.id===id); if(!m) return; const t=homNay(), n=soNgay(m.ngayDang,t), g=giaNay(m,t), de=Math.max(tron(g*.85),Number(m.giaSan)||0);
  moTin("Tin gửi chủ đồ",`Chào ${m.chuTen||"bạn"}, CHÉRIE Seconde báo về món ${m.ten}: đã lên kệ ${n} ngày, giá hiện tại ${vnd(g)}${n>=HAN_NGAY?", đã hết hạn ký gửi 60 ngày":", còn "+(HAN_NGAY-n)+" ngày nữa hết hạn ký gửi"}.\nBạn chọn giúp tiệm:\n1. Giảm tiếp về ${vnd(de)} và gia hạn 30 ngày\n2. Nhận lại đồ (tiệm giao cùng tuyến thứ 2, thứ 6)\nTiệm chờ phản hồi của bạn nhé!`); }
function tinTra(so){ const c=dsChuDo().find(x=>x.sdt===so), no=noChuDo().filter(r=>r.chu===so); if(!c) return;
  moTin("Tin báo tiền ký gửi",`Chào ${c.ten||"bạn"}, CHÉRIE Seconde báo tiền ký gửi:\n${no.map(r=>`• ${r.ten}: bán ${vnd(r.gia)}, bạn nhận ${vnd(r.tien)} (hạn ${ngVN(r.han)})`).join("\n")}\nTổng: ${vnd(c.no)}. Tiệm chuyển khoản trong hạn trên vào tài khoản bạn đã đăng ký. Cảm ơn bạn đã gửi đồ ở CHÉRIE!`); }
function xacNhan(text,nut,fn){ openSheet(`<h3>${text}</h3><div class="row"><button class="btn wine" id="okX">${nut}</button><button class="btn line" data-a="dong">Thôi</button></div>`); document.getElementById("okX").onclick=async()=>{ try{ await fn(); closeSheet(); }catch(e){ loiGhi(e); } }; }

/* ===================== SỰ KIỆN ===================== */
document.addEventListener("click",async e=>{ const el=e.target.closest("[data-a]"); if(!el) return; const a=el.dataset.a, id=el.dataset.id, v=el.dataset.v;
  if(el.tagName==="INPUT"&&a!=="chon") return;
  /* cửa hàng */
  if(a==="dong") return closeSheet();
  if(a==="cat"){ S.shop.cat=v||"all"; if(v!==""&&hienTai()==="cua-hang"){ e.preventDefault(); veLai(); } return; }
  if(a==="sf"){ S.shop[el.dataset.k]=v; veSP(); return; }
  if(a==="xem") return xemSP(id);
  if(a==="gio") return moGio();
  if(a==="them"||a==="muangay"){ if(!S.cart.includes(id)){ S.cart.push(id); luuGio(); } if(a==="muangay"){ moGio(); } else { toast("Đã thêm vào giỏ."); if(sheetOpen()) xemSP(id); } veSP(); document.getElementById("cartN").textContent=gioHop().length; return; }
  if(a==="bo"){ S.cart=S.cart.filter(x=>x!==id); luuGio(); veGio(); veSP(); return; }
  if(a==="tra"){ const so=sdt(val("traSdt")), ma=val("traMa").trim(); if(so.length<9||!ma){ toast("Nhập số Zalo và mã."); return; } el.disabled=true; try{ S.tra=await SC.call("traCuu",{sdt:so,ma}); S.traSo=so; traCuu(); }catch(x){ toast(x.message||"Chưa tra được, thử lại."); } el.disabled=false; return; }
  /* quản trị: điều hướng, không ghi */
  if(a==="mo"){ e.preventDefault(); document.getElementById("aqRes")&&(document.getElementById("aqRes").hidden=true); return moMon(id); }
  if(a==="moChu"){ document.getElementById("aqRes")&&(document.getElementById("aqRes").hidden=true); return moChu(v||id); }
  if(a==="goDon"){ S.don2={seg:"giu"}; location.hash="qt-don"; return; }
  if(a==="goKho"){ S.kho.tt=v||id; location.hash==="#qt-kho"?veLai():location.hash="qt-kho"; return; }
  if(a==="khoTT"){ S.kho.tt=v; S.kho.chon.clear(); veLai(); return; }
  if(a==="chonMode"){ S.kho.chonMode=!S.kho.chonMode; S.kho.chon.clear(); veLai(); return; }
  if(a==="chon"){ e.stopPropagation(); el.checked?S.kho.chon.add(id):S.kho.chon.delete(id); veLai(); return; }
  if(a==="bulkBo"){ S.kho.chon.clear(); veLai(); return; }
  if(a==="donSeg"){ S.don2={seg:v}; veLai(); return; }
  if(a==="nhanMoi"){ S.W=null; return; }
  if(a==="tinKhach") return tinKhach(id); if(a==="tinHen") return tinHen(id); if(a==="tinHetHan") return tinHetHan(id); if(a==="tinTra") return tinTra(v);
  if(a==="chepTin") return chep(document.getElementById("msgTxt").textContent,"Đã chép tin, dán vào Zalo.");
  /* trình nhận đồ */
  if(a==="wNguon"){ luuBuoc(); S.W.d.nguon=v; veWizard(); return; }
  if(a==="wHang"){ luuBuoc(); S.W.d.hang=v; veWizard(); return; }
  if(a==="wTiep"){ luuBuoc(); const d=S.W.d; if(S.W.buoc===1&&d.nguon!=="cherie"&&sdt(d.chuDo).length<9){ toast("Nhập số Zalo chủ đồ."); return; } if(S.W.buoc===2&&!d.ten){ toast("Nhập tên món."); return; } S.W.buoc++; veWizard(); window.scrollTo({top:0}); return; }
  if(a==="wLui"){ luuBuoc(); S.W.buoc--; veWizard(); window.scrollTo({top:0}); return; }
  if(a==="wBoAnh"){ S.W.d.anh.splice(Number(v),1); S.W.files.splice(Number(v),1); veThumbs(); return; }
  if(a==="wDungGY"){ document.getElementById("wGia").value=v; document.getElementById("wGia").oninput(); return; }
  if(a==="aiAnh") return aiAnh(el); if(a==="aiMoTa") return aiMoTa(el);
  if(S.canWrite===false){ toast("Bạn chưa có quyền ghi dữ liệu."); return; }
  if(a==="wLuu") return luuWizard(v==="dang");
  const m=S.mon.find(x=>x.id===id);
  if(a==="sua"){ closeSheet(); S.W={buoc:1,id:m.id,files:[],ai:"",d:JSON.parse(JSON.stringify(Object.assign({tinhTrang:{},anh:[]},m)))}; delete S.W.d.id; if(location.hash==="#qt-nhan"){ lastShell=""; render(); } else location.hash="qt-nhan"; return; }
  if(a==="dang"){ if(!m.giaDang){ toast("Món chưa có giá. Bấm Sửa để nhập."); return; } if(!(m.anh||[]).length){ toast("Thêm ít nhất 1 ảnh trước khi đăng."); return; }
    try{ await S.db.doc("mon/"+id).update({tt:"dang",ngayDang:homNay(),lichSu:lichSu(m,"Đăng bán "+vnd(m.giaDang))}); closeSheet(); toast("Đã đăng bán."); }catch(x){ loiGhi(x); } return; }
  if(a==="vaoThue"){ try{ await S.db.doc("mon/"+id).update({tt:"thue",lichSu:lichSu(m,"Vào kho cho thuê")}); closeSheet(); toast("Đã đưa vào kho cho thuê."); }catch(x){ loiGhi(x); } return; }
  if(a==="ban") return moBan(id); if(a==="luotThue") return moLuotThue(id); if(a==="chot") return moChot(id);
  if(a==="boGiu"){ try{ await S.db.doc("mon/"+id).update({tt:"dang",lichSu:lichSu(m,"Bỏ giữ, quay lại kệ")}); for(const d of S.dathang.filter(x=>x.tt==="moi"&&(x.items||[]).some(i=>i.monId===id))) await S.db.doc("dathang/"+d.id).update({tt:"bo"}); closeSheet(); toast("Món đã quay lại kệ."); }catch(x){ loiGhi(x); } return; }
  if(a==="boDat"){ const d=S.dathang.find(x=>x.id===id); return xacNhan(`Bỏ giữ đơn của ${esc(d.ten)}? Các món quay lại kệ.`,"Bỏ giữ",async()=>{ for(const i of d.items||[]){ const mm=S.mon.find(x=>x.id===i.monId); if(mm&&mm.tt==="giu") await S.db.doc("mon/"+mm.id).update({tt:"dang",lichSu:lichSu(mm,"Khách không chốt, quay lại kệ")}); } await S.db.doc("dathang/"+id).update({tt:"bo"}); toast("Đã bỏ giữ."); }); }
  if(a==="traDo") return xacNhan(`Trả "${esc(m.ten)}" cho ${esc(m.chuTen||m.chuDo)}?`,"Đã trả đồ",()=>S.db.doc("mon/"+m.id).update({tt:"tra",ngayTra:homNay(),lichSu:lichSu(m,"Trả lại chủ đồ")}));
  if(a==="xoa") return xacNhan(`Xoá "${esc(m.ten)}" khỏi kho?`,"Xoá",()=>S.db.doc("mon/"+id).delete());
  if(a==="tuChoi") return xacNhan("Từ chối đăng ký này? Nhớ nhắn Zalo báo lý do cho khách.","Từ chối",()=>S.db.doc("dangky/"+id).update({tt:"tuchoi"}));
  if(a==="nhanDK"){ const d=S.dangky.find(x=>x.id===id); wizMoi({nguon:d.hinh==="thue"?"kyguithue":"kygui",hang:"A",ten:[d.brand,d.loai].filter(Boolean).join(" "),brand:d.brand,loai:d.loai,giaNiemYet:d.giaMua,giaDang:d.giaMuon,giaSan:d.giaSan,chuDo:d.sdt,chuTen:d.ten,bangChung:d.bangChung,moTa:"",ghiChuKhach:d.moTa,dangkyId:d.id}); closeSheet(); location.hash==="#qt-nhan"?(lastShell="",render()):location.hash="qt-nhan"; return; }
  if(a==="daTra"){ const col=el.dataset.k==="don"?"don":"thue"; try{ await S.db.doc(col+"/"+id).update({daTra:true,ngayTraTien:homNay()}); toast("Đã ghi chuyển tiền."); const so=(S.don.concat(S.thue).find(x=>x.id===id)||{}).chuDo; if(so&&sheetOpen()) setTimeout(()=>moChu(so),300); }catch(x){ loiGhi(x); } return; }
  if(a==="traHet") return xacNhan("Ghi đã chuyển tất cả khoản chờ trả cho chủ đồ này?","Đã chuyển tất cả",async()=>{ for(const r of noChuDo().filter(x=>x.chu===v)) await S.db.doc((r.k==="don"?"don/":"thue/")+r.id).update({daTra:true,ngayTraTien:homNay()}); toast("Đã ghi chuyển tiền."); });
  if(a==="bulkDang"){ const ds=[...S.kho.chon].map(i=>S.mon.find(x=>x.id===i)).filter(x=>x&&x.tt==="cho"&&x.giaDang&&(x.anh||[]).length&&x.nguon!=="kyguithue"); const bo=S.kho.chon.size-ds.length;
    try{ for(const x of ds) await S.db.doc("mon/"+x.id).update({tt:"dang",ngayDang:homNay(),lichSu:lichSu(x,"Đăng bán "+vnd(x.giaDang))}); S.kho.chon.clear(); toast(`Đã đăng ${ds.length} món`+(bo?`, bỏ qua ${bo} món chưa đủ ảnh, giá hoặc không ở Chờ đăng.`:".")); veLai(); }catch(x){ loiGhi(x); } return; }
  if(a==="bulkLive"){ try{ for(const i of S.kho.chon){ const x=S.mon.find(y=>y.id===i); if(x) await S.db.doc("mon/"+i).update({live:true,lichSu:lichSu(x,"Gắn vào buổi livestream")}); } toast("Đã gắn "+S.kho.chon.size+" món vào livestream."); S.kho.chon.clear(); veLai(); }catch(x){ loiGhi(x); } return; }
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeSheet(); if((e.key==="Enter"||e.key===" ")&&e.target.matches(".irow[data-a],tr[data-a]")){ e.preventDefault(); e.target.click(); } });
document.getElementById("sheet").addEventListener("click",e=>{ if(e.target.id==="sheet") closeSheet(); });

/* ===================== KẾT NỐI DỮ LIỆU (Apps Script) ===================== */
function loginHtml(){ return `<div class="gut" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding-block:40px"><form id="fLogin" class="stack" style="width:100%;max-width:380px">
  <a class="word" href="../">CHÉRIE<em>Seconde</em></a><h1>Quản trị</h1>
  ${S.noApi?`<div class="banner">Chưa kết nối máy chủ. Chủ tiệm triển khai Apps Script rồi dán link vào config.js.</div>`:`
  <label class="f">Bạn là<select id="lgNv"><option value="">Đang tải danh sách…</option></select></label>
  <label class="f" id="lgPinW">Mã PIN<input id="lgPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8"></label>
  <div class="small muted" id="lgNote"></div><button class="btn wine block" type="submit" id="lgBtn">Đăng nhập</button>`}</form></div>`; }
async function moLogin(){ const sel=document.getElementById("lgNv"); if(!sel) return; let ds=[];
  try{ ds=(await SC.call("staff")).staff||[]; }catch(e){ document.getElementById("lgNote").textContent=e.message||"Không tải được danh sách."; return; }
  sel.innerHTML=ds.map(n=>`<option value="${esc(n.id)}" data-tao="${n.taoPin?1:""}">${esc(n.ten)} · ${esc(n.vaiTro)}</option>`).join("");
  const note=()=>{ const o=sel.selectedOptions[0]; document.getElementById("lgNote").textContent=o&&o.dataset.tao?"Lần đầu đăng nhập: đặt mã PIN 4–8 số, dùng mã này cho các lần sau.":""; }; sel.onchange=note; note();
  document.getElementById("fLogin").addEventListener("submit",async ev=>{ ev.preventDefault(); const b=document.getElementById("lgBtn"); b.disabled=true;
    try{ const r=await SC.call("login",{nv:sel.value,pin:val("lgPin")}); SC.saveAuth(r.token,r.me); lastShell=""; S.ready=false; render(); batDau(); }catch(e){ toast(e.message||"Chưa đăng nhập được."); b.disabled=false; } }); }
let daNghe=false;
async function batDau(){ S.db=SC.db; S.canWrite=true; if(laAdmin()) S.assets=SC.assets;
  if(!daNghe){ daNghe=true; let cho=5; const xong=()=>{ if(--cho===0){ S.ready=true; veLai(); } };
    ["mon","don","dangky","thue","dathang"].forEach(c=>{ let dau=true; SC.db.collection(c).onSnapshot(s=>{ S[c]=s.docs.map(d=>Object.assign({id:d.id},d.data())); if(dau){ dau=false; xong(); } else veLai(); }); }); }
  try{ await SC.start(); }catch(e){ if(e.code==="revoked"){ SC.saveAuth("",null); lastShell=""; S.ready=true; render(); } else { S.ready=true; veLai(); toast(e.message||"Không tải được dữ liệu, thử lại."); } } }
const renderGoc=render;
render=function(){ if(laAdmin()&&(S.noApi||!SC.token())){ if(lastShell!=="login"){ lastShell="login"; document.getElementById("app").innerHTML=loginHtml(); moLogin(); } return; } renderGoc(); };
document.addEventListener("click",e=>{ const a=e.target.closest('[data-a="dangXuat"]'); if(!a) return; e.preventDefault(); SC.call("logout").catch(()=>{}); SC.saveAuth("",null); location.reload(); });
(function(){ S.noApi=!window.SC_API; render(); if(S.noApi){ S.ready=true; veLai(); return; } if(laAdmin()&&!SC.token()) return; batDau(); })();
