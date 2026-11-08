/* TAP SHOP BAR · store tap island engine (shared by cheonggye/ sangam/ magok/ dongdaemun/)
   Each store page sets window.ISLAND (photo + machine boxes in % of the photo).
   Wines come from ../assets/taps.json (same file as the campaign list) → when the POS tap API is ready, swap that one URL. */
(async()=>{
const C=window.ISLAND,W=C.W,H=C.H;
const $=id=>document.getElementById(id);
document.body.insertAdjacentHTML('beforeend',`
<div class="stage" id="stage"><div class="photo" id="photo"><div class="kb" id="kb">
 <img class="base" src="${C.src}" alt="${C.label} 탭 사진">
 ${C.hi?`<img class="hi" src="${C.hi.src}" alt="" aria-hidden="true" style="left:${C.hi.box[0]}%;top:${C.hi.box[1]}%;width:${C.hi.box[2]}%;height:${C.hi.box[3]}%">`:''}
 <div class="vig"></div><div id="machines"></div>
 ${C.ring?'<div class="ringwrap" id="ringwrap"><div class="ring3d" id="ring3d"></div></div>':''}
 ${C.ticker?`<div class="ticker ${C.ticker.theme||'light'}" id="ticker"><div class="run" id="run"></div></div>`:''}
</div></div></div>
<button class="back" id="back">← 전체 보기</button>
<div class="press" id="press"><svg viewBox="0 0 54 54"><circle class="bg" cx="27" cy="27" r="24"/><circle class="fg" cx="27" cy="27" r="24"/></svg></div>
<aside class="panel" id="panel" aria-hidden="true">
 <header><div><div class="eyebrow" id="p-eyebrow">ON TAP · ${C.label}</div></div><button class="x" id="p-close" aria-label="닫기">×</button></header>
 <div class="body" id="p-body"></div>
</aside>`);
const stage=$('stage'),photo=$('photo'),mwrap=$('machines'),panel=$('panel'),pbody=$('p-body'),peye=$('p-eyebrow'),back=$('back'),press=$('press'),hint=$('hint');
if(C.slots)for(const k of ['st','sb','sp'])if(C.slots[k]!=null)stage.style.setProperty('--'+k,C.slots[k]+'%');

/* data: taps.json → this store's wines (each has a tap number) */
let WINES=[],MODE='sample';
try{const d=await (await fetch('../assets/taps.json',{cache:'no-store'})).json();MODE=d.mode;WINES=(d.stores.find(s=>s.id===C.store)||{wines:[]}).wines.filter(w=>w.tap)}catch(e){}
const byTap=t=>WINES.find(w=>w.tap===t);
const pad=n=>String(n).padStart(2,'0');
const catCls=c=>c==='Premium'?'pr':c==='Sauvignon Blanc'?'sb':'red';
const catTxt=c=>c==='Premium'?'PREMIUM':c==='Sauvignon Blanc'?'SAUVIGNON BLANC':(c||'').toUpperCase();
const won=n=>n?n.toLocaleString('ko-KR')+'원':'잔 가격은 탭 화면';
const fakeLevel=t=>[72,41,88,63,55,93,34,80,67,49,76,58][t%12];
const SLOTS=4;
const tapsOf=m=>m.kind==='wine'?Array.from({length:SLOTS},(_,i)=>m.first+i):[];
const machineOf=t=>C.machines.find(m=>m.kind==='wine'&&t>=m.first&&t<m.first+SLOTS);
const SAMPLE=MODE==='sample'?'샘플 데이터 · 설명·잔량은 시안용 값입니다. 실제 탭 배치·잔 가격·잔량은 탭 기계 → TSB 서버 연동 후 자동으로 바뀝니다.':'실시간 · TSB 서버 기준';

/* machines + slots */
C.machines.forEach((m,mi)=>{
  m.id='m'+mi;
  const el=document.createElement('div');el.className='m';el.id=m.id;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',m.name+' 탭 기계');
  el.style.cssText=`left:${m.box[0]}%;top:${m.box[1]}%;width:${m.box[2]}%;height:${m.box[3]}%`;
  el.innerHTML=`<span class="ring"></span><span class="lab">${m.name}</span>${m.kind==='wine'?'<span class="dot"></span>':''}<div class="slots"></div>`;
  const slots=el.querySelector('.slots');
  tapsOf(m).forEach(t=>{const w=byTap(t);const b=document.createElement('button');b.className='slot'+(w?'':' empty');b.dataset.t=t;b.setAttribute('aria-label',w?w.ko:'탭 '+pad(t));b.innerHTML=`<b>${pad(t)}</b>`;b.onclick=e=>{e.stopPropagation();selectTap(t,m,b)};slots.appendChild(b)});
  el.onclick=e=>{e.stopPropagation();if(stage.classList.contains('zoomed')&&cur===m)return;zoomTo(m)};
  el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();zoomTo(m)}};
  mwrap.appendChild(el);
});
const slotEl=t=>document.querySelector(`.slot[data-t="${t}"]`);
function openTap(t){const m=machineOf(t);if(m)zoomTo(m,()=>selectTap(t,m,slotEl(t)));else selectTap(t,null,null)}

/* round island: rotating 3D label ring */
let tagEls=[],ringwrap=$('ringwrap');
if(C.ring){
  const R=C.ring,ring3d=$('ring3d');
  ringwrap.style.cssText=`left:${R.cx-R.w/2}%;top:${R.cy-R.h/2}%;width:${R.w}%;height:${R.h}%`;
  WINES.forEach(w=>{const t=document.createElement('div');t.className='tag3';const b=document.createElement('button');b.className=catCls(w.cat);b.innerHTML=`<i></i>${w.en.split(' ').slice(0,2).join(' ').replace(/,$/,'').toUpperCase()}`;b.title=w.ko;b.onclick=e=>{e.stopPropagation();openTap(w.tap)};t.appendChild(b);ring3d.appendChild(t);tagEls.push(t)});
  ringwrap.addEventListener('mouseenter',()=>ringwrap.classList.add('paused'));
  ringwrap.addEventListener('mouseleave',()=>ringwrap.classList.remove('paused'));
  const t0=performance.now();
  (function tick(){const a0=((performance.now()-t0)/36000*360)%360;tagEls.forEach((t,i)=>{const z=Math.cos(((i*(360/tagEls.length))+a0)%360*Math.PI/180);t.classList.toggle('back',z<-0.15);t.style.zIndex=Math.round((z+1)*50)});requestAnimationFrame(tick)})();
}
/* straight bar / wall: LED ticker over the sign band */
const ticker=$('ticker');
if(ticker){
  const T=C.ticker.box;ticker.style.cssText=`left:${T[0]}%;top:${T[1]}%;width:${T[2]}%;height:${T[3]}%`;
  const items=WINES.map((w,i)=>`<button class="${catCls(w.cat)}" data-t="${w.tap}" title="${w.ko}"><i></i><small>TAP ${pad(w.tap)}</small>${w.en.toUpperCase()}</button>${i%3===2?'<span class="brand">TAP SHOP BAR</span>':''}`).join('');
  $('run').innerHTML=items+items;$('run').style.setProperty('--dur',Math.max(30,WINES.length*7)+'s');
  ticker.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b){e.stopPropagation();openTap(+b.dataset.t)}});
}

/* layout: photo covers the viewport */
let base={w:0,h:0,x:0,y:0},cur=null;
function layout(){
  const vw=innerWidth,vh=innerHeight,mob=vw<720,F=C.fit||{};
  const s=Math.max(vw/W,vh/H)*(mob?1.0:(F.cover||1.08));
  base.w=W*s;base.h=H*s;
  const fx=F.fx??0.5,fy=mob?(F.fyMobile??F.fy??0.53):(F.fy??0.5);
  base.x=Math.min(0,Math.max(vw-base.w,vw/2-base.w*fx));base.y=Math.min(0,Math.max(vh-base.h,vh/2-base.h*fy));
  photo.style.width=base.w+'px';photo.style.height=base.h+'px';
  if(cur)applyZoom(cur,false);else photo.style.transform=`translate(${base.x}px,${base.y}px) scale(1)`;
  if(tagEls.length){const r=Math.max(80,ringwrap.offsetWidth/2*0.92);tagEls.forEach((t,i)=>{t.style.transform=`rotateY(${i*(360/tagEls.length)}deg) translateZ(${r}px)`})}
  if(ticker)ticker.style.fontSize=Math.max(7,C.ticker.box[3]/100*base.h*(C.ticker.size||0.34))+'px';
}
function applyZoom(m,animate=true){
  const vw=innerWidth,vh=innerHeight,mob=vw<720;
  const bx=m.box[0]/100*base.w,by=m.box[1]/100*base.h,bw=m.box[2]/100*base.w,bh=m.box[3]/100*base.h;
  const availW=mob?vw:vw-Math.min(420,vw*0.4),availH=mob?vh*0.34:vh;
  const sc=Math.min(availW*0.78/bw,availH*0.62/bh,C.maxZoom||99);
  const cx=bx+bw/2,cy=by+bh*0.58;
  const cl=(v,min)=>Math.min(0,Math.max(min,v));// keep the photo covering the view (no black edge)
  const tx=cl((mob?vw/2:availW/2)-cx*sc,(mob?vw:availW)-base.w*sc),ty=cl((mob?vh*0.22:vh*0.52)-cy*sc,vh-base.h*sc);
  if(!animate)photo.style.transition='none';
  photo.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`;
  if(!animate)requestAnimationFrame(()=>photo.style.transition='');
}
function zoomTo(m,after){
  if(!m)return;cur=m;stage.classList.add('zoomed');
  document.querySelectorAll('.m.on').forEach(e=>e.classList.remove('on'));$(m.id).classList.add('on');
  applyZoom(m,true);back.classList.add('show');
  if(hint)hint.innerHTML='<i></i>와인을 누르면 설명 · 길게 누르면 뒤로';
  if(m.kind==='wine')showMachine(m);else showOther(m);
  if(after)setTimeout(after,650);
}
function zoomOut(){
  cur=null;stage.classList.remove('zoomed');
  document.querySelectorAll('.m.on,.slot.sel').forEach(e=>e.classList.remove('on','sel'));
  photo.style.transform=`translate(${base.x}px,${base.y}px) scale(1)`;
  back.classList.remove('show');closePanel();
  if(hint)hint.innerHTML='<i></i>탭을 누르면 가까이 · 길게 누르면 뒤로';
}

/* panel */
function openPanel(){panel.classList.add('open');panel.setAttribute('aria-hidden','false')}
function closePanel(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true')}
function showMachine(m){
  const ts=tapsOf(m),ws=ts.map(byTap).filter(Boolean);
  peye.textContent=`ON TAP · ${C.label} · ${m.name}`;
  pbody.innerHTML=`<h2>${ws.length?`이 기계에는<br>${ws.length}가지가 있어요.`:`${m.name}<br>탭 ${pad(ts[0])}–${pad(ts[ts.length-1])}`}</h2><p class="en">${ws.length?'아래에서 고르거나, 사진 속 병을 직접 눌러 보세요.':'이 기계의 와인 목록은 POS 연동 때 같이 붙습니다.'}</p>
  <ul class="list">${ws.map(w=>`<li><button data-t="${w.tap}"><i class="${catCls(w.cat)}"></i>${w.ko}<small>TAP ${pad(w.tap)}</small></button></li>`).join('')}</ul>
  <p class="sample">${SAMPLE}</p>`;
  pbody.querySelectorAll('button[data-t]').forEach(b=>b.onclick=()=>{const t=+b.dataset.t;selectTap(t,m,slotEl(t))});
  openPanel();
}
function showOther(m){
  peye.textContent=`ON TAP · ${C.label} · ${m.name}`;
  pbody.innerHTML=`<h2>${m.title||m.name+' 탭'}</h2><p class="en">${m.sub||'한 잔씩, 탭에서.'}</p>
  <p class="note">이 시안에서는 와인 탭만 데이터가 들어가 있어요. ${m.name} 목록은 POS 연동 때 같이 붙습니다.</p><p class="sample">샘플 · 목업</p>`;
  openPanel();
}
function selectTap(t,m,el){
  const w=byTap(t);
  document.querySelectorAll('.slot.sel').forEach(e=>e.classList.remove('sel'));if(el)el.classList.add('sel');
  peye.textContent=`ON TAP · ${C.label} · TAP ${pad(t)}`;
  if(!w){pbody.innerHTML=`<p class="machine"><b>${m?m.name:''}</b> · 탭 ${pad(t)}</p><h2>준비 중인 탭</h2><p class="en">이 칸의 와인은 POS 연동 후 자동으로 표시됩니다.</p>${m?'<div class="cta"><button type="button" class="ghost" id="p-back">기계로 돌아가기</button></div>':''}<p class="sample">${SAMPLE}</p>`;}
  else{
  const lv=fakeLevel(t);
  pbody.innerHTML=`<p class="machine"><b>${m?m.name:'사진 밖 기계'}</b> · 탭 ${pad(t)}</p>
  <h2>${w.ko}</h2><p class="en">${w.en}</p>
  <div class="tags"><span class="tag ${catCls(w.cat)}">${catTxt(w.cat)}</span><span class="tag">${w.origin}</span></div>
  <dl class="kv"><dt>산지</dt><dd>${w.origin}${w.region?' · '+w.region:''}</dd>${w.grape?`<dt>품종</dt><dd>${w.grape}</dd>`:''}<dt>보틀</dt><dd>${won(w.bottle)}</dd><dt>잔</dt><dd>테이스팅 · 한 잔 두 가지 (탭 화면)</dd></dl>
  ${w.note?`<p class="note">${w.note}</p>`:''}
  <div class="lvl"><div class="t"><span>남은 양</span><span>${lv}%</span></div><div class="b"><i style="width:0"></i></div></div>
  <div class="cta"><button type="button" onclick="alert('목업입니다. 앱 연동 전이에요.')">앱에서 이 잔 담기</button>${m?'<button type="button" class="ghost" id="p-back">기계로 돌아가기</button>':''}</div>
  <p class="sample">${SAMPLE}</p>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const i=pbody.querySelector('.lvl i');if(i)i.style.width=lv+'%'}));}
  const pb=pbody.querySelector('#p-back');if(pb)pb.onclick=()=>{document.querySelectorAll('.slot.sel').forEach(e=>e.classList.remove('sel'));showMachine(m)};
  openPanel();
}
$('p-close').onclick=closePanel;back.onclick=zoomOut;
addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.classList.contains('open')&&cur)closePanel();else zoomOut()}});

/* long press anywhere = zoom out */
let pt=null,pTimer=null,lpFired=false;
function startPress(x,y){cancelPress();pt={x,y};press.style.left=x+'px';press.style.top=y+'px';const fg=press.querySelector('.fg');fg.style.animation='none';void fg.offsetWidth;fg.style.animation='';press.classList.add('on');pTimer=setTimeout(()=>{press.classList.remove('on');pTimer=null;if(cur){lpFired=true;zoomOut()}},550)}
function cancelPress(){if(pTimer){clearTimeout(pTimer);pTimer=null}press.classList.remove('on');pt=null}
stage.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;startPress(e.clientX,e.clientY)});
stage.addEventListener('pointermove',e=>{if(pt&&Math.hypot(e.clientX-pt.x,e.clientY-pt.y)>12)cancelPress()});
['pointerup','pointercancel','pointerleave'].forEach(ev=>stage.addEventListener(ev,cancelPress));
stage.addEventListener('contextmenu',e=>e.preventDefault());
/* tap on empty photo while not zoomed → zoom to the home machine */
stage.addEventListener('click',e=>{if(lpFired){lpFired=false;e.stopPropagation();e.preventDefault();return}if(!cur&&!e.target.closest('.m,.tag3,.ticker'))zoomTo(C.machines[C.home||0])},true);

/* campaign page list click → open that tap here */
addEventListener('message',e=>{if(e.origin!==location.origin||!e.data)return;if(e.data.tap)openTap(+e.data.tap);else if(e.data.tapEn){const w=WINES.find(w=>w.en===e.data.tapEn);if(w)openTap(w.tap)}});

addEventListener('resize',layout);layout();
})();
