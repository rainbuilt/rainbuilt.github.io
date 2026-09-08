/* Local-only reading tools. This page never sends reading history or search text. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const keys = {theme:'fedora-android-theme-v1',progress:'fedora-android-progress-v1'};
  const store = {
    read(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value);}catch{return fallback;}},
    write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}},
    remove(key){try{localStorage.removeItem(key);}catch{/* Reading remains available when storage is blocked. */}}
  };
  let toastTimer;
  function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),2400);}
  const themeToggle=$('#theme-toggle');
  function setTheme(theme){
    const dark=theme==='dark';document.documentElement.dataset.theme=dark?'dark':'light';
    themeToggle.textContent=dark?'밝게':'어둡게';themeToggle.setAttribute('aria-label',dark?'밝은 화면으로 전환':'어두운 화면으로 전환');
  }
  setTheme(store.read(keys.theme,'light'));
  themeToggle.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(theme);store.write(keys.theme,theme);});

  const sidebar=$('#sidebar'),navToggle=$('#nav-toggle');
  function closeNav(){sidebar.classList.remove('open');navToggle.setAttribute('aria-expanded','false');}
  navToggle.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));});
  sidebar.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
  document.addEventListener('click',event=>{if(!sidebar.contains(event.target)&&!navToggle.contains(event.target))closeNav();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeNav();if(document.getElementById('search-dialog').open){event.preventDefault();closeSearch();}}});

  const chapters=$$('.chapter');
  const checks=$$('[data-chapter-check]');
  const storedProgress=store.read(keys.progress,[]);
  const progress=new Set(Array.isArray(storedProgress)?storedProgress.filter(id=>chapters.some(ch=>ch.id===id)):[]);
  function showProgress(){
    checks.forEach(box=>{box.checked=progress.has(box.dataset.chapterCheck);});
    $$('.chapter-nav a').forEach(link=>link.classList.toggle('is-complete',progress.has(link.hash.slice(1))));
    $('#progress-count').textContent=`${progress.size} / ${chapters.length}`;
    $('#reading-progress').value=progress.size;
  }
  checks.forEach(box=>box.addEventListener('change',()=>{
    if(box.checked)progress.add(box.dataset.chapterCheck);else progress.delete(box.dataset.chapterCheck);
    if(!store.write(keys.progress,[...progress]))toast('이 브라우저에서는 읽기 기록을 저장할 수 없습니다.');showProgress();
  }));
  $('#reset-progress').addEventListener('click',()=>{
    if(progress.size===0){toast('저장된 읽기 기록이 없습니다.');return;}
    if(window.confirm('이 브라우저에 저장한 장별 확인 기록을 지울까요?')){progress.clear();store.remove(keys.progress);showProgress();toast('읽기 기록을 지웠습니다.');}
  });
  showProgress();
  let scrollQueued=false;
  function setActiveChapter(){
    scrollQueued=false;
    let active=null;
    for(const chapter of chapters){if(chapter.getBoundingClientRect().top<150)active=chapter.id;else break;}
    $$('.chapter-nav a').forEach(link=>{const current=link.hash===`#${active}`;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(setActiveChapter);}},{passive:true});
  setActiveChapter();

  async function copyText(text){
    if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true;}catch{/* Try the local-file fallback. */}}
    const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';
    area.setAttribute('readonly','');document.body.append(area);area.select();
    let copied=false;try{copied=document.execCommand('copy');}catch{copied=false;}area.remove();return copied;
  }
  $$('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const code=document.getElementById(button.dataset.copy);
    if(!code)return;
    const success=await copyText(code.textContent);
    button.textContent=success?'복사됨':'직접 선택';
    if(!success){const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(code);selection.removeAllRanges();selection.addRange(range);toast('코드를 선택했습니다. Ctrl+C로 복사하세요.');}
    setTimeout(()=>{button.textContent='복사';},1800);
  }));

  const steps=[
    'Kotlin 파일은 앱의 동작을, 리소스는 이름과 아이콘 같은 자료를 담습니다. 이 단계에서 코드를 편집합니다.',
    'Gradle이 작업 순서를 관리하고 AGP가 Android 빌드 작업을 제공합니다. PC의 JDK와 Android SDK를 사용합니다.',
    'debug APK에는 설치할 앱 코드와 리소스가 들어 있습니다. 첫 실습에서는 디버그 빌드 결과를 확인합니다.',
    'adb가 PC와 기기를 연결합니다. 실행 중인 기기의 식별자를 확인한 뒤 APK를 설치합니다.',
    'Android 런타임이 앱을 실행합니다. Compose 화면에서 버튼을 누르고 Logcat과 테스트로 결과를 확인합니다.'
  ];
  $$('[data-flow-step]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.flowStep);
    $$('[data-flow-step]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    $$('[data-flow-node]').forEach(node=>node.classList.toggle('is-current',Number(node.dataset.flowNode)===index));
    $('#flow-description').textContent=steps[index];
  }));

  const dialog=$('#search-dialog'),input=$('#search-input'),results=$('#search-results'),status=$('#search-status');
  // Index each subsection, preserving its stable link. Content stays readable without JS.
  const index=[];
  chapters.forEach(chapter=>{
    const chapterTitle=chapter.querySelector('h2').textContent;
    let section={id:chapter.id,title:chapterTitle,chapter:chapterTitle,body:''};
    [...chapter.children].forEach(child=>{
      if(child.tagName==='H3'){
        if(section.body||section.id===chapter.id)index.push(section);
        section={id:child.id,title:child.textContent,chapter:chapterTitle,body:''};
      }else if(!child.classList.contains('chapter-heading')&&!child.classList.contains('chapter-end'))section.body+=' '+child.textContent.replace(/\s+/g,' ');
    });
    index.push(section);
  });
  index.forEach(item=>{item.normalized=`${item.title} ${item.body}`.toLocaleLowerCase();});
  function openSearch(){
    closeNav();
    if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}
    else{dialog.setAttribute('open','');}
    input.focus();input.select();search();
  }
  function closeSearch(){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
  $$('[data-open-search]').forEach(button=>button.addEventListener('click',openSearch));
  $('#close-search').addEventListener('click',closeSearch);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeSearch();}});
  document.addEventListener('keydown',event=>{
    const editable=event.target.closest('input,textarea,[contenteditable=true]');
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}
    else if(event.key==='/'&&!editable&&!dialog.open){event.preventDefault();openSearch();}
  });
  function highlighted(text,terms){
    const fragment=document.createDocumentFragment();
    if(!terms.length){fragment.append(document.createTextNode(text));return fragment;}
    const safeTerms=terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    const expression=new RegExp(`(${safeTerms.join('|')})`,'gi');
    let cursor=0;
    for(const match of text.matchAll(expression)){
      fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const mark=document.createElement('mark');mark.textContent=match[0];fragment.append(mark);cursor=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));return fragment;
  }
  function search(){
    const query=input.value.trim().slice(0,160),terms=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if(!terms.length){status.textContent='제목과 본문에서 검색합니다. 예: KVM 권한';return;}
    const matches=index.filter(item=>terms.every(term=>item.normalized.includes(term))).map(item=>({item,score:terms.reduce((score,term)=>score+(item.title.toLocaleLowerCase().includes(term)?6:1),0)})).sort((a,b)=>b.score-a.score);
    status.textContent=matches.length?`${matches.length}개 항목을 찾았습니다.${matches.length>24?' 앞의 24개를 표시합니다.':''}`:'검색 결과가 없습니다. 띄어쓰기나 도구 이름을 바꿔보세요.';
    matches.slice(0,24).forEach(({item})=>{
      const link=document.createElement('a');link.href=`#${item.id}`;link.className='search-result';
      const small=document.createElement('small');small.textContent=item.chapter;
      const title=document.createElement('strong');title.append(highlighted(item.title,terms));
      const para=document.createElement('p');
      const matchAt=Math.max(0,item.body.toLocaleLowerCase().indexOf(terms[0])),start=Math.max(0,matchAt-45);
      const excerpt=(start?'... ':'')+item.body.slice(start,start+170)+(item.body.length>start+170?' ...':'');
      para.append(highlighted(excerpt,terms));link.append(small,title,para);
      link.addEventListener('click',()=>{closeSearch();const destination=document.getElementById(item.id);destination.setAttribute('tabindex','-1');requestAnimationFrame(()=>destination.focus({preventScroll:true}));});
      results.append(link);
    });
  }
  input.addEventListener('input',search);
})();
