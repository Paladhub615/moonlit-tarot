'use strict';
const slots=document.getElementById('cards'), reading=document.getElementById('reading'), statusText=document.getElementById('status'), shuffleButton=document.getElementById('shuffle');
const modeButtons=[...document.querySelectorAll('[data-count]')];
let count=1, phase='idle', drawn=[], revealed=new Set();
const positions=['อดีต','ปัจจุบัน','แนวโน้ม'];
CARDS.forEach((c,i)=>{const codes={Wands:'wa',Cups:'cu',Swords:'sw',Pentacles:'pe'};c.image=i<22?`images/ar${String(i).padStart(2,'0')}.webp`:`images/${codes[c.group.split(' ')[0]]}${String((i-22)%14+1).padStart(2,'0')}.webp`;});
function renderSlots(){
 slots.className='cards'+(count===3?' three':''); slots.replaceChildren();
 for(let i=0;i<count;i++){
  const slot=document.createElement('div');slot.className='card-slot';
  slot.innerHTML=`<div class="position-label">${count===3?positions[i]:''}</div><button type="button" class="card" disabled aria-label="ไพ่ใบที่ ${i+1} กรุณาสับไพ่ก่อน"><span class="card-body"><span class="face back" aria-hidden="true"><span class="ornament"><span class="tiny">✦ · ✦</span><span class="orb">☾</span><span class="card-motto">MOONLIT<br>TAROT</span><span class="tiny">· ✦ ·</span></span></span><span class="face front"></span></span></button><div class="card-hint">${count===1?'ไพ่ของคุณ':'ใบที่ '+(i+1)}</div>`;
  slot.querySelector('button').addEventListener('click',()=>revealCard(i));slots.append(slot);
 }
 reading.hidden=true;reading.replaceChildren();
}
function setCount(next){if(phase==='shuffling')return false;if(![1,3].includes(next))throw new Error('เลือกได้เฉพาะ 1 หรือ 3 ใบ');count=next;phase='idle';drawn=[];revealed.clear();modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.count)===count)));document.getElementById('spread-title').textContent=count===1?'ONE-CARD READING':'THREE-CARD READING';statusText.textContent='หายใจเข้าลึก ๆ แล้วกดสับไพ่เมื่อพร้อม';shuffleButton.querySelector('span').textContent='สับไพ่';renderSlots();return true;}
function randomIndex(max){const array=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(array);}while(array[0]>=limit);return array[0]%max;}
function drawDeck(){const deck=[...CARDS];for(let i=deck.length-1;i>0;i--){const j=randomIndex(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck.slice(0,count);}
async function shuffle(){if(phase==='shuffling')return false;phase='shuffling';revealed.clear();drawn=drawDeck();renderSlots();shuffleButton.disabled=true;modeButtons.forEach(b=>b.disabled=true);shuffleButton.querySelector('span').textContent='กำลังสับไพ่…';statusText.textContent='นึกถึงคำถามของคุณสักครู่';slots.classList.add('shuffling');
 await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?120:1350));
 slots.classList.remove('shuffling');phase='ready';shuffleButton.disabled=false;modeButtons.forEach(b=>b.disabled=false);shuffleButton.querySelector('span').textContent='สับไพ่ใหม่';
 [...slots.children].forEach((slot,i)=>{const btn=slot.querySelector('button');btn.disabled=false;btn.setAttribute('aria-label',`เปิดไพ่${count===3?' '+positions[i]:''}`);slot.querySelector('.card-hint').textContent='แตะเพื่อเปิดไพ่';});
 statusText.textContent=count===1?'ไพ่พร้อมแล้ว แตะไพ่เพื่อเปิดคำตอบ':'ไพ่พร้อมแล้ว แตะเปิดทีละใบตามใจคุณ';return true;
}
function revealCard(i){if(!['ready','revealed'].includes(phase)||!Number.isInteger(i)||i<0||i>=count||revealed.has(i))return null;const c=drawn[i],slot=slots.children[i],button=slot.querySelector('button'),front=slot.querySelector('.front');
 const img=new Image();img.alt=c.name+' — '+c.thai;img.src=c.image;img.addEventListener('error',()=>{const fallback=document.createElement('span');fallback.className='image-error';fallback.textContent='โหลดภาพไม่สำเร็จ · '+c.name;front.append(fallback);});front.append(img);button.classList.add('flipped');button.disabled=true;button.setAttribute('aria-label',c.name+' '+c.thai);slot.querySelector('.card-hint').textContent=c.name;revealed.add(i);renderReading();
 if(revealed.size===count){phase='revealed';statusText.textContent='ค่อย ๆ อ่าน แล้วเลือกเก็บสิ่งที่มีความหมายกับคุณ';}else statusText.textContent=`เปิดแล้ว ${revealed.size} จาก ${count} ใบ · แตะไพ่ที่เหลือได้เลย`;
 return {position:count===3?positions[i]:'ข้อความสำหรับคุณ',name:c.name,thai:c.thai,meaning:c.meaning};
}
function renderReading(){reading.hidden=false;reading.className='reading'+(count===1?' single':'');reading.style.setProperty('--cols',count);reading.replaceChildren();for(let i=0;i<count;i++){const article=document.createElement('article');article.className='meaning';if(!revealed.has(i)){article.classList.add('waiting');article.textContent=positions[i]+' · รอเปิดไพ่';}else{const c=drawn[i];article.innerHTML=`<div class="meaning-label">${count===3?positions[i]+' · ':''}${c.group}</div><h2>${c.name}</h2><p class="thai-name">${c.thai}</p><p class="keywords">${c.keywords}</p><p class="description">${c.meaning}</p>`;}reading.append(article);}}
modeButtons.forEach(b=>b.addEventListener('click',()=>setCount(Number(b.dataset.count))));shuffleButton.addEventListener('click',shuffle);renderSlots();
if(document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'shuffle_tarot',title:'เลือกจำนวนและสับไพ่',description:'เริ่มไพ่ชุดใหม่ เลือก 1 หรือ 3 ใบและสับไพ่ ยังคงปิดหน้าไพ่ไว้',inputSchema:{type:'object',properties:{count:{type:'integer',enum:[1,3]}},required:['count'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||![1,3].includes(input.count))throw new Error('count ต้องเป็น 1 หรือ 3');if(phase==='shuffling')throw new Error('กำลังสับไพ่');setCount(input.count);await shuffle();return {count,phase};}});
 register({name:'reveal_tarot',title:'เปิดไพ่ที่เลือก',description:'เปิดไพ่ตามหมายเลขตำแหน่ง เริ่มนับจาก 1 หลังสับไพ่ แล้วแสดงภาพและความหมาย',inputSchema:{type:'object',properties:{positions:{type:'array',items:{type:'integer',minimum:1,maximum:3},minItems:1,maxItems:3,uniqueItems:true}},required:['positions'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{const ids=input?.positions;if(!Array.isArray(ids)||!ids.length||ids.length>count||new Set(ids).size!==ids.length||ids.some(i=>!Number.isInteger(i)||i<1||i>count||revealed.has(i-1))||phase!=='ready')throw new Error('กรุณาสับไพ่และเลือกตำแหน่งที่ยังไม่เปิด');return {cards:ids.map(i=>revealCard(i-1))};}});
}
