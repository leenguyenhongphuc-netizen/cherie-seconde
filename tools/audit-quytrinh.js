const {chromium}=require('playwright');const fs=require('fs');
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
const img=n=>({name:`a${n}.png`,mimeType:'image/png',buffer:PNG});const jpg=f=>({name:f,mimeType:'image/jpeg',buffer:fs.readFileSync(f)});
const t=s=>(s||'').replace(/\s+/g,' ').trim();const SC=process.env.SC||'dark';
async function ctx(b,w){const c=await b.newContext({viewport:{width:w||430,height:932},colorScheme:SC});await c.addInitScript(()=>{Object.defineProperty(window,'SC_API',{get:()=> 'http://localhost:8765/gas',set(){}});});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('dialog',d=>d.accept());return p;}
(async()=>{const b=await chromium.launch();
 // 1. khách định giá
 const K=await ctx(b);await K.goto('http://localhost:8765/#ban');await K.waitForSelector('#bFile',{state:'attached'});
 await K.setInputFiles('#bFile',[img(1),img(2),img(3)]);await K.waitForFunction(()=>S.ban.anh.filter(a=>a.id).length===3);await K.waitForTimeout(100);
 await K.click('[data-a=bTiep]');await K.waitForSelector('.aicard');await K.click('[data-a=bTiep]');await K.waitForSelector('.offers');await K.screenshot({path:'n_s3.png',fullPage:true});
 await K.click('[data-a=bTiep]');await K.waitForSelector('#lTen');console.log('s7 stepper:',t(await K.textContent('.stepper li.now')),'| thieu:',await K.textContent('#bThieu'));
 await K.fill('#lTen','Chị Hoa');await K.fill('#lSdt','0911222333');await K.click('[data-a=lNoi][data-v="Đà Nẵng"]');await K.check('#lDong');
 await K.screenshot({path:'n_s7.png',fullPage:true});
 await K.click('[data-a=bGui]');await K.waitForSelector('.banner.ok',{timeout:9000});console.log('sent:',t(await K.textContent('.banner.ok')));
 await K.screenshot({path:'n_sent.png',fullPage:true});
 const tdHref=await K.getAttribute('a[href^="#theo-doi/"]','href');
 // 2. nhân viên tạo hợp đồng
 const A=await ctx(b,430);await A.goto('http://localhost:8765/quanly/');await A.waitForSelector('#lgNv option[value="NV01"]',{state:'attached'});await A.selectOption('#lgNv','NV01');await A.fill('#lgPin','2468');await A.click('#fLogin button[type=submit]');
 await A.waitForTimeout(1200);await A.goto('http://localhost:8765/quanly/#qt-chu');await A.waitForTimeout(800);await A.screenshot({path:'n_adm_chu.png',fullPage:true});
 await A.click('[data-a=mauTin]');await A.waitForSelector('.tplist');await A.screenshot({path:'n_adm_mau.png'});await A.click('.tplist button');await A.waitForSelector('#msgTxt');console.log('mau1:',t(await A.textContent('#msgTxt')).slice(0,160));
 await A.click('[data-a=dong]');await A.waitForTimeout(200);
 await A.click('#qt-chu [data-a=taoHD], [data-a=taoHD]');await A.waitForSelector('#fHD');await A.selectOption('#fHD select[name=hang]','B');await A.fill('#fHD textarea[name=ketQuaKiem]','Da góc đáy sờn nhẹ, kèm túi chống bụi');
 await A.click('#fHD button[type=submit]');await A.waitForSelector('.linkbox',{timeout:9000});const link=t(await A.textContent('.linkbox'));console.log('link:',link);await A.screenshot({path:'n_adm_hd.png'});
 // 3. khách ký qua link
 const H=await ctx(b);await H.goto(link);await H.waitForSelector('[data-dong="3"]',{timeout:9000});console.log('hd stepper:',t(await H.textContent('.stepper li.now')),'| side:',t(await H.textContent('#bSide')).slice(0,160));
 await H.check('[data-dong="3"]');await H.waitForTimeout(100);await H.setInputFiles('#hCCT',[jpg('card_front.jpg')]);await H.waitForFunction(()=>S.ban.docTT==='xong');await H.setInputFiles('#hCCS',[jpg('card_back.jpg')]);await H.waitForFunction(()=>S.ban.cccdS&&S.ban.cccdS.id);await H.waitForTimeout(200);
 await H.screenshot({path:'n_h4.png',fullPage:true});
 await H.click('#bStep [data-a=bTiep]');await H.waitForSelector('#hSdt');console.log('zalo prefilled:',await H.inputValue('#hSdt'));await H.fill('#hNH','MB');await H.fill('#hTK','123456');await H.screenshot({path:'n_h5.png',fullPage:true});
 await H.click('#bStep [data-a=bTiep]');await H.waitForSelector('#hKy');console.log('hd text:',t(await H.textContent('#hdText')).match(/Điều 3[^Đ]*/)[0].slice(0,200));
 for(const i of [0,1,2]) await H.check(`[data-dong="${i}"]`);await H.locator('#hKy').scrollIntoViewIfNeeded();const k=await H.locator('#hKy').boundingBox();await H.mouse.move(k.x+30,k.y+60);await H.mouse.down();await H.mouse.move(k.x+200,k.y+40,{steps:6});await H.mouse.up();
 await H.click('#bKyBtn');await H.waitForSelector('.banner.ok',{timeout:9000});console.log('signed:',t(await H.textContent('.banner.ok')),'| stepper:',t(await H.textContent('.stepper')));await H.screenshot({path:'n_h6.png',fullPage:true});
 // 4. nhân viên ghi khâu
 await A.click('[data-a=dong]').catch(()=>{});await A.evaluate(()=>SC.reload());await A.waitForTimeout(500);await A.goto('http://localhost:8765/quanly/#qt-chu');await A.waitForTimeout(500);
 for(const [kh,so,ma] of [['nhanDo'],['kiemDinh'],['veSinh'],['ganTag',0,'SC-0123'],['daBan',30000000]]){ await A.click('[data-a=khau]');await A.waitForSelector('#fKhau');await A.selectOption('#kB',kh);
   if(kh==='veSinh'){ await A.setInputFiles('#kFile',[img(5)]);await A.waitForFunction(()=>!document.querySelector('#kAnh .upl'));}
   if(so) await A.fill('#fKhau input[name=so]',String(so)); if(ma) await A.fill('#fKhau input[name=ma]',ma); await A.fill('#fKhau textarea[name=ghiChu]','Ghi chú '+kh);
   await A.click('#fKhau button[type=submit]');await A.waitForTimeout(600);await A.click('[data-a=dong]').catch(()=>{});await A.waitForTimeout(200);}
 await A.click('[data-a=khau]');await A.waitForSelector('#fKhau');await A.waitForTimeout(3500);await A.screenshot({path:'n_adm_khau.png',fullPage:true});
 // 5. khách theo dõi
 const T=await ctx(b);await T.goto('http://localhost:8765/'+tdHref);await T.waitForSelector('.tdline',{timeout:9000});console.log('td:',t(await T.textContent('#tdBox')).slice(0,500));await T.screenshot({path:'n_td.png',fullPage:true});
 console.log('errs',K.errs,A.errs,H.errs,T.errs);await b.close();})();
