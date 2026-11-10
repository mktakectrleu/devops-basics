/* Brak frameworków i zależności: dane są pobierane z lokalnych JSON przez fetch(). */
'use strict';
const $ = selector => document.querySelector(selector);
const refs = {nav:$('#topnav'), side:$('#section-nav'), title:$('#site-title'), heading:$('#page-heading'), subtitle:$('#page-subtitle'), notice:$('#notice'), status:$('#status'), sections:$('#sections'), filter:$('#filter'), layout:$('#page-layout'), toggle:$('#nav-toggle')};
let site, activePage, sectionNodes=[];
// Topbar i hero pozostają widoczne; offset przewijania mierzymy automatycznie.
// ResizeObserver obsługuje m.in. zawijanie zakładek i dłuższe tytuły na telefonach.
const persistentHeader = $('#persistent-header');
function refreshHeaderHeight(){
  const height = Math.ceil(persistentHeader.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--persistent-header-height', `${height}px`);
}
refreshHeaderHeight();
if ('ResizeObserver' in window) new ResizeObserver(refreshHeaderHeight).observe(persistentHeader);
window.addEventListener('resize', refreshHeaderHeight, {passive:true});

// Menu boczne pozostaje przyklejone również, gdy ma więcej elementów niż ekran.
// Przesuwamy ukrytą, pozbawioną scrollbara listę TYLKO wtedy,
// gdy aktywny odnośnik wychodzi poza widoczny fragment.
const sidebarWrapper = $('#section-nav-wrapper');
const sideUp = $('#sidebar-step-up');
const sideDown = $('#sidebar-step-down');
const sidebarNav = refs.side;
const isSidebarMobile = () => window.matchMedia('(max-width: 940px)').matches;
const sidebarIsOverflowing = () => !isSidebarMobile() && sidebarNav.scrollHeight > sidebarNav.clientHeight + 2;
function updateSidebarButtons(){
  const overflowing=sidebarIsOverflowing();
  sideUp.hidden=!overflowing;
  sideDown.hidden=!overflowing;
  sideUp.disabled=!overflowing || sidebarNav.scrollTop < 2;
  sideDown.disabled=!overflowing || sidebarNav.scrollTop + sidebarNav.clientHeight >= sidebarNav.scrollHeight - 2;
}
function keepActiveLinkVisible(link, behavior='smooth'){
  if(!link || isSidebarMobile())return;
  // offsetTop uwzględnia położenie w całym aside; rect uwzględnia bieżący scroll.
  const frame=sidebarNav.getBoundingClientRect();
  const item=link.getBoundingClientRect();
  const pad=8;
  let target=sidebarNav.scrollTop;
  if(item.bottom>frame.bottom-pad)target+=item.bottom-frame.bottom+pad;
  else if(item.top<frame.top+pad)target-=frame.top-item.top+pad;
  if(Math.abs(target-sidebarNav.scrollTop)>1)sidebarNav.scrollTo({top:target,behavior});
  updateSidebarButtons();
}
function updateSidebarLayout(){
  // Wysokość jest wyznaczana w CSS z użyciem pomiaru nagłówka.
  if(isSidebarMobile())sidebarNav.scrollTop=0;
  updateSidebarButtons();
  const active=sidebarNav.querySelector('.sidebar-link.active:not([hidden])');
  keepActiveLinkVisible(active,'instant');
}
function stepSidebar(direction){
  sidebarNav.scrollBy({top:direction * Math.max(80,sidebarNav.clientHeight * .65),behavior:'smooth'});
}
sideUp.addEventListener('click',()=>stepSidebar(-1));
sideDown.addEventListener('click',()=>stepSidebar(1));
sidebarNav.addEventListener('scroll',updateSidebarButtons,{passive:true});
if ('ResizeObserver' in window){
  const sidebarResizeObserver = new ResizeObserver(updateSidebarLayout);
  sidebarResizeObserver.observe(sidebarWrapper);
  sidebarResizeObserver.observe(sidebarNav);
  sidebarResizeObserver.observe(persistentHeader);
}
window.addEventListener('resize',updateSidebarLayout,{passive:true});


const cache = new Map();
function el(tag, className, text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
async function loadJson(path){
  if(cache.has(path))return cache.get(path);
  const response=await fetch(path,{cache:'no-cache'});
  if(!response.ok)throw new Error(`Nie można wczytać ${path} (HTTP ${response.status})`);
  const data=await response.json();cache.set(path,data);return data;
}
function route(){const parts=decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);return {page:parts[0]||site?.defaultPage||'lokalnie',section:parts[1]||null,group:parts[2]||null};}
function url(page,section,group){return '#/'+[page,section,group].filter(Boolean).map(encodeURIComponent).join('/');}
function setStatus(message,error=false){refs.status.textContent=message;refs.status.className=error?'error':'';refs.status.hidden=!message;}
function navLink(label,href,cls){const a=el('a',cls,label);a.href=href;return a;}
function renderTopNav(){refs.nav.replaceChildren();for(const page of site.pages){const a=navLink(page.label,url(page.id),'');a.classList.toggle('active',page.id===activePage.id);if(page.id===activePage.id)a.setAttribute('aria-current','page');refs.nav.append(a);}}
function commandRow(entry){
  const row=el('div','row');const box=el('div','codebox');const code=el('code','',entry.command||'');
  const copy=el('button','copy','Kopiuj');copy.type='button';copy.title='Kopiuj tę jedną komendę';copy.setAttribute('aria-label','Kopiuj: '+(entry.command||''));
  copy.addEventListener('click',async()=>{const value=code.textContent;let ok=false;try{await navigator.clipboard.writeText(value);ok=true;}catch{}if(!ok){const ta=el('textarea');ta.value=value;document.body.append(ta);ta.select();try{ok=document.execCommand('copy');}catch{}ta.remove();}copy.textContent=ok?'✓ Skopiowano':'Zaznacz ręcznie';setTimeout(()=>copy.textContent='Kopiuj',1500);});
  box.append(code,copy);row.append(box,el('div','desc',entry.description||''));return row;
}
function renderSection(data){
  const sec=el('section','card');sec.id=data.id;
  sec.append(el('h2','',data.title),el('p','summary',data.summary||''));
  for(const group of data.subsections||[]){
    const item=el('section','subsection');item.id=`${data.id}--${group.id}`;
    item.append(el('h3','group-title',group.title));
    for(const entry of group.commands||[])item.append(commandRow(entry));
    sec.append(item);
  }
  return sec;
}
function renderSideNav(data){refs.side.replaceChildren();sidebarNav.scrollTop=0;for(const sec of data){
  const link=navLink(sec.title,url(activePage.id,sec.id),'sidebar-link sidebar-entry');link.dataset.target=sec.id;refs.side.append(link);
  for(const group of sec.subsections||[]){const id=`${sec.id}--${group.id}`;const sub=navLink('↳ '+group.title,url(activePage.id,sec.id,group.id),'sidebar-link sidebar-sublink sidebar-entry');sub.dataset.target=id;refs.side.append(sub);}
}}
function updateSearch(){const q=refs.filter.value.toLocaleLowerCase('pl').trim();let matches=0;
  for(const sec of sectionNodes){const sectionTitle=sec.querySelector('h2').textContent+' '+sec.querySelector('.summary').textContent;const matchSection=sectionTitle.toLocaleLowerCase('pl').includes(q);let visibleGroups=0;
    for(const group of sec.querySelectorAll('.subsection')){const matchGroup=group.querySelector('h3').textContent.toLocaleLowerCase('pl').includes(q);let visibleRows=0;
      for(const row of group.querySelectorAll('.row')){const show=!q||matchSection||matchGroup||row.textContent.toLocaleLowerCase('pl').includes(q);row.classList.toggle('hidden',!show);if(show)visibleRows++;}
      const showGroup=visibleRows>0;group.classList.toggle('hidden',!showGroup);if(showGroup)visibleGroups++;
    }
    sec.classList.toggle('hidden',visibleGroups===0);if(visibleGroups)matches++;
  }
  for(const a of refs.side.querySelectorAll('[data-target]')){const target=document.getElementById(a.dataset.target);a.hidden=!target||target.classList.contains('hidden')||target.closest('.card')?.classList.contains('hidden');}
  updateSidebarLayout();
  setStatus(matches||!sectionNodes.length?'':`Brak wyników dla: ${refs.filter.value}`);updateActiveSide();
}
let previousActiveTarget=null;
function updateActiveSide(){
  const targets=[...refs.side.querySelectorAll('[data-target]:not([hidden])')];
  let active=targets[0];
  for(const a of targets){
    const node=document.getElementById(a.dataset.target);
    if(node&&node.getBoundingClientRect().top<=persistentHeader.getBoundingClientRect().height+24)active=a;
    else break;
  }
  for(const a of targets){
    const selected=a===active;a.classList.toggle('active',selected);
    if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
  }
  // Bez ciągłego przesuwania: dopiero zmiana aktywnej pozycji i tylko,
  // gdy wychodzi ona poza widoczną część menu.
  if(active?.dataset.target!==previousActiveTarget){
    previousActiveTarget=active?.dataset.target||null;
    keepActiveLinkVisible(active);
  }
}

async function renderPage(pageId,sectionId,groupId){
  const record=site.pages.find(p=>p.id===pageId)||site.pages.find(p=>p.id===site.defaultPage)||site.pages[0];
  if(!record)return;
  if(activePage?.id!==record.id){setStatus('Wczytywanie treści…');refs.sections.replaceChildren();refs.side.replaceChildren();refs.filter.value='';}
  try{
    const page=await loadJson(record.file);activePage=page;
    refs.heading.textContent=page.heading||page.title;refs.subtitle.textContent=page.subtitle||'';
    refs.notice.textContent=page.notice||'';refs.notice.hidden=!page.notice;
    document.title=`${page.title} — ${site.title}`;
    renderTopNav();
    const base=record.file.slice(0,record.file.lastIndexOf('/')+1);
    const data=await Promise.all((page.sections||[]).map(p=>loadJson(base+p)));
    refs.sections.replaceChildren();previousActiveTarget=null;sectionNodes=data.map(renderSection);refs.sections.append(...sectionNodes);renderSideNav(data);
    if(!data.length){refs.sections.append(el('div','empty-state','Ta zakładka nie zawiera jeszcze sekcji. Dodaj plik w content/ i dopisz go do page.json.'));}
    setStatus('');updateSearch();
    if(sectionId){const target=document.getElementById(groupId?`${sectionId}--${groupId}`:sectionId);if(target&&!target.classList.contains('hidden'))requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}
    else window.scrollTo({top:0,behavior:'instant'});
  }catch(error){console.error(error);setStatus(`${error.message}. Uruchom projekt przez lokalny serwer HTTP (np. python3 -m http.server 8000), a nie przez file://.`,true);}
}
async function navigate(){if(!site)return;const r=route();await renderPage(r.page,r.section,r.group);}
refs.filter.addEventListener('input',updateSearch);
$('#clear-filter').addEventListener('click',()=>{refs.filter.value='';updateSearch();refs.filter.focus();});
$('#print').addEventListener('click',()=>window.print());
refs.toggle.addEventListener('click',()=>{const expanded=refs.layout.classList.toggle('nav-open');updateSidebarLayout();refs.toggle.setAttribute('aria-expanded',String(expanded));});
refs.side.addEventListener('click',e=>{if(e.target.closest('a')){refs.layout.classList.remove('nav-open');refs.toggle.setAttribute('aria-expanded','false');}});
window.addEventListener('scroll',()=>{if(sectionNodes.length)updateActiveSide();},{passive:true});
window.addEventListener('hashchange',navigate);
(async()=>{try{site=await loadJson('content/site.json');refs.title.textContent=site.title;await navigate();}catch(error){console.error(error);setStatus('Nie można wczytać content/site.json. Otwórz stronę przez lokalny serwer HTTP, np. python3 -m http.server 8000. Szczegóły: '+error.message,true);}})();
