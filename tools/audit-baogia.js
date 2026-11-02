const {chromium}=require('playwright');const fs=require('fs');
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
const img=n=>({name:`a${n}.png`,mimeType:'image/png',buffer:PNG});const jpg=f=>({name:f,mimeType:'image/jpeg',buffer:fs.readFileSync(f)});
const t=s=>(s||'').replace(/\s+/g,' ').trim();const SC=process.env.SC||'dark';
async function ctx(b){const c=await b.newContext({viewport:{width:430,height:932},colorScheme:SC});await c.addInitScript(()=>{Object.defineProperty(window,'SC_API',{get:()=> 'http://localhost:8765/gas',set(){}});});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));return p;}
async function khau(A,b,o={}){ await A.click('[data-a=dong]').catch(()=>{});await A.waitForTimeout(150);
  const sel=`[data-a=khau][data-v="${b}"]`; if(await A.$(sel)) await A.click(sel); else await A.click('[data-a=khau]'); await A.waitForSelector('#fKhau'); await A.selectOption('#kB',b);
  if(o.so) await A.fill('#fKhau input[name=so]',String(o.so)); if(o.ma) await A.fill('#fKhau input[name=ma]',o.ma); await A.fill('#fKhau textarea[name=ghiChu]',o.gc||'');
  await A.click('#fKhau button[type=submit]');await A.waitForTimeout(600); }
(async()=>{const b=await chromium.launch();
 const K=await ctx(b);await K.goto('http://localhost:8765/#ban');await K.waitForSelector('#bFile',{state:'attached'});
 await K.setInputFiles('#bFile',[img(1),img(2),img(3)]);await K.waitForFunction(()=>S.ban.anh.filter(a=>a.id).length===3);await K.waitForTimeout(100);
 await K.click('[data-a=bTiep]');await K.waitForSelector('.aicard');await K.click('[data-a=bTiep]');await K.waitForSelector('.optlist');
 await K.click('#iMuon');await K.keyboard.type('30000000');await K.screenshot({path:'q_s3.png',fullPage:true});
 await K.click('[data-a=bTiep]');await K.waitForSelector('#lTen');await K.fill('#lTen','Chị Hoa');await K.fill('#lSdt','0911222333');await K.click('[data-a=lNoi][data-v="Tỉnh khác"]');await K.check('#lDong');
 await K.screenshot({path:'q_s7.png',fullPage:true});await K.click('[data-a=bGui]');await K.waitForSelector('.banner.ok');await K.screenshot({path:'q_sent.png',fullPage:true});
 const td='http://localhost:8765/'+await K.getAttribute('a[href^="#theo-doi/"]','href');
 const T=await ctx(b);await T.goto(td);await T.waitForSelector('.tdline');console.log('td0:',t(await T.textContent('#tdBox')).slice(0,140));
 const A=await ctx(b);await A.goto('http://localhost:8765/quanly/');await A.waitForSelector('#lgNv option[value="NV01"]',{state:'attached'});await A.selectOption('#lgNv','NV01');await A.fill('#lgPin','2468');await A.click('#fLogin button[type=submit]');await A.waitForTimeout(1200);
 await A.goto('http://localhost:8765/quanly/#qt-chu');await A.waitForTimeout(600);await A.screenshot({path:'q_adm1.png'});
 await khau(A,'baoGia',{so:28000000,gc:'Túi đẹp, còn hộp'});console.log('tin bao gia:',t(await A.textContent('#msgTxt')).slice(0,220));
 // khách thương lượng
 await T.click('[data-a=tdLai]');await T.waitForSelector('.tdgia');await T.screenshot({path:'q_td_bg.png',fullPage:true});await T.click('[data-a=tdTL]');await T.fill('#fTL input[name=g]','32000000');await T.click('#fTL button');await T.waitForTimeout(800);console.log('after TL:',t(await T.textContent('.tdgia')).slice(0,160));
 await A.evaluate(()=>SC.reload());await A.waitForTimeout(400);await A.goto('http://localhost:8765/quanly/#qt-chu');await A.waitForTimeout(400);console.log('adm sees:',t(await A.textContent('body')).match(/Khách đề nghị[^·]*/)?.[0]);
 await khau(A,'baoGia',{so:30000000,gc:'Tiệm đồng ý 30 triệu'});
 await T.click('[data-a=tdLai]');await T.waitForSelector('[data-a=tdDongY]');await T.click('[data-a=tdDongY]');await T.waitForSelector('#fVD');await T.screenshot({path:'q_td_ship.png',fullPage:true});
 await T.fill('#fVD input[name=ma]','GHN12345678');await T.fill('#fVD input[name=dv]','GHN');await T.click('#fVD button');await T.waitForTimeout(800);console.log('after VD:',t(await T.textContent('#tdBox')).slice(0,400));
 await A.evaluate(()=>SC.reload());await A.waitForTimeout(400);await A.goto('http://localhost:8765/quanly/#qt-chu');await A.waitForTimeout(400);
 await khau(A,'nhanDo',{gc:'Đã nhận kiện, video mở hộp'});await khau(A,'kiemDinh',{gc:'Đạt'});
 await A.click('[data-a=dong]').catch(()=>{});await A.waitForTimeout(200);await A.screenshot({path:'q_adm2.png'});
 await A.click('[data-a=taoHD]');await A.waitForSelector('#fHD');console.log('gia chot prefill:',await A.inputValue('#fHD input[name=giaChot]'));
 console.log('errs',K.errs,T.errs,A.errs);await b.close();})();
