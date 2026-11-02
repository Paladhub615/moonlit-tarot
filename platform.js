'use strict';
/* Moonlit Tarot customer accounts, server-enforced credits, and human real-time chat.
   Supabase publishable/anon key is public; privileges are enforced by RLS and SQL RPC. */
(() => {
  const $ = id => document.getElementById(id);
  const label = (th,en) => window.MoonlitLang === 'en' ? en : th;
  const cfg=window.MOONLIT_CONFIG || {};
  const configured=/^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'') &&
    typeof cfg.supabaseAnonKey==='string' && cfg.supabaseAnonKey.trim().length>20;
  const ready=Boolean(configured && window.supabase?.createClient);
  const client=ready ? window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}) : null;
  let session=null,admin=false,profile=null,roomId=null,chatChannel=null,roomChannel=null,profileChannel=null;
  let authMode='signin',adminRoomSelected=null,busy=false;
  const authDialog=$('auth-dialog'),creditDialog=$('credits-dialog'),chatDialog=$('chat-dialog');
  const errorText=e=>{
    const msg=e?.message||String(e||'');
    if(msg.includes('NO_CREDITS'))return label('เครดิตฟรีหมดแล้ว กรุณาติดต่อแม่หมอเพื่อเติมเครดิต','No credits left. Contact the reader to top up.');
    if(msg.includes('LOGIN_REQUIRED'))return label('กรุณาเข้าสู่ระบบ','Please sign in');
    return msg;
  };
  function show(d){if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}}
  function close(d){if(d.open){if(d.close)d.close();else d.removeAttribute('open');}}
  function showServiceMessage(kind,value){$(kind).textContent=value;}
  function updateHeader(){
    $('auth-open').textContent=session?label('ออกจากระบบ','Sign out'):label('เข้าสู่ระบบ','Sign in');
    $('credit-count').textContent=ready?(session?(profile?.credits??'—'):'5*'): 'DEMO';
    $('credit-detail').textContent=ready?(session?(profile?.credits??'—'):'—'):'—';
  }
  function updateSetup(){
    const banner=$('setup-banner');
    if(ready){banner.hidden=true;return;}
    banner.hidden=false;
    banner.textContent=label('โหมดทดลอง: ยังไม่ได้ตั้งค่า Supabase ใน config.js · เปิดไพ่ทดสอบได้ แต่ระบบสมาชิก เครดิต และแชทยังไม่เชื่อมต่อ',
      'Preview mode: configure Supabase in config.js to activate accounts, credits and live chat. Card reading is demo-only.');
  }
  function needsBackend(){
    if(ready)return false;
    showServiceMessage('auth-message',label('ยังไม่ตั้งค่า Supabase: เปิดไฟล์ config.js ใส่ URL + publishable key และรัน setup.sql','Supabase is not configured: add your project URL and publishable key to config.js, then run setup.sql.'));
    return true;
  }
  function requireSession(){
    if(needsBackend()){show(authDialog);return false;}
    if(!session){show(authDialog);return false;}
    return true;
  }
  async function refreshProfile(){
    if(!session)return;
    const {data,error}=await client.from('profiles').select('user_id,credits').eq('user_id',session.user.id).single();
    if(error){console.warn('Profile lookup:',error.message);profile=null;}
    else profile=data;
    updateHeader();
  }
  async function refreshAuth(){
    if(!ready)return;
    const {data:{session:active},error}=await client.auth.getSession();
    if(error)console.warn('Auth:',error.message);
    const oldUser=session?.user?.id;
    session=active;
    if(!session){
      profile=null;admin=false;roomId=null;adminRoomSelected=null;
      if(profileChannel){client.removeChannel(profileChannel);profileChannel=null;}
      if(roomChannel){client.removeChannel(roomChannel);roomChannel=null;}
      if(chatChannel){client.removeChannel(chatChannel);chatChannel=null;}
      $('chat-admin').hidden=true;$('chat-messages').replaceChildren();
      updateHeader();return;
    }
    if(oldUser && oldUser!==session.user.id){roomId=null;adminRoomSelected=null;}
    const {data:admins}=await client.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
    admin=Boolean(admins);
    $('chat-admin').hidden=!admin;
    await refreshProfile();
    if(profileChannel)client.removeChannel(profileChannel);
    profileChannel=client.channel('moonlit-credit-'+session.user.id)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:`user_id=eq.${session.user.id}`},refreshProfile)
      .subscribe();
  }
  async function consumeReading({id,spread,cards}){
    if(!ready)return true;  // visible PREVIEW only; does not pretend to enforce credits.
    if(!requireSession())return false;
    if(!profile||profile.credits<=0){await refreshProfile();}
    if(!profile || profile.credits<=0){
      show(creditDialog);
      return false;
    }
    const {data,error}=await client.rpc('consume_moonlit_reading',{
      p_reading_id:id,p_spread_count:spread,p_card_ids:cards
    });
    if(error){
      showServiceMessage('chat-message-status',errorText(error));
      if(error.message?.includes('NO_CREDITS')){await refreshProfile();show(creditDialog);return false;}
      throw new Error(errorText(error));
    }
    profile.credits=Number(data);
    updateHeader();
    return true;
  }
  window.MoonlitPlatform={consumeReading,session:()=>session,client:()=>client};

  function switchAuth(mode){
    authMode=mode;
    $('signin-tab').classList.toggle('selected',mode==='signin');
    $('signup-tab').classList.toggle('selected',mode==='signup');
    $('auth-submit').textContent=label(mode==='signin'?'เข้าสู่ระบบ':'สมัครสมาชิก',mode==='signin'?'Sign in':'Create account');
    $('auth-password').autocomplete=mode==='signin'?'current-password':'new-password';
    $('auth-message').textContent='';
  }
  $('signin-tab').addEventListener('click',()=>switchAuth('signin'));
  $('signup-tab').addEventListener('click',()=>switchAuth('signup'));
  $('auth-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(needsBackend())return;
    const email=$('auth-email').value.trim(),password=$('auth-password').value;
    $('auth-submit').disabled=true;
    try{
      const result=authMode==='signin'
        ?await client.auth.signInWithPassword({email,password})
        :await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}});
      if(result.error)throw result.error;
      if(authMode==='signup' && !result.data.session){
        $('auth-message').textContent=label('สมัครแล้ว! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ','Account created. Please check your email to confirm before signing in.');
      }else{
        await refreshAuth();close(authDialog);
      }
    }catch(error){$('auth-message').textContent=errorText(error);}
    finally{$('auth-submit').disabled=false;}
  });
  $('auth-open').addEventListener('click',async()=>{
    if(session && ready){await client.auth.signOut();await refreshAuth();}
    else show(authDialog);
  });
  $('credits-open').addEventListener('click',()=>{if(requireSession())show(creditDialog);});
  $('credits-to-chat').addEventListener('click',()=>{close(creditDialog);openChat();});
  $('chat-open').addEventListener('click',openChat);
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close($(b.dataset.close))));
  [authDialog,creditDialog,chatDialog].forEach(d=>d.addEventListener('click',event=>{if(event.target===d)close(d);}));
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>window.setMoonlitLanguage(b.dataset.lang)));
  window.addEventListener('moonlit:language',()=>{
    updateHeader();updateSetup();switchAuth(authMode);
    $('chat-text').placeholder=label('พิมพ์ข้อความ…','Type a message…');
    if(session && chatDialog.open && admin) loadRooms();
  });

  async function openChat(){
    if(!requireSession())return;
    show(chatDialog);
    if(admin){
      $('chat-state').textContent=label('หลังบ้านแม่หมอ · ลูกค้าจริง','Reader dashboard · Human conversations');
      await loadRooms();
      if(!roomChannel){
        roomChannel=client.channel('moonlit-admin-rooms')
          .on('postgres_changes',{event:'*',schema:'public',table:'chat_rooms'},()=>{if(chatDialog.open)loadRooms();})
          .subscribe();
      }
    }else{
      $('chat-state').textContent=label('แชทต้อนรับฟรี · รอแม่หมอตอบ','Free welcome chat · A real reader replies when available');
      const {data,error}=await client.rpc('start_moonlit_chat');
      if(error){$('chat-message-status').textContent=errorText(error);return;}
      roomId=data;await loadMessages();subscribeMessages(roomId);
    }
  }
  async function loadRooms(){
    if(!admin||!session)return;
    const {data,error}=await client.from('chat_rooms').select('id,customer_id,status,created_at,updated_at')
      .order('updated_at',{ascending:false}).limit(100);
    if(error){$('chat-message-status').textContent=errorText(error);return;}
    const list=$('room-list');list.replaceChildren();
    if(!data?.length){list.textContent=label('ยังไม่มีลูกค้าทักมา','No customers yet');return;}
    data.forEach(room=>{
      const b=document.createElement('button');b.type='button';
      b.textContent='#'+room.customer_id.slice(0,8)+' · '+room.status;
      b.className=room.id===adminRoomSelected?'selected':'';
      b.addEventListener('click',()=>selectAdminRoom(room));list.append(b);
    });
  }
  async function selectAdminRoom(room){
    adminRoomSelected=room.id;roomId=room.id;
    $('chat-thread-title').textContent=label('ลูกค้า: ','Customer: ')+room.customer_id+' · '+room.status;
    $('topup-user-id').value=room.customer_id;
    await loadMessages();subscribeMessages(roomId);
    await loadRooms();
  }
  async function loadMessages(){
    if(!roomId)return;
    const {data,error}=await client.from('chat_messages').select('id,room_id,sender_id,body,created_at')
      .eq('room_id',roomId).order('created_at',{ascending:true}).limit(120);
    if(error){$('chat-message-status').textContent=errorText(error);return;}
    const box=$('chat-messages');box.replaceChildren();
    if(!data?.length){const p=document.createElement('p');p.className='service-muted';p.textContent=label('เริ่มคุยได้เลย แม่หมอจะตอบเมื่อออนไลน์','Say hello! The reader replies when available.');box.append(p);}
    else data.forEach(renderMessage);
    box.scrollTop=box.scrollHeight;
  }
  function renderMessage(m){
    const box=$('chat-messages');
    if(box.querySelector(`[data-message-id="${m.id}"]`))return;
    if(box.querySelector('.service-muted'))box.querySelector('.service-muted').remove();
    const bubble=document.createElement('div');bubble.className='chat-bubble'+(m.sender_id===session?.user?.id?' mine':'');bubble.dataset.messageId=String(m.id);
    const message=document.createElement('div');message.textContent=m.body;
    const time=document.createElement('small');time.textContent=new Date(m.created_at).toLocaleString(window.MoonlitLang==='en'?'en-US':'th-TH',{dateStyle:'short',timeStyle:'short'});
    bubble.append(message,time);box.append(bubble);box.scrollTop=box.scrollHeight;
  }
  function subscribeMessages(id){
    if(chatChannel)client.removeChannel(chatChannel);
    chatChannel=client.channel('moonlit-room-'+id+'-'+Math.random().toString(36).slice(2,8))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`room_id=eq.${id}`},payload=>{
        if(payload.new?.room_id===roomId)renderMessage(payload.new);
      }).subscribe();
  }
  $('reload-rooms').addEventListener('click',loadRooms);
  async function changeRoomStatus(status){
    if(!admin||!adminRoomSelected){$('chat-message-status').textContent=label('เลือกห้องแชทก่อน','Select a conversation first');return;}
    const {error}=await client.from('chat_rooms').update({status,updated_at:new Date().toISOString()}).eq('id',adminRoomSelected);
    if(error){$('chat-message-status').textContent=errorText(error);return;}
    $('chat-message-status').textContent=label('อัปเดตสถานะห้องแล้ว','Conversation status updated');
    const {data}=await client.from('chat_rooms').select('id,customer_id,status').eq('id',adminRoomSelected).single();
    if(data)await selectAdminRoom(data);
  }
  $('room-open').addEventListener('click',()=>changeRoomStatus('open'));
  $('room-close').addEventListener('click',()=>changeRoomStatus('closed'));
  $('chat-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!requireSession())return;
    const body=$('chat-text').value.trim();if(!body)return;
    if(!roomId){$('chat-message-status').textContent=label('เลือกห้องแชทก่อน','Select a conversation first');return;}
    if(busy)return;busy=true;$('chat-send').disabled=true;
    try{
      const {error}=await client.from('chat_messages').insert({room_id:roomId,sender_id:session.user.id,body});
      if(error)throw error;
      $('chat-text').value='';$('chat-message-status').textContent='';
      await loadMessages();
    }catch(e){$('chat-message-status').textContent=errorText(e);}
    finally{busy=false;$('chat-send').disabled=false;}
  });
  $('grant-credits').addEventListener('click',async()=>{
    if(!admin||!session)return;
    const user=$('topup-user-id').value.trim(),amount=Number($('topup-amount').value);
    if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(user)||!Number.isInteger(amount)||amount<1||amount>1000){
      $('chat-message-status').textContent=label('กรอก UUID และจำนวน 1–1000 ให้ถูกต้อง','Enter a valid customer UUID and amount (1–1000).');return;
    }
    if(!confirm(label(`ยืนยันว่าตรวจสอบการชำระเงินจริงแล้ว และเพิ่ม ${amount} เครดิตให้ลูกค้า ${user}?`,`Confirm VERIFIED payment, and grant ${amount} credits to customer ${user}?`)))return;
    const {data,error}=await client.rpc('admin_moonlit_grant_credits',{p_user_id:user,p_amount:amount,p_note:'Manually verified by reader'});
    $('chat-message-status').textContent=error?errorText(error):label(`เพิ่มแล้ว · คงเหลือ ${data} เครดิต`,`Granted · New balance: ${data} credits`);
  });

  if(ready){
    client.auth.onAuthStateChange(()=>setTimeout(refreshAuth,0));
    refreshAuth();
  }
  updateHeader();updateSetup();
  $('chat-text').placeholder=label('พิมพ์ข้อความ…','Type a message…');
})();
