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
function newReadingId(){
  if(crypto.randomUUID)return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const h=[...b].map(n=>n.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
let readingId=newReadingId(), spreadCharged=false, chargeInProgress=false;
let savedLang='th';try{savedLang=localStorage.getItem('moonlit_language')||'th';}catch{};window.MoonlitLang=savedLang==='en'?'en':'th';
const isEnglish=()=>window.MoonlitLang==='en';
const LL=(th,en)=>isEnglish()?en:th;
const enZodiacPositions=['Self · 1st House','Finances · 2nd House','Communication · 3rd House','Home · 4th House','Creativity · 5th House','Challenges · 6th House','Partnerships · 7th House','Transformation · 8th House','Learning · 9th House','Career · 10th House','Fortune · 11th House','Hidden matters · 12th House'];
const enZodiacShort=['Self','Money','Nearby','Home','Creation','Challenges','Partners','Loss','Far away','Career','Luck','Hidden'];
const enZodiacDetails=[
'Identity, birth, personality, subconscious patterns, personal strengths, weaknesses, environment and self-confidence.',
'Income, resources, money habits, possessions, personal tastes, collecting and eating.',
'Neighbors, siblings, short trips, communication, vehicles, phones and early education.',
'Family background, birthplace, mother, childhood upbringing and its influence today.',
'Investments, speculation, stocks, competition, sport, entertainment, romance and dating.',
'Challenges, colleagues and staff, pets, health concerns, daily problems and leaving a job.',
'Partners, spouses, contracts, bosses, open rivals and direct opponents.',
'Loss, endings, damage, illness, hospitals, shared assets, inheritance and difficult changes.',
'Long journeys, foreign countries, spiritual beliefs, teachers, university and specialist training.',
'Career, public life, father, coworkers, achievements, reputation, business and social image.',
'Gifts, opportunities, helpful groups, associations and unexpected good fortune.',
'Secrets, solitude, confinement, private fears, hidden opposition and what we do not show.'
];
const enThree=['Past','Present','Potential'];
function cardCopy(card){
 if(!isEnglish()) return card;
 const translation=window.MOONLIT_EN_CARDS?.[CARDS.indexOf(card)];
 return {...card,thai:'',keywords:translation?.keywords||'',meaning:translation?.meaning||'',group:card.group};
}
const uiLabels={
  hero:['คืนนี้ ไพ่มีอะไรอยากบอกคุณ','What do the cards have to tell you tonight?'],
  intro:['ตั้งคำถามในใจ แล้วให้ไพ่เป็นพื้นที่เล็ก ๆ สำหรับการทบทวน','Hold a question in mind. Let the cards offer a moment for reflection.'],
  mode1:['เปิด 1 ใบ','1 Card'],mode1s:['ข้อความสำหรับคุณ','A message for you'],
  mode3:['เปิด 3 ใบ','3 Cards'],mode3s:['อดีต · ปัจจุบัน · แนวโน้ม','Past · Present · Potential'],
  mode10:['เปิด 10 ใบ','10 Cards'],mode10s:['ผังอายุ · วงจรชีวิต','Life cycles · Age spread'],
  mode12:['เปิด 12 ใบ','12 Cards'],mode12s:['จักรราศี · 12 เรือนชีวิต','Astrological · 12 Houses'],
  deckcaption:['78 ใบ ✦ เปิดไพ่ตั้งตรง','78 cards ✦ Upright readings'],
  interpretation:['ความหมายไพ่','Card interpretation'],prev:['← ใบก่อนหน้า','← Previous'],next:['ใบถัดไป →','Next →'],
  disclaimer:['สำหรับความบันเทิงและการทบทวนใจ ไม่ใช่คำทำนายที่แน่นอน','For entertainment and personal reflection, not guaranteed predictions.'],
  chat:['แชทกับแม่หมอ','Live reader'],
  loginTitle:['เข้าสู่ระบบ Moonlit','Sign in to Moonlit'],authHint:['สมัครบัญชีเพื่อรับเครดิตฟรี 5 ครั้ง (ครั้งเดียวต่อบัญชี)','Create an account for 5 free readings (one-time welcome bonus).'],
  signin:['เข้าสู่ระบบ','Sign in'],signup:['สมัครสมาชิก','Create account'],email:['อีเมล','Email'],password:['รหัสผ่าน (อย่างน้อย 6 ตัว)','Password (min. 6 characters)'],
  creditTitle:['เครดิตการเปิดไพ่','Reading credits'],creditsUnit:['เครดิต','credits'],
  creditHint:['สมาชิกใหม่ได้ 5 ครั้งฟรี · เปิด 1 รอบใช้ 1 เครดิต ไม่ว่าจะวางกี่ใบ · หักเมื่อพลิกใบแรก','New members get 5 free readings. One spread costs 1 credit, regardless of card count. Charged on first flip.'],
  priceSoon:['เปิดราคาเร็ว ๆ นี้','Pricing coming soon'],manualTopup:['ระบบชำระเงินอัตโนมัติยังไม่เปิดใช้งาน ติดต่อแม่หมอเพื่อสอบถามการเติมเครดิต (ตรวจสอบยอดก่อนเพิ่มเครดิต)','Automatic checkout is not live yet. Contact the reader for manual credit top-ups after payment verification.'],
  contactReader:['ติดต่อแม่หมอ','Contact reader'],chatTitle:['พูดคุยกับแม่หมอ ☾','Chat with a real reader ☾'],
  welcomePolicy:['ทักทายและสอบถามบริการได้ฟรี · คำอ่านดวงส่วนตัวแบบชำระเงินยังไม่เปิดอัตโนมัติ · แม่หมอตอบด้วยตัวเองเมื่อออนไลน์','Greetings and service questions are free. Paid personal readings are not auto-activated; a real human replies when available.'],
  inbox:['กล่องข้อความลูกค้า','Customer inbox'],reload:['รีเฟรช','Refresh'],customerId:['รหัสบัญชีลูกค้า','Customer ID'],topupAmount:['จำนวนเครดิต','Credits'],
  grant:['เพิ่มเครดิตหลังตรวจยอด','Grant after verification'],reopenRoom:['เปิดห้องแชท','Open chat'],closeRoom:['ปิดห้องแชท','Close chat'],imageCredit:['ภาพ Rider–Waite–Smith · Pamela Colman Smith, 1909 ·','Rider–Waite–Smith art · Pamela Colman Smith, 1909 ·'],imageSource:['ที่มาภาพไพ่','Image source'],startChat:['เข้าสู่ระบบเพื่อเริ่มแชท','Sign in to start chatting'],chatInput:['ข้อความ','Message'],send:['ส่ง','Send']
};
function updateLangUI(){
 document.documentElement.lang=isEnglish()?'en':'th';
 document.querySelectorAll('[data-i18n]').forEach(el=>{let words=uiLabels[el.dataset.i18n];if(words)el.textContent=words[isEnglish()?1:0];});
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===window.MoonlitLang)));
 document.getElementById('spread-title').textContent=currentSpread().title;
 [...slots.children].forEach((slot,i)=>{
   const label=count===10?String(i+1):count===12?(isEnglish()?enZodiacShort[i]:zodiacShortLabels[i]):positionName(i);
   const labelEl=slot.querySelector('.position-label');if(labelEl)labelEl.textContent=count===1?'':label;
   const hint=slot.querySelector('.card-hint');
   if(hint) hint.textContent=(!revealed.has(i) ? (phase==='ready'||phase==='revealed'?LL('แตะเพื่อเปิดไพ่','Tap to reveal'):count===1?LL('ไพ่ของคุณ','Your card'):count===10?'':LL(`ใบที่ ${i+1}`,`Card ${i+1}`)):(count>=10?LL('แตะอีกครั้งเพื่ออ่าน','Tap again to read'):drawn[i]?.name||''));
 });
 if(detailDialog.open && activeDetailIndex>=0)updateCardDetail(activeDetailIndex);
 if(!reading.hidden)renderReading();
 const sb=shuffleButton.querySelector('span');
 sb.textContent=phase==='shuffling'?LL('กำลังสับไพ่…','Shuffling…'):phase==='idle'?LL('สับไพ่','Shuffle'):LL('สับไพ่ใหม่','Shuffle again');
 statusText.textContent=phase==='idle'?LL('หายใจเข้าลึก ๆ แล้วกดสับไพ่เมื่อพร้อม','Take a moment and shuffle when ready'):
   phase==='shuffling'?LL('กำลังสับไพ่…','Shuffling…'):
   revealed.size===count?LL('เปิดครบแล้ว · แตะไพ่เพื่ออ่าน','All cards revealed · Tap a card to read'):
   LL(`เปิดแล้ว ${revealed.size}/${count} ใบ · แตะไพ่เพื่ออ่าน`,`Revealed ${revealed.size}/${count} · Tap a card to read`);
}
window.setMoonlitLanguage=code=>{
 window.MoonlitLang=code==='en'?'en':'th';try{localStorage.setItem('moonlit_language',window.MoonlitLang);}catch{}updateLangUI();
 window.dispatchEvent(new Event('moonlit:language'));
};


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
  return count===3?(isEnglish()?enThree[i]:threePositions[i]):count===12?(isEnglish()?enZodiacPositions[i]:zodiacPositions[i]):count===1?LL('ข้อความสำหรับคุณ','Your message'):LL(`ตำแหน่งที่ ${i+1}`,`Position ${i+1}`);
}

function positionDetail(i){
  return count===12 ? (isEnglish()?enZodiacDetails[i]:zodiacDetails[i]) : '';
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
    ?LL(`ตำแหน่งที่ ${i+1} · ผังอายุ`,`Position ${i+1} · Life age spread`)
    :count===12?LL(`เรือนที่ ${i+1} · ${zodiacPositions[i]}`,`House ${i+1} · ${enZodiacPositions[i]}`)
    :positionName(i);
  const display=cardCopy(card);
  detailName.textContent=card.name;
  detailThai.textContent=display.thai;
  detailThai.hidden=isEnglish();
  detailCaption.textContent=card.group;
  detailKeywords.textContent=display.keywords||'';
  detailMeaning.textContent=display.meaning||LL('ยังไม่มีคำอธิบายสำหรับไพ่ใบนี้','No interpretation available yet');

  if(count===10){
    detailContext.hidden=false;
    detailContext.textContent=LL(`ช่วงอายุที่เกี่ยวข้อง: ${agePositions[i]}`,`Related ages: ${agePositions[i].replace('อายุ ','')}`);
  }else if(count===12){
    detailContext.hidden=false;
    detailContext.textContent=LL(`ขอบเขตของเรือน: ${zodiacDetails[i]}`,`House themes: ${enZodiacDetails[i]}`);
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
  detailCounter.textContent=LL(`ใบที่ ${i+1} · เปิดแล้ว ${opened.length}/${count}`,`Card ${i+1} · Revealed ${opened.length}/${count}`);
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
    const label=count===1?'':(count===10?String(i+1):count===12?(isEnglish()?enZodiacShort[i]:zodiacShortLabels[i]):positionName(i));
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
      <div class="card-hint">${count===1?LL('ไพ่ของคุณ','Your card'):count===10?'':LL(`ใบที่ ${i+1}`,`Card ${i+1}`)}</div>`;

    slot.querySelector('button').addEventListener('click',()=>revealCard(i));
    slots.append(slot);
  }

  reading.hidden=true;
  reading.replaceChildren();
}

function setCount(next){
  if(phase==='shuffling'||chargeInProgress) return false;
  if(next!==count && spreadCharged && revealed.size<count && !confirm(LL('กำลังเปลี่ยนชุดไพ่ก่อนเปิดครบ เครดิตที่ใช้ไปจะไม่คืน ยืนยันไหม?','You are leaving an unfinished reading. The credit already used will not be refunded. Continue?')))return false;
  closeCardDetail();
  if(![1,3,10,12].includes(next)) throw new Error('เลือกได้เฉพาะ 1, 3, 10 หรือ 12 ใบ');

  count=next;
  readingId=newReadingId();spreadCharged=false;chargeInProgress=false;
  phase='idle';
  drawn=[];
  revealed.clear();

  modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.count)===count)));
  document.getElementById('spread-title').textContent=currentSpread().title;
  statusText.textContent=LL('หายใจเข้าลึก ๆ แล้วกดสับไพ่เมื่อพร้อม','Take a moment and shuffle when ready');
  shuffleButton.querySelector('span').textContent=LL('สับไพ่','Shuffle');
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
  if(phase==='shuffling'||chargeInProgress) return false;
  if(spreadCharged && revealed.size<count && !confirm(LL('สับชุดใหม่จะเริ่มการอ่านใหม่ โดยเครดิตรอบนี้จะไม่คืน ยืนยันไหม?','A new shuffle starts a new reading. Your current credit will not be refunded. Continue?')))return false;
  closeCardDetail();

  phase='shuffling';
  readingId=newReadingId();spreadCharged=false;chargeInProgress=false;
  revealed.clear();
  drawn=drawDeck();
  renderSlots();

  shuffleButton.disabled=true;
  modeButtons.forEach(b=>b.disabled=true);
  shuffleButton.querySelector('span').textContent=LL('กำลังสับไพ่…','Shuffling…');
  statusText.textContent=LL('นึกถึงคำถามของคุณสักครู่','Hold your question in mind');
  slots.classList.add('shuffling');

  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?120:1350));

  slots.classList.remove('shuffling');
  phase='ready';
  shuffleButton.disabled=false;
  modeButtons.forEach(b=>b.disabled=false);
  shuffleButton.querySelector('span').textContent=LL('สับไพ่ใหม่','Shuffle again');

  [...slots.children].forEach((slot,i)=>{
    const btn=slot.querySelector('button');
    btn.disabled=false;
    btn.setAttribute('aria-label',LL(`เปิดไพ่ ${positionName(i)}`,`Reveal ${positionName(i)}`));
    slot.querySelector('.card-hint').textContent=LL('แตะเพื่อเปิดไพ่','Tap to reveal');
  });

  statusText.textContent=LL('ไพ่พร้อมแล้ว · แตะเปิดไพ่ จากนั้นแตะอีกครั้งเพื่ออ่าน','Cards ready · Tap to reveal, then tap again to read');

  return true;
}

async function revealCard(i){
  if(!['ready','revealed'].includes(phase)||!Number.isInteger(i)||i<0||i>=count) return null;
  if(revealed.has(i)){
    if(count===10||count===12) openCardDetail(i);
    return null;
  }

  // Charge only once on the FIRST flip of this spread. No client-side balance authority.
  if(!spreadCharged){
    if(chargeInProgress) return null;
    chargeInProgress=true;
    try{
      const ok=await window.MoonlitPlatform?.consumeReading({
        id:readingId,spread:count,cards:drawn.map(c=>CARDS.indexOf(c))
      });
      if(ok===false) return null;
      spreadCharged=true;
    }catch(error){
      statusText.textContent=LL('ไม่สามารถตรวจสอบเครดิตได้: ','Unable to verify credits: ')+(error.message||error);
      return null;
    }finally{chargeInProgress=false;}
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
  slot.querySelector('.card-hint').textContent=modalMode?LL('แตะอีกครั้งเพื่ออ่าน','Tap again to read'):c.name;

  revealed.add(i);
  if(!modalMode) renderReading();

  if(revealed.size===count){
    phase='revealed';
    statusText.textContent=LL('เปิดครบแล้ว · แตะไพ่เพื่อดูคำอ่าน','All cards revealed · Tap a card to read');
  }else{
    statusText.textContent=LL(`เปิดแล้ว ${revealed.size}/${count} ใบ · แตะไพ่ที่หงายเพื่ออ่าน`,`Revealed ${revealed.size}/${count} · Tap a face-up card to read`);
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
      article.textContent=positionName(i)+' · '+LL('รอเปิดไพ่','Awaiting reveal');
    }else{
      const c=cardCopy(drawn[i]);
      const prefix=count===1?'':positionName(i)+' · ';
      const houseDetail=count===12?`<p class="house-detail">${positionDetail(i)}</p>`:'';
      const ageDetail=count===10?`<p class="age-detail">${LL('ช่วงอายุที่เกี่ยวข้อง','Related ages')}: ${agePositions[i].replace('อายุ ','')}</p>`:'';
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

window.MoonlitCore={getState:()=>({count,phase,revealed:revealed.size,readingId,spreadCharged}),setCount,shuffle};
modeButtons.forEach(b=>b.addEventListener('click',()=>setCount(Number(b.dataset.count))));
shuffleButton.addEventListener('click',shuffle);
renderSlots();
updateLangUI();

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
    execute:async input=>{
      const ids=input?.positions;
      if(
        !Array.isArray(ids)||!ids.length||ids.length>count||
        new Set(ids).size!==ids.length||
        ids.some(i=>!Number.isInteger(i)||i<1||i>count||revealed.has(i-1))||
        phase!=='ready'
      ) throw new Error('กรุณาสับไพ่และเลือกตำแหน่งที่ยังไม่เปิด');
      const results=[];for(const i of ids)results.push(await revealCard(i-1));return {cards:results};
    }
  });
}
