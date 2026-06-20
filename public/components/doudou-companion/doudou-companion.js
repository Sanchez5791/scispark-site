/* ============================================================
 * /components/doudou-companion/doudou-companion.js
 * 豆豆陪伴系统 · pilot engine (opt-in, shared module)
 *
 * PLUG, NOT COPY: this is ONE shared file. A lesson opts in with
 *   <link rel="stylesheet" href="/components/doudou-companion/doudou-companion.css">
 *   <script>window.DOUDOU_LESSON = { ...data... }</script>
 *   <script src="/components/doudou-companion/doudou-companion.js"></script>
 * It does NOT modify lesson-shell-v4.js. It wraps window.submitAnswer /
 * window.showScreen the same decorator way the lesson already does.
 *
 * Persona (locked by 军师 blueprint 2026-06-20):
 *   豆豆 = 16, tough-but-soft, geeky, a senior on the student's side.
 *   Short lines. Never: 宝贝/乖/你最棒/你好聪明/你太笨.
 *   Praises the ACTION, not talent. Never accuses ("你又错了"/"你太慢").
 *
 * Red lines honoured:
 *  1 never gives the final answer (level-3 leaves the last step blank)
 *  2 praise bound to a concrete action
 *  3 not noisy — quiet by default between key moments; quiet mode silences
 *  4 not childish — small DouDou, white UI
 *  5 not surveillance — parent card shows progress evidence, never error detail
 *  6 maintainable — question-TYPE templates frame the hints; lessons supply data
 * ============================================================ */
(function () {
  'use strict';

  var L = window.DOUDOU_LESSON;
  if (!L || !Array.isArray(L.tryQuestions) || !L.tryQuestions.length) return;
  var LID = L.lessonId || 'lesson';

  /* ---------- tiny helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function lsGet(k, d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function now(){ return Date.now(); }

  /* bilingual span pair — zh follows the lesson's global EN/中文 toggle (.zh) */
  function bi(enCls, en, zhCls, zh){
    return '<span class="'+enCls+'">'+esc(en)+'</span>'+
           (zh? '<span class="'+zhCls+' zh">'+esc(zh)+'</span>':'');
  }
  function pose(mood){
    try{ if(window.renderDoudou) return window.renderDoudou(mood, {size:44, className:'dd-avatar'}); }catch(e){}
    return '<div class="dd-avatar"></div>';
  }

  /* ---------- intensity / quiet mode ---------- */
  var MODES = ['quiet','normal','support'];
  function getMode(){ var m=lsGet('dd_mode_'+LID, null); return MODES.indexOf(m)>-1 ? m : 'normal'; }
  function setMode(m){ if(MODES.indexOf(m)<0) m='normal'; lsSet('dd_mode_'+LID, m); applyMode(); syncDock(); }
  function applyMode(){ document.body.setAttribute('data-dd-mode', getMode()); }
  function stuckDelay(){ return getMode()==='support' ? 20000 : 30000; }

  /* ---------- progress (reuses lesson's localStorage — no new DB) ---------- */
  function attemptInfo(qid){
    var t = lsGet('scispark_progress_'+qid, {attempts:[]});
    var a = (t && t.attempts) || [];
    var anyCorrect = a.some(function(x){ return x.correct; });
    var last = a.length ? a[a.length-1] : null;
    return { count:a.length, anyCorrect:anyCorrect, lastCorrect: last? !!last.correct : false };
  }
  function hintMax(qid){ return lsGet('dd_hintmax_'+LID+'_'+qid, 0); }
  function bumpHintMax(qid, lvl){ if(lvl>hintMax(qid)) lsSet('dd_hintmax_'+LID+'_'+qid, lvl); }

  /* ============================================================
   * Question-TYPE hint templates (red-line 6: framing reused; lesson supplies content)
   * Each lesson question provides: { type, term{en,zh}, ladder:[{en,zh}x3], reasons:{...} }
   * reasons map a 4-choice cause → which ladder rung to open at + an optional lead line.
   * ============================================================ */
  var REASONS = [
    { key:'word',    en:"I don't get a word here",        zh:'有个词我不懂' },
    { key:'concept', en:"I don't get the method",          zh:'我不懂方法' },
    { key:'start',   en:"I don't know how to start",       zh:'我不会开头' },
    { key:'between', en:"Stuck between two answers",        zh:'卡在两个答案之间' }
  ];
  // which ladder level (0-based) a reason opens at
  function startLevelFor(reason){ return reason==='concept' ? 1 : 0; }

  /* ---------- companion card (feature 1 & 2) ---------- */
  function reactionCard(qid){
    var Q = L.hints[qid] || {};
    var info = attemptInfo(qid);
    if(!info.count) return null;
    var card;
    if(info.lastCorrect){
      var pr = (L.praise && L.praise[qid]) || {en:'Nailed it — and you can say why.', zh:'答对了 — 而且你说得出原因。'};
      card = el('div','dd dd-card dd-correct');
      card.innerHTML =
        pose('correct') +
        '<div class="dd-bubble">'+
          '<div class="dd-name">豆豆 · DouDou</div>'+
          bi('dd-line-en', pr.en, 'dd-line-zh', pr.zh) +
          '<div class="dd-sub">'+bi('','🔧 Repair List +1 · 修好一个零件','dd-zh','')+'</div>'+
        '</div>';
    } else {
      card = el('div','dd dd-card dd-wrong');
      var w = (L.wrong && L.wrong[qid]) || {};
      if(info.count === 1){
        // first wrong: light only, NO hint pushed (blueprint)
        card.innerHTML =
          pose('think') +
          '<div class="dd-bubble">'+
            '<div class="dd-name">豆豆 · DouDou</div>'+
            bi('dd-line-en', "Not yet — totally normal. Read it once more, then try again.",
               'dd-line-zh', '还没对 — 很正常。再看一眼,然后再试一次。')+
          '</div>';
      } else {
        // 2nd+ wrong: the formula — not yet · what you got right · what to check next
        card.innerHTML =
          pose('think') +
          '<div class="dd-bubble">'+
            '<div class="dd-name">豆豆 · DouDou</div>'+
            bi('dd-line-en', "Still not there — but you're not lost.",
               'dd-line-zh', '还没到 — 但你没跑偏。')+
            (w.gotRight? '<div class="dd-sub">'+bi('','✓ You got: '+w.gotRight.en,'dd-zh','')+
                          (w.gotRight.zh?'<span class="zh"> ✓ 你对的:'+esc(w.gotRight.zh)+'</span>':'')+'</div>':'')+
            (w.nextStep? '<div class="dd-sub dd-sub-amber">'+bi('','→ Check: '+w.nextStep.en,'dd-zh','')+
                          (w.nextStep.zh?'<span class="zh"> → 下一步查:'+esc(w.nextStep.zh)+'</span>':'')+'</div>':'')+
          '</div>';
      }
    }
    return card;
  }

  /* ---------- Small Push (feature 3 + anti-avoidance feature 4§) ---------- */
  function hintState(qid){ return lsGet('dd_hint_'+LID+'_'+qid, {open:false,reason:null,level:-1,tried:false,shownAt:0}); }
  function setHintState(qid, s){ lsSet('dd_hint_'+LID+'_'+qid, s); }

  function renderPush(strip, qid){
    var Q = L.hints[qid]; if(!Q) return;
    var host = el('div','dd dd-push-host');
    strip.appendChild(host);
    drawPush(host, qid);
  }
  function drawPush(host, qid){
    host.innerHTML='';
    var Q = L.hints[qid];
    var s = hintState(qid);
    if(!s.open){
      var btn = el('button','dd-push-btn');
      btn.innerHTML = '🔧 Small Push <span class="dd-zh zh">小推一下</span>';
      btn.onclick = function(){ s.open=true; s.reason=null; s.level=-1; s.tried=false; setHintState(qid,s); drawPush(host,qid); };
      host.appendChild(btn);
      return;
    }
    if(!s.reason){ drawReason(host, qid, s); return; }
    drawLadder(host, qid, s);
  }
  function drawReason(host, qid, s){
    var box = el('div','dd dd-reason');
    box.innerHTML = '<div class="dd-reason-q">'+
        "Before the push — what's blocking you?"+
        '<span class="dd-zh zh">先选一个:哪里卡住了?(这样豆豆给对的提示,不是让你乱点)</span></div>';
    var grid = el('div','dd-reason-grid');
    REASONS.forEach(function(r){
      var b = el('button','dd-reason-opt');
      b.innerHTML = esc(r.en)+'<span class="dd-zh zh">'+esc(r.zh)+'</span>';
      b.onclick = function(){
        s.reason=r.key; s.level=startLevelFor(r.key); s.tried=false; s.shownAt=now();
        bumpHintMax(qid, s.level+1); setHintState(qid,s); drawPush(host,qid);
      };
      grid.appendChild(b);
    });
    box.appendChild(grid);
    host.appendChild(box);
  }
  function drawLadder(host, qid, s){
    var Q = L.hints[qid];
    var ladder = Q.ladder || [];
    var total = ladder.length;
    var lvl = Math.max(0, Math.min(s.level, total-1));
    var rung = ladder[lvl] || {en:'',zh:''};
    var isLast = (lvl === total-1);

    var wrap = el('div','dd dd-ladder');

    // reason-specific lead (only the first time we open at this reason's start level)
    if(Q.reasons && Q.reasons[s.reason] && lvl===startLevelFor(s.reason)){
      var lead = Q.reasons[s.reason];
      var lc = el('div','dd dd-card dd-calm');
      lc.innerHTML = pose('point')+'<div class="dd-bubble"><div class="dd-name">豆豆 · DouDou</div>'+
        bi('dd-line-en', lead.en, 'dd-line-zh', lead.zh)+'</div>';
      wrap.appendChild(lc);
    }

    var h = el('div','dd dd-hint');
    h.innerHTML =
      '<div class="dd-hint-head">'+
        '<span class="dd-hint-step">SMALL PUSH '+(lvl+1)+'/'+total+'</span>'+
        (isLast? '<span class="dd-hint-last">'+bi('','last one — you finish it','dd-zh','')+'<span class="zh"> 最后一推 · 收尾你来</span></span>':'')+
      '</div>'+
      bi('dd-hint-en', rung.en, 'dd-hint-zh', rung.zh);

    if(isLast && Q.finishLine){
      var fin = el('div','dd-final');
      fin.innerHTML = esc(Q.finishLine.en)+'<span class="dd-zh zh">'+esc(Q.finishLine.zh||'')+'</span>';
      h.appendChild(fin);
    }

    // controls: "I tried" (action gate) + "next push" (15s + action gate)
    var rowc = el('div','dd-hint-row');
    if(!isLast){
      var tried = el('button','dd-tried');
      tried.innerHTML = s.tried? '✓ Tried · 试过了' : 'I tried it · 我试了';
      if(s.tried) tried.classList.add('dd-done');
      tried.onclick = function(){ s.tried=true; setHintState(qid,s); refreshLadderControls(); };

      var next = el('button','dd-next'); next.textContent='Next push · 再推一层';
      var gate = el('span','dd-gatemsg');

      function refreshLadderControls(){
        tried.innerHTML = s.tried? '✓ Tried · 试过了' : 'I tried it · 我试了';
        tried.classList.toggle('dd-done', !!s.tried);
        var waited = now() - (s.shownAt||0);
        var remain = Math.ceil((15000 - waited)/1000);
        var ready = s.tried && waited>=15000;
        next.disabled = !ready;
        if(!s.tried) gate.textContent = 'First give it a real try ↑ · 先自己试一下 ↑';
        else if(remain>0) gate.textContent = 'Think for '+remain+'s more · 再想 '+remain+' 秒';
        else gate.textContent='';
      }
      next.onclick = function(){
        var waited = now() - (s.shownAt||0);
        if(!(s.tried && waited>=15000)) return;
        s.level=lvl+1; s.tried=false; s.shownAt=now();
        bumpHintMax(qid, s.level+1); setHintState(qid,s); drawPush(host,qid);
      };
      rowc.appendChild(tried); rowc.appendChild(next); rowc.appendChild(gate);
      h._refresh = refreshLadderControls;
      // live countdown
      var iv = setInterval(function(){ if(!document.body.contains(h)){ clearInterval(iv); return; } refreshLadderControls(); }, 1000);
      refreshLadderControls();
    } else {
      var done = el('span','dd-gatemsg'); done.textContent="That's all the push — the answer's yours to land. · 推到这了 — 答案你来收。";
      rowc.appendChild(done);
    }
    h.appendChild(rowc);
    wrap.appendChild(h);
    host.appendChild(wrap);
  }

  /* ---------- stuck-30s nudge (feature 4) ---------- */
  var timers = {};
  function armStuck(qid, strip){
    if(getMode()==='quiet') return;
    var muteUntil = lsGet('dd_mutenudge_'+LID+'_'+qid, 0);
    if(now() < muteUntil) return;
    clearTimeout(timers[qid]);
    timers[qid] = setTimeout(function(){
      if(getMode()==='quiet') return;
      if(attemptInfo(qid).anyCorrect) return;
      if(hintState(qid).open) return;            // already getting help
      if($(  qid+'-nudge')) return;
      var ta=$(qid+'-input'); if(ta && ta.value && ta.value.trim().length>2) return; // they're typing
      var n = el('div','dd dd-nudge'); n.id=qid+'-nudge';
      n.innerHTML = pose('curious')+
        '<div class="dd-bubble"><div class="dd-name">豆豆 · DouDou</div>'+
        bi('dd-line-en',"Want a hand with this one?", 'dd-line-zh','要不要我推一下?')+'</div>'+
        '<div class="dd-nudge-btns">'+
          '<button class="dd-nudge-yes">Yes · 好</button>'+
          '<button class="dd-nudge-no">Not now · 不用</button>'+
        '</div>';
      strip.appendChild(n);
      n.querySelector('.dd-nudge-yes').onclick=function(){
        n.remove();
        var s=hintState(qid); s.open=true; s.reason=null; setHintState(qid,s);
        var host=strip.querySelector('.dd-push-host'); if(host) drawPush(host,qid);
      };
      n.querySelector('.dd-nudge-no').onclick=function(){
        n.remove();
        lsSet('dd_mutenudge_'+LID+'_'+qid, now()+60000);  // quiet 60s for this Q
        bumpQuietSignal();
      };
    }, stuckDelay());
  }
  function disarmStuck(qid){ clearTimeout(timers[qid]); }

  /* ---------- 连错3题 — solidarity, not surveillance (blueprint hole #4) ---------- */
  function checkLosingStreak(){
    if(getMode()==='quiet') return;
    var consec=0;
    L.tryQuestions.forEach(function(qid){
      var info=attemptInfo(qid);
      if(info.count && !info.anyCorrect) consec++; else consec=0;
    });
    if(consec>=3 && !$('dd-streak-msg')){
      var hostQ = L.tryQuestions[L.tryQuestions.length-1];
      var strip = stripFor(hostQ); if(!strip) return;
      var m=el('div','dd dd-card dd-calm'); m.id='dd-streak-msg';
      m.innerHTML = pose('encourage')+'<div class="dd-bubble"><div class="dd-name">豆豆 · DouDou</div>'+
        bi('dd-line-en',"This set is brutal — not on you. Breathe for two minutes, then we go again.",
           'dd-line-zh','这套题出得有点狠 — 不怪你。休息两分钟,我们再来。')+'</div>';
      strip.appendChild(m);
    }
  }

  /* ---------- adaptive defaults (blueprint: 常关→安静 / 常错→支援) ---------- */
  function bumpQuietSignal(){ var n=lsGet('dd_quietsig_'+LID,0)+1; lsSet('dd_quietsig_'+LID,n);
    if(n>=3 && getMode()==='normal'){ suggest('quiet'); } }
  function suggest(mode){
    if(lsGet('dd_suggested_'+LID,false)) return; lsSet('dd_suggested_'+LID,true);
    setMode(mode);
  }

  /* ============================================================
   * Wiring
   * ============================================================ */
  function stripFor(qid){
    var fb=$(qid+'-feedback'); if(!fb) return null;
    var block = fb.closest ? fb.closest('.question-block') : fb.parentNode;
    if(!block) return null;
    var strip = block.querySelector('.dd-strip');
    if(!strip){ strip=el('div','dd dd-strip'); block.appendChild(strip); }
    return strip;
  }

  function renderQuestion(qid){
    var strip = stripFor(qid); if(!strip) return;
    strip.innerHTML='';
    // reaction card (if already attempted) — skipped in quiet mode (no unsolicited voice)
    if(getMode()!=='quiet'){ var rc = reactionCard(qid); if(rc) strip.appendChild(rc); }
    // Small Push entry (always available — even in quiet mode the button works)
    renderPush(strip, qid);
    armStuck(qid, strip);
    // typing disarms the nudge timer; re-arm on idle
    var ta=$(qid+'-input');
    if(ta && !ta._ddBound){ ta._ddBound=true;
      ta.addEventListener('input', function(){ disarmStuck(qid); clearTimeout(ta._ddIdle);
        ta._ddIdle=setTimeout(function(){ armStuck(qid, strip); }, stuckDelay()); });
      ta.addEventListener('focus', function(){ armStuck(qid, strip); });
    }
  }

  function afterSubmit(qid){
    disarmStuck(qid);
    var strip = stripFor(qid); if(strip){
      // refresh reaction card (quiet mode: no card)
      var old = strip.querySelector('.dd-card'); if(old && !old.classList.contains('dd-calm')) old.remove();
      var rc = getMode()==='quiet' ? null : reactionCard(qid);
      if(rc) strip.insertBefore(rc, strip.firstChild);
      // support mode: auto-open the push entry after a wrong 2nd try
      var info=attemptInfo(qid);
      if(getMode()==='support' && !info.anyCorrect && info.count>=2){
        var s=hintState(qid); if(!s.open){ s.open=true; s.reason=null; setHintState(qid,s);
          var host=strip.querySelector('.dd-push-host'); if(host) drawPush(host,qid); }
      }
    }
    checkLosingStreak();
  }

  /* ---------- WRAP: Repair List (feature 5) + Parent card (feature 6) ---------- */
  function renderWrap(){
    var screen=$('screen-wrap'); if(!screen || $('dd-wrap-block')) return;
    var block=el('div','dd dd-wrap-block'); block.id='dd-wrap-block';

    // Repair List
    var repaired=[];
    L.tryQuestions.concat(L.testQuestions||[]).forEach(function(qid){
      var info=attemptInfo(qid);
      if(info.anyCorrect){ var c=(L.concepts&&L.concepts[qid]); if(c) repaired.push(c); }
    });
    var panel=el('div','dd dd-panel');
    panel.innerHTML='<div class="dd-panel-title">🔧 Your Repair List<span class="dd-zh zh">今天你修好了什么</span></div>';
    if(repaired.length){
      repaired.slice(0,4).forEach(function(c){
        var it=el('div','dd-repair-item');
        it.innerHTML='<span class="dd-repair-check">✓</span><div class="dd-repair-txt">'+esc(c.en)+
          (c.zh?'<span class="dd-zh zh">'+esc(c.zh)+'</span>':'')+'</div>';
        panel.appendChild(it);
      });
    } else {
      panel.appendChild(el('div','dd-empty','Answer a few on Try / Test and your fixed parts show up here. · 在 Try / Test 答几题,修好的零件会出现在这里。'));
    }
    block.appendChild(panel);

    // Parent card (professional, progress evidence, no error detail)
    block.appendChild(parentCard());

    var btnrow = screen.querySelector('.btn-row');
    if(btnrow && btnrow.parentNode) btnrow.parentNode.insertBefore(block, btnrow);
    else screen.appendChild(block);
  }
  function parentCard(){
    var all = L.tryQuestions.concat(L.testQuestions||[]);
    var attempted=0, correct=0, indep=0, lvlSum=0, lvlN=0;
    all.forEach(function(qid){
      var info=attemptInfo(qid); if(!info.count) return;
      attempted++; if(info.anyCorrect){ correct++; if(hintMax(qid)===0) indep++; }
      lvlSum+=hintMax(qid); lvlN++;
    });
    var indepRate = attempted? Math.round(indep/attempted*100) : 0;
    var avgLvl = lvlN? (lvlSum/lvlN).toFixed(1) : '0';
    var p=el('div','dd dd-panel dd-parent');
    p.innerHTML =
      '<div class="dd-panel-title">For parents<span class="dd-zh zh">给家长看 · 专业版</span></div>'+
      '<div class="dd-metric-row">'+
        '<div class="dd-metric"><div class="dd-metric-num">'+indepRate+'%</div>'+
          '<div class="dd-metric-lab">'+bi('','Independent correct rate','dd-zh','')+'<span class="zh"> 独立答对率(未用提示)</span></div></div>'+
        '<div class="dd-metric"><div class="dd-metric-num">'+correct+'/'+attempted+'</div>'+
          '<div class="dd-metric-lab">'+bi('','Questions correct','dd-zh','')+'<span class="zh"> 答对题数</span></div></div>'+
        '<div class="dd-metric"><div class="dd-metric-num">'+avgLvl+'</div>'+
          '<div class="dd-metric-lab">'+bi('','Avg. scaffolding level used','dd-zh','')+'<span class="zh"> 平均脚手架提示层级</span></div></div>'+
      '</div>'+
      '<div class="dd-parent-note">'+
        '<b>Method · 教学法:</b> layered scaffolding (Small Push) guides the child to derive the answer themselves rather than copying it. '+
        '<span class="zh">采用<b>分层脚手架提示法(Scaffolding)</b>:引导孩子自己推导,而不是抄答案。最后一步永远留给孩子完成。</span>'+
      '</div>'+
      '<label class="dd-strict"><input type="checkbox" id="dd-strict-toggle"> '+
        bi('','Strict mode (fewer hints, exam-style)','dd-zh','')+'<span class="zh"> 严格模式(少提示·更像考试)</span></label>';
    var cb=p.querySelector('#dd-strict-toggle');
    cb.checked = lsGet('dd_strict_'+LID,false);
    cb.onchange = function(){ lsSet('dd_strict_'+LID, cb.checked); if(cb.checked) setMode('quiet'); };
    return p;
  }

  /* ---------- intensity dock (feature 7) ---------- */
  function buildDock(){
    if($('dd-dock')) return;
    var d=el('div','dd dd-dock'); d.id='dd-dock';
    d.innerHTML=
      '<button class="dd-dock-toggle" id="dd-dock-toggle">'+pose('idle')+'<span>豆豆</span></button>'+
      '<div class="dd-dock-panel">'+
        '<div class="dd-dock-lab">'+bi('','Companion intensity','dd-zh','')+'<span class="zh"> 陪伴强度</span></div>'+
        '<div class="dd-seg" id="dd-seg">'+
          '<button data-m="quiet">Quiet<small>安静</small></button>'+
          '<button data-m="normal">Normal<small>普通</small></button>'+
          '<button data-m="support">Support<small>支援</small></button>'+
        '</div>'+
        '<div class="dd-hide-row"><button class="dd-hide-btn" id="dd-hide">🙈 Hide DouDou · 让豆豆消失</button></div>'+
        '<div class="dd-dock-hint">'+bi('','Hiding never affects your marks or hints.','dd-zh','')+
          '<span class="zh"> 隐藏不影响给分,小推随时还在。</span></div>'+
      '</div>';
    document.body.appendChild(d);
    $('dd-dock-toggle').onclick=function(){ d.classList.toggle('dd-open'); };
    d.querySelectorAll('#dd-seg button').forEach(function(b){
      b.onclick=function(){ setMode(b.getAttribute('data-m')); };
    });
    $('dd-hide').onclick=function(){ setMode('quiet'); bumpQuietSignal(); d.classList.remove('dd-open'); };
    // never cover the input in use (red-line 6): hide the dock while typing an answer
    document.addEventListener('focusin', function(e){
      var t=e.target; if(t && (t.tagName==='TEXTAREA'||t.tagName==='INPUT')){ d.classList.add('dd-shy'); d.classList.remove('dd-open'); }
    });
    document.addEventListener('focusout', function(){ d.classList.remove('dd-shy'); });
    syncDock();
  }
  function syncDock(){
    var seg=$('dd-seg'); if(!seg) return;
    var m=getMode();
    seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('dd-active', b.getAttribute('data-m')===m); });
  }

  /* ---------- decorator wiring (no engine edit) ---------- */
  function wrapGlobals(){
    var origSubmit = window.submitAnswer;
    if(typeof origSubmit==='function' && !origSubmit._ddWrapped){
      window.submitAnswer = function(qid){
        var r = origSubmit.apply(this, arguments);
        try{ if(typeof qid==='string') afterSubmit(qid); }catch(e){}
        return r;
      };
      window.submitAnswer._ddWrapped = true;
    }
    var origShow = window.showScreen;
    if(typeof origShow==='function' && !origShow._ddWrapped){
      window.showScreen = function(id){
        var r = origShow.apply(this, arguments);
        try{ if(id==='wrap') renderWrap(); }catch(e){}
        return r;
      };
      window.showScreen._ddWrapped = true;
    }
  }

  /* ---------- init ---------- */
  function init(){
    applyMode();
    // adaptive: a losing streak from a prior session nudges toward support
    L.tryQuestions.forEach(renderQuestion);
    buildDock();
    wrapGlobals();
    checkLosingStreak();
    if(document.querySelector('.screen.active#screen-wrap')) renderWrap();
  }
  if(document.readyState==='loading') window.addEventListener('DOMContentLoaded', init);
  else init();
})();
