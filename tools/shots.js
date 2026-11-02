// Chụp toàn trang ở 430x932, tối + sáng. Dùng: node shots.js <thư mục ra>
const {chromium}=require('playwright');const out=process.argv[2]||'.';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
(async()=>{const b=await chromium.launch();
for(const sc of ['dark','light']){const c=await b.newContext({viewport:{width:430,height:932},colorScheme:sc,deviceScaleFactor:1});
 await c.addInitScript(()=>{Object.defineProperty(window,'SC_API',{get:()=> 'http://localhost:8765/gas',set(){}});});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 for(const [n,h] of [['home',''],['mua','#mua'],['ban','#ban'],['tracuu','#tra-cuu']]){
  await p.goto('http://localhost:8765/'+h);await p.waitForTimeout(700);
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);});
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await p.screenshot({path:`${out}/${sc}_${n}.png`,fullPage:true});console.log(sc,n,'overflow',ov);}
 // first product page
 await p.goto('http://localhost:8765/#mua');await p.waitForTimeout(500);const a=await p.$('a[href^="#sp-"]');if(a){await a.click();await p.waitForTimeout(600);await p.screenshot({path:`${out}/${sc}_sp.png`,fullPage:true});}
 console.log(sc,'errs',errs);await c.close();}
await b.close();})();
