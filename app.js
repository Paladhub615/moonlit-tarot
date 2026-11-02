'use strict';

const slots=document.getElementById('cards');
const reading=document.getElementById('reading');
const statusText=document.getElementById('status');
const shuffleButton=document.getElementById('shuffle');
const modeButtons=[...document.querySelectorAll('[data-count]')];
const detailDialog=document.getElementById('card-dialog');
const detailClose=document.getElementById('dialog-close');
const detailImage=document.getElementById('dialog-image');
const detailImageFallback=document.getElementById('dialog-image-fallback');
const detailPosition=document.getElementById('dialog-position');
const detailName=document.getElementById('dialog-card-name');
const detailThai=document.getElementById('dialog-thai-name');
const detailContext=document.getElementById('dialog-context');
const detailKeywords=document.getElementById('dialog-keywords');
const detailMeaning=document.getElementById('dialog-card-meaning');
const detailCaption=document.getElementById('dialog-figure-caption');
const detailPrev=document.getElementById('dialog-prev');
const detailNext=document.getElementById('dialog-next');
const detailCounter=document.getElementById('dialog-counter');
let activeDetailIndex=-1, returnFocus=null;
// Build popup-20261102-b: tap a face-up card to read it.

let count=1, phase='idle', drawn=[], revealed=new Set();

const agePositions=[
  'อายุ 10–14, 20–26',
  'อายุ 5–6, 15–16',
  'อายุ 8–9, 18–19, 28–29, 44–46, 62–64',
  'อายุ 0–3',
  'อายุ 4',
  'อายุ 7, 17, 27, 41–43, 59–61',
  'อายุ 30–33, 47–49, 65–67',
  'อายุ 34–36, 50–52, 68–70',
  'อายุ 37–39, 53–55, 71–73',
  'อายุ 40, 56–58, 74–76'
];

const threePositions=['อดีต','ปัจจุบัน','แนวโน้ม'];
const zodiacPositions=[
  'ตัวเรา · ตนุ',
  'ได้มา · กดุมภะ',
  'ใกล้ · สหัชชะ',
  'บ้าน · พันธุ',
  'การลงทุน · ปุตตะ',
  'อุปสรรค · อริ',
  'เขา · ปัตนิ',
  'เสียไป · มรณะ',
  'ไกล · ศุภะ',
  'สังคม · กัมมะ',
  'โชค · ลาภะ',
  'โดดเดี่ยว · วินาศ'
];

const zodiacShortLabels=['ตนุ','กดุมภะ','สหัชชะ','พันธุ','ปุตตะ','อริ','ปัตนิ','มรณะ','ศุภะ','กัมมะ','ลาภะ','วินาศ'];

const zodiacDetails=[
  'เจ้าชะตา การเกิด นิสัย บุคลิกภาพ จิตใต้สำนึก ความเข้มแข็ง อ่อนแอ สิ่งแวดล้อม ความเชื่อมั่น',
  'การได้มา รายได้ ลักษณะได้มายากหรือง่าย การเงิน ผู้ที่ให้มา รสนิยม ของสะสม การกิน',
  'เรื่องใกล้ตัว เพื่อนบ้าน พี่น้อง การเดินทาง การสื่อสาร ยานพาหนะ โทรศัพท์ การศึกษาระดับต้น',
  'บ้านเกิด แม่ พื้นเพ ถิ่นเกิด การเลี้ยงดูในวัยเด็ก และผลต่อปัจจุบัน',
  'การลงทุน การพนัน หุ้น การแข่งขัน กีฬา บันเทิง แฟน ความรัก',
  'อุปสรรค ลูกน้อง บริวาร สัตว์เลี้ยง โรค ปัญหา การเจ็บป่วย การลาออก',
  'คู่ คู่ครอง หุ้นส่วน คู่กรณี คู่อริ เจ้านาย ศัตรูที่เปิดเผย คู่สัญญา คู่ต่อสู้',
  'การเสียไป เสียหาย สูญหาย การจบสิ้น ป่วย เจ๊ง โรงพยาบาล มรดก แพ้ทาง รสนิยม คู่ครอง เจ้ากรรมนายเวร เดือดร้อน',
  'เรื่องไกล ต่างประเทศ ศาสนา พระ ครู ความรู้ระดับมหาวิทยาลัย วิชาชีพเฉพาะ การอบรม วัด ความเชื่อ',
  'การงาน สังคม พ่อ เพื่อนร่วมงาน ความสำเร็จ การแสดงออก สังคมมองเราอย่างไร ธุรกิจส่วนตัว ชื่อเสียง เจ้าของธุรกิจ',
  'โชคลาภ ลาภลอย การได้โชคลาภ การได้มาง่าย ได้จากกลุ่ม สมาคม',
  'ปิดบัง ซ่อนเร้น คับแคบ โดดเดี่ยว บั้นปลาย สถานที่ปิด ศัตรูไม่เปิดเผย สิ่งที่เราไม่แสดงออก การถูกกักหรือคุมขัง'
];

const spreads={
  1:{title:'ONE-CARD READING',className:'one',positions:['ข้อความสำหรับคุณ']},
  3:{title:'THREE-CARD READING',className:'three',positions:threePositions},
  10:{title:'LIFE AGE SPREAD · 10 CARDS',className:'ten',positions:Array.from({length:10},(_,i)=>`ตำแหน่งที่ ${i+1}`)},
  12:{title:'ASTROLOGICAL SPREAD · 12 HOUSES',className:'twelve',positions:zodiacPositions}
};

CARDS.forEach((c,i)=>{
  const codes={Wands:'wa',Cups:'cu',Swords:'sw',Pentacles:'pe'};
  c.image=i<22
    ?`images/ar${String(i).padStart(2,'0')}.webp`
    :`images/${codes[c.group.split(' ')[0]]}${String((i-22)%14+1).padStart(2,'0')}.webp`;
});

function currentSpread(){
  return spreads[count];
}

function positionName(i){
  return currentSpread().positions[i] || `ใบที่ ${i+1}`;
}

function positionDetail(i){
  return count===12 ? zodiacDetails[i] : '';
}

function closeCardDetail(){
  if(detailDialog.open){
    if(typeof detailDialog.close==='function') detailDialog.close();
    else detailDialog.removeAttribute('open');
  }
}

function openedIndices(){
  return [...revealed].sort((a,b)=>a-b);
}

function updateCardDetail(i){
  if(!revealed.has(i)) return;
  const card=drawn[i];
  const opened=openedIndices();
  const navIndex=opened.indexOf(i);
  activeDetailIndex=i;
  detailPosition.textContent=count===10
    ?`ตำแหน่งที่ ${i+1} · ผังอายุ`
    :count===12?`เรือนที่ ${i+1} · ${zodiacPositions[i]}`
    :positionName(i);
  detailName.textContent=card.name;
  detailThai.textContent=card.thai;
  detailCaption.textContent=card.group;
  detailKeywords.textContent=card.keywords||'';
  detailMeaning.textContent=card.meaning||'ยังไม่มีคำอธิบายสำหรับไพ่ใบนี้';

  if(count===10){
    detailContext.hidden=false;
    detailContext.textContent=`ช่วงอายุที่เกี่ยวข้อง: ${agePositions[i]}`;
  }else if(count===12){
    detailContext.hidden=false;
    detailContext.textContent=`ขอบเขตของเรือน: ${zodiacDetails[i]}`;
  }else{
    detailContext.hidden=true;
    detailContext.textContent='';
  }

  detailImage.hidden=false;
  detailImageFallback.hidden=true;
  detailImage.alt=`ภาพไพ่ ${card.name} — ${card.thai}`;
  detailImage.src=card.image;
  // If the local image is missing, retain the full text reading.
  if(detailImage.complete && detailImage.naturalWidth===0){
    detailImage.hidden=true;
    detailImageFallback.hidden=false;
  }

  detailPrev.disabled=navIndex<=0;
  detailNext.disabled=navIndex>=opened.length-1;
  detailCounter.textContent=`ใบที่ ${i+1} · เปิดแล้ว ${opened.length}/${count}`;
}

function openCardDetail(i){
  if(!revealed.has(i)) return;
  returnFocus=slots.children[i]?.querySelector('button')||document.activeElement;
  updateCardDetail(i);
  if(!detailDialog.open){
    if(typeof detailDialog.showModal==='function') detailDialog.showModal();
    else detailDialog.setAttribute('open','');
  }
  detailClose.focus({preventScroll:true});
}

function navigateDetail(direction){
  const opened=openedIndices();
  const next=opened[opened.indexOf(activeDetailIndex)+direction];
  if(Number.isInteger(next)) updateCardDetail(next);
}

detailClose.addEventListener('click',closeCardDetail);
detailPrev.addEventListener('click',()=>navigateDetail(-1));
detailNext.addEventListener('click',()=>navigateDetail(1));
detailImage.addEventListener('error',()=>{
  detailImage.hidden=true;
  detailImageFallback.hidden=false;
});
detailDialog.addEventListener('click',event=>{
  if(event.target===detailDialog) closeCardDetail();
});
detailDialog.addEventListener('close',()=>{
  const focusTarget=returnFocus;
  returnFocus=null;
  activeDetailIndex=-1;
  if(focusTarget&&focusTarget.isConnected) focusTarget.focus({preventScroll:true});
});
detailDialog.addEventListener('keydown',event=>{
  if(event.target.closest('button')) return;
  if(event.key==='ArrowLeft') navigateDetail(-1);
  if(event.key==='ArrowRight') navigateDetail(1);
});

function renderSlots(){
  const spread=currentSpread();
  slots.className=`cards ${spread.className}`;
  slots.replaceChildren();

  for(let i=0;i<count;i++){
    const slot=document.createElement('div');
    slot.className=`card-slot pos-${i+1}`;
    const label=count===1?'':(count===10?String(i+1):count===12?zodiacShortLabels[i]:positionName(i));
    const detail='';

    slot.innerHTML=`
      <div class="position-label${count===10?' number-label':''}">${label}${detail?`<small>${detail}</small>`:''}</div>
      <button type="button" class="card" disabled aria-label="ไพ่ใบที่ ${i+1} กรุณาสับไพ่ก่อน">
        <span class="card-body">
          <span class="face back" aria-hidden="true">
            <span class="ornament">
              <span class="tiny">✦ · ✦</span>
              <span class="orb">☾</span>
              <span class="card-motto">MOONLIT<br>TAROT</span>
              <span class="tiny">· ✦ ·</span>
            </span>
          </span>
          <span class="face front"></span>
        </span>
      </button>
      <div class="card-hint">${count===1?'ไพ่ของคุณ':count===10?'':`ใบที่ ${i+1}`}</div>`;

    slot.querySelector('button').addEventListener('click',()=>revealCard(i));
    slots.append(slot);
  }

  reading.hidden=true;
  reading.replaceChildren();
}

function setCount(next){
  if(phase==='shuffling') return false;
  closeCardDetail();
  if(![1,3,10,12].includes(next)) throw new Error('เลือกได้เฉพาะ 1, 3, 10 หรือ 12 ใบ');

  count=next;
  phase='idle';
  drawn=[];
  revealed.clear();

  modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.count)===count)));
  document.getElementById('spread-title').textContent=currentSpread().title;
  statusText.textContent='หายใจเข้าลึก ๆ แล้วกดสับไพ่เมื่อพร้อม';
  shuffleButton.querySelector('span').textContent='สับไพ่';
  renderSlots();
  return true;
}

function randomIndex(max){
  const array=new Uint32Array(1);
  const limit=Math.floor(4294967296/max)*max;
  do{crypto.getRandomValues(array);}while(array[0]>=limit);
  return array[0]%max;
}

function drawDeck(){
  const deck=[...CARDS];
  for(let i=deck.length-1;i>0;i--){
    const j=randomIndex(i+1);
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck.slice(0,count);
}

async function shuffle(){
  if(phase==='shuffling') return false;
  closeCardDetail();

  phase='shuffling';
  revealed.clear();
  drawn=drawDeck();
  renderSlots();

  shuffleButton.disabled=true;
  modeButtons.forEach(b=>b.disabled=true);
  shuffleButton.querySelector('span').textContent='กำลังสับไพ่…';
  statusText.textContent=count>=10?'นึกถึงภาพรวมของคำถาม แล้วค่อย ๆ วางใจไว้กับสำรับ':'นึกถึงคำถามของคุณสักครู่';
  slots.classList.add('shuffling');

  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?120:1350));

  slots.classList.remove('shuffling');
  phase='ready';
  shuffleButton.disabled=false;
  modeButtons.forEach(b=>b.disabled=false);
  shuffleButton.querySelector('span').textContent='สับไพ่ใหม่';

  [...slots.children].forEach((slot,i)=>{
    const btn=slot.querySelector('button');
    btn.disabled=false;
    btn.setAttribute('aria-label',`เปิดไพ่ ${positionName(i)}`);
    slot.querySelector('.card-hint').textContent='แตะเพื่อเปิดไพ่';
  });

  statusText.textContent=count===1
    ?'ไพ่พร้อมแล้ว แตะไพ่เพื่อเปิดคำตอบ'
    :(count>=10?'แตะเพื่อพลิกไพ่ แล้วแตะไพ่ที่หงายอีกครั้งเพื่อดูภาพและคำอ่าน':`ไพ่พร้อมแล้ว ${count} ใบ · แตะเปิดทีละใบตามใจคุณ`);

  return true;
}

function revealCard(i){
  if(!['ready','revealed'].includes(phase)||!Number.isInteger(i)||i<0||i>=count) return null;
  if(revealed.has(i)){
    if(count===10||count===12) openCardDetail(i);
    return null;
  }

  const c=drawn[i];
  const slot=slots.children[i];
  const button=slot.querySelector('button');
  const front=slot.querySelector('.front');

  const img=new Image();
  img.alt=c.name+' — '+c.thai;
  img.src=c.image;
  img.addEventListener('error',()=>{
    const fallback=document.createElement('span');
    fallback.className='image-error';
    fallback.textContent='โหลดภาพไม่สำเร็จ · '+c.name;
    front.append(fallback);
  });

  front.append(img);
  button.classList.add('flipped');
  const modalMode=count===10||count===12;
  button.disabled=!modalMode;
  button.setAttribute('aria-label',modalMode?`ดูภาพและความหมายไพ่ ${c.name} ${c.thai}`:c.name+' '+c.thai);
  button.setAttribute('aria-haspopup',modalMode?'dialog':'false');
  slot.querySelector('.card-hint').textContent=modalMode?'แตะอีกครั้งเพื่ออ่าน':c.name;

  revealed.add(i);
  if(!modalMode) renderReading();

  if(revealed.size===count){
    phase='revealed';
    statusText.textContent=count>=10?'เปิดครบแล้ว · แตะไพ่ใบใดก็ได้เพื่อดูภาพและความหมาย':'เปิดครบแล้ว ค่อย ๆ อ่านภาพรวม แล้วเลือกเก็บสิ่งที่มีความหมายกับคุณ';
  }else{
    statusText.textContent=count>=10?`เปิดแล้ว ${revealed.size}/${count} ใบ · แตะไพ่ที่หงายเพื่ออ่าน หรือเปิดไพ่ใบถัดไป`:`เปิดแล้ว ${revealed.size} จาก ${count} ใบ · แตะไพ่ที่เหลือได้เลย`;
  }

  return {position:positionName(i),name:c.name,thai:c.thai,meaning:c.meaning};
}

function renderReading(){
  reading.hidden=false;
  reading.className=`reading ${currentSpread().className}`;
  reading.style.setProperty('--cols',count===1?1:count===3?3:count===10?2:3);
  reading.replaceChildren();

  for(let i=0;i<count;i++){
    const article=document.createElement('article');
    article.className='meaning';

    if(!revealed.has(i)){
      article.classList.add('waiting');
      article.textContent=positionName(i)+' · รอเปิดไพ่';
    }else{
      const c=drawn[i];
      const prefix=count===1?'':positionName(i)+' · ';
      const houseDetail=count===12?`<p class="house-detail">${positionDetail(i)}</p>`:'';
      const ageDetail=count===10?`<p class="age-detail">ช่วงอายุที่เกี่ยวข้อง: ${agePositions[i]}</p>`:'';
      article.innerHTML=`
        <div class="meaning-label">${prefix}${c.group}</div>
        <h2>${c.name}</h2>
        <p class="thai-name">${c.thai}</p>
        ${houseDetail}
        ${ageDetail}
        <p class="keywords">${c.keywords}</p>
        <p class="description">${c.meaning}</p>`;
    }

    reading.append(article);
  }
}

modeButtons.forEach(b=>b.addEventListener('click',()=>setCount(Number(b.dataset.count))));
shuffleButton.addEventListener('click',shuffle);
renderSlots();

if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const register=tool=>{
    try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  };

  register({
    name:'shuffle_tarot',
    title:'เลือกจำนวนและสับไพ่',
    description:'เริ่มไพ่ชุดใหม่ เลือก 1, 3, 10 หรือ 12 ใบและสับไพ่ โดยโหมด 10 ใบใช้ผังช่วงอายุ และโหมด 12 ใบใช้ผังจักรราศี 12 เรือน',
    inputSchema:{
      type:'object',
      properties:{count:{type:'integer',enum:[1,3,10,12]}},
      required:['count'],
      additionalProperties:false
    },
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:async input=>{
      if(!input||![1,3,10,12].includes(input.count)) throw new Error('count ต้องเป็น 1, 3, 10 หรือ 12');
      if(phase==='shuffling') throw new Error('กำลังสับไพ่');
      setCount(input.count);
      await shuffle();
      return {count,phase};
    }
  });

  register({
    name:'reveal_tarot',
    title:'เปิดไพ่ที่เลือก',
    description:'เปิดไพ่ตามหมายเลขตำแหน่ง เริ่มนับจาก 1 หลังสับไพ่ แล้วแสดงภาพและความหมาย',
    inputSchema:{
      type:'object',
      properties:{
        positions:{
          type:'array',
          items:{type:'integer',minimum:1,maximum:12},
          minItems:1,
          maxItems:12,
          uniqueItems:true
        }
      },
      required:['positions'],
      additionalProperties:false
    },
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:input=>{
      const ids=input?.positions;
      if(
        !Array.isArray(ids)||!ids.length||ids.length>count||
        new Set(ids).size!==ids.length||
        ids.some(i=>!Number.isInteger(i)||i<1||i>count||revealed.has(i-1))||
        phase!=='ready'
      ) throw new Error('กรุณาสับไพ่และเลือกตำแหน่งที่ยังไม่เปิด');
      return {cards:ids.map(i=>revealCard(i-1))};
    }
  });
}
