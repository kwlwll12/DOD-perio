'use strict';

const topics = [
  {id:'structure', title:'건강한 구조', en:'Anatomy', icon:'◇', color:'#315fc3', tint:'#eaf0ff', x:360, y:57,
    text:'치은은 저작점막의 일부이면서 치주조직의 네 구성 요소 중 하나예요. 이 구조를 알면 탐침이 닿는 위치와 방사선에서 보이는 치조골의 의미를 연결할 수 있어요.',
    terms:['Periodontium','Oral mucosa','Gingiva','PDL','건강','치은','접합상피','상피','각화','transseptal','백악질','치조골','섬유'], featured:6},
  {id:'exam', title:'검사와 영상', en:'Examination', icon:'⌖', color:'#137875', tint:'#e5f5f3', x:555, y:104,
    text:'치주 탐침과 차팅에서 임상부착수준과 출혈을 확인하고, 방사선에서 골 소실과 치근 주변 구조를 살펴봐요. 두 검사 결과가 함께 진단의 근거가 됩니다.',
    terms:['탐침','차팅','CAL','BOP','방사선','CBCT','영상','X-ray','probing'], featured:8},
  {id:'disease', title:'질환의 발생', en:'Disease mechanisms', icon:'≋', color:'#9a522c', tint:'#faeee6', x:156, y:111,
    text:'생물막의 불균형과 숙주 반응이 건강한 조직을 어떻게 바꾸는지 살펴봐요. 염증이 어디까지 진행했는지는 치은염과 치주염을 이해하는 단서예요.',
    terms:['생물막','미생물','Dysbiosis','병인','치은염','치주염','Biofilm'], featured:10},
  {id:'risk', title:'위험요인과 전신', en:'Risk & systemic health', icon:'✧', color:'#8051a2', tint:'#f2eafa', x:110, y:260,
    text:'흡연과 당뇨병 같은 환자 요인을 살펴보고 질환의 진행 가능성과 전신 건강의 관계를 이해해요. 집단의 유병률과 개인의 진행 위험은 서로 다른 질문이에요.',
    terms:['당뇨','흡연','전신질환','유병률','역학','Diabetes','Smoking'], featured:11},
  {id:'diagnosis', title:'진단과 분류', en:'Diagnosis', icon:'▤', color:'#2856ac', tint:'#e9f0fc', x:610, y:251,
    text:'임상부착소실과 골 소실 등 검사 자료를 모아 치주염의 단계와 등급을 정리해요. 단계는 중증도와 치료 복잡성, 등급은 진행 속도와 위험을 판단하는 데 쓰여요.',
    terms:['Stage','Grade','Staging','Grading','단계','등급','교합','분류'], featured:20},
  {id:'therapy', title:'치주 치료', en:'Therapy', icon:'✚', color:'#337047', tint:'#e8f4eb', x:510, y:377,
    text:'초기 치료와 구강위생 관리에서 시작해, 상태에 따라 약물, 급성 병소의 처치와 추가 치료를 연결해요. 재평가 결과를 보면 어느 부위에 후속 치료가 필요한지 판단할 수 있어요.',
    terms:['치료 계획','약물','항생제','치주농양','근면활택','Scaling','수술'], featured:13},
  {id:'review', title:'재평가와 유지', en:'Reassessment', icon:'↻', color:'#6a52ae', tint:'#f0ebfb', x:338, y:397,
    text:'초기 치료 후 출혈, 탐침 깊이와 잔존 문제를 다시 확인해요. 결과에 따라 추가 치료, 의뢰 또는 유지관리로 이어지고, 다음 방문에서 다시 평가합니다.',
    terms:['초기 치료','재평가','유지관리','Phase I','BOP','Maintenance'], featured:19},
  {id:'cases', title:'임상 증례', en:'Clinical cases', icon:'▣', color:'#af5967', tint:'#faedf1', x:170, y:377,
    text:'한 환자의 병력, 차팅과 방사선 자료를 함께 놓고 진단과 치료를 결정해요. 증례에서 발견한 궁금증은 검사, 위험요인 또는 치료로 돌아가 확인할 수 있어요.',
    terms:['증례','의사결정','Case','Critical Decisions','치료계획'], featured:4},
];

const relationships = [
  ['structure','exam','건강한 위치를 검사 소견과 비교'], ['structure','disease','건강한 조직과 병소를 비교'],
  ['exam','diagnosis','차팅과 골 소실로 분류'], ['exam','review','같은 지표를 다시 측정'],
  ['disease','risk','환자 요인이 질환에 미치는 영향'], ['disease','therapy','염증 원인에 맞춰 관리'],
  ['risk','diagnosis','흡연과 당뇨를 등급에 반영'], ['risk','cases','병력과 진행 위험 해석'],
  ['diagnosis','therapy','단계와 상태를 치료에 반영'], ['diagnosis','cases','환자 자료로 단계·등급 결정'],
  ['therapy','review','반응에 따라 후속 치료 결정'], ['therapy','cases','증례별 치료 계획 수립'],
  ['review','cases','재평가 결과로 계획 수정'],
];

const $ = selector => document.querySelector(selector);
const sources = window.lectureSources;
const topicById = new Map(topics.map(topic => [topic.id, topic]));
const sourceById = new Map(sources.map(source => [source.id, source]));
let selected = 'structure';
let view = 'map';
let mode = 'graph';

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function button(text, className, action) {
  const result = node('button', text, className);
  result.type = 'button';
  result.onclick = action;
  return result;
}

function tone(el, topic) {
  el.style.setProperty('--tone', topic.color);
  el.style.setProperty('--tint', topic.tint);
}

function dot(topic) {
  const icon = node('span', topic.icon, 'dot');
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function image(source) {
  const img = node('img');
  img.src = `study-assets/source-${String(source.id).padStart(2,'0')}.jpg`;
  img.alt = '';
  img.loading = 'lazy';
  return img;
}

function sourceCard(source) {
  const card = button('', 'source-card', () => showSource(source));
  const copy = node('div', '', 'source-copy');
  copy.append(node('small', `${source.code} · ${source.pages}쪽`), node('b', source.title), node('p', source.summary));
  card.append(image(source), copy);
  return card;
}

function showSource(source) {
  $('#dialog-label').textContent = `${source.code} · 원본 PDF ${source.preview}쪽 미리보기`;
  $('#dialog-title').textContent = source.title;
  const img = image(source);
  img.alt = source.visual;
  img.loading = 'eager';
  const pdf = node('a','원본 PDF 열기 ↗');
  pdf.href = `./${encodeURIComponent(source.file)}#page=${source.preview}`;
  pdf.target = '_blank';
  pdf.rel = 'noopener';
  const download = node('a','PDF 저장');
  download.href = `./${encodeURIComponent(source.file)}`;
  download.download = source.file;
  download.style.marginLeft = '8px';
  $('#dialog-body').replaceChildren(img, pdf, download);
  $('#source-dialog').showModal();
}

function showStructure() {
  $('#dialog-label').textContent = 'L1b · Periodontal Health';
  $('#dialog-title').textContent = '건강한 치주조직 구조 확대';
  const frame = node('iframe');
  frame.src = 'study-assets/structure.html';
  frame.title = '치은, 상피, 결합조직과 PDL 섬유의 상세 연결 지도';
  const full = node('a','별도 화면에서 열기 ↗');
  full.href = frame.src;
  full.target = '_blank';
  full.rel = 'noopener';
  $('#dialog-body').replaceChildren(full, frame);
  $('#source-dialog').showModal();
}

function graphLine(a,b,radial=false) {
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  for (const [name,val] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y})) line.setAttribute(name,val);
  line.dataset.a = a.id;
  line.dataset.b = b.id;
  if (radial) line.classList.add('radial');
  $('#lines').append(line);
}

function buildGraph() {
  const center = {id:'center',x:360,y:224};
  Object.assign($('.graph-center').style,{left:'50%',top:'49.7778%'});
  for (const topic of topics) graphLine(center,topic,true);
  for (const [a,b] of relationships) graphLine(topicById.get(a),topicById.get(b));
  for (const topic of topics){
    const graphButton = button('','graph-node',()=>choose(topic.id,true));
    graphButton.dataset.topic = topic.id;
    graphButton.setAttribute('aria-label',topic.title);
    tone(graphButton,topic);
    Object.assign(graphButton.style,{left:`${topic.x/7.2}%`,top:`${topic.y/4.5}%`});
    const title = node('span');
    title.append(node('strong',topic.title),node('small',topic.en));
    graphButton.append(dot(topic),title);
    $('#graph').append(graphButton);
    const nav = button('','nav-item',()=>choose(topic.id,true));
    nav.dataset.nav = topic.id;
    tone(nav,topic);
    nav.append(dot(topic),node('span',topic.title));
    $('#topic-nav').append(nav);
    const item = button('','topic-row',()=>choose(topic.id,true));
    item.dataset.topic = topic.id;
    tone(item,topic);
    item.append(dot(topic),node('strong',topic.title));
    $('#topic-list').append(item);
  }
}

function renderSelection() {
  const topic = topicById.get(selected);
  for (const btn of document.querySelectorAll('[data-topic]')){
    const active = btn.dataset.topic===selected;
    btn.classList.toggle('selected',active);
    btn.setAttribute('aria-pressed', String(active));
  }
  for (const line of $('#lines').children){
    const active = line.dataset.a===selected || line.dataset.b===selected;
    line.classList.toggle('active',Boolean(selected && active && !line.classList.contains('radial')));
    line.classList.toggle('dim',Boolean(selected && !active));
  }
  const panel = $('#details');
  panel.replaceChildren();
  const list = sources.filter(source => source.topic === selected);
  if (topic){
    tone(panel,topic);
    const label = node('div','','detail-label');
    label.append(dot(topic),node('span',topic.en));
    const chips = node('div','','chips');
    for (const term of topic.terms.slice(0,4)) chips.append(node('span',term));
    panel.append(label,node('h2',topic.title),node('p',topic.text),chips);
    if (selected === 'structure') panel.append(button('L1b 구조 지도 열기 ↗','primary-button',showStructure));
    panel.append(node('div','이 주제에서 이어서 보기','connection-title'));
    for (const [a,b,explanation] of relationships){
      if (a!==selected && b!==selected) continue;
      const related = topicById.get(a===selected?b:a);
      const next = button('','related',()=>choose(related.id,true));
      tone(next,related);
      next.append(dot(related),node('b',related.title),node('small',explanation),node('em','→'));
      panel.append(next);
    }
    const featured = sourceById.get(topic.featured);
    const sample = button('','detail-source',()=>showSource(featured));
    const labelText = node('span');
    labelText.append(node('strong','원본 슬라이드 미리보기'),node('small',`${featured.code} · ${featured.preview}쪽`));
    sample.append(image(featured),labelText);
    panel.append(sample);
  } else {
    panel.append(node('h2','어디서 시작할까요?'),node('p','질문에 가까운 주제를 선택하세요. 연결된 개념과 PDF가 여기에 열립니다.'));
    for (const topic of topics){
      const item = button('','related',()=>choose(topic.id,true));
      tone(item,topic);
      item.append(dot(topic),node('b',topic.title),node('em','→'));
      panel.append(item);
    }
  }
  $('#sources-description').textContent = topic ? `${topic.title}에 연결된 원본 PDF ${list.length}개` : '주제별 원본 PDF';
  const visible = topic ? list : topics.map(item=>sourceById.get(item.featured));
  $('#related-sources').replaceChildren(...visible.map(sourceCard));
  renderNav();
}

function renderNav(){
  const active = view === 'library' ? 'library' : selected || 'overview';
  for(const btn of document.querySelectorAll('[data-nav]')){
    const current = btn.dataset.nav===active;
    btn.classList.toggle('active',current);
    if(current) btn.setAttribute('aria-current','page');
    else btn.removeAttribute('aria-current');
  }
  $('#top-map').classList.toggle('active',view==='map');
  $('#top-library').classList.toggle('active',view==='library');
}

function setView(next){
  view = next;
  $('#map-view').hidden = next!=='map';
  $('#library-view').hidden = next!=='library';
  if(next==='library') renderLibrary();
  renderNav();
}

function choose(id, direct=false){
  selected = id;
  if(view==='library') $('#search').value='';
  setView('map');
  renderSelection();
  if(direct && innerWidth<=930 && id) $('#details').scrollIntoView({block:'nearest'});
}

function normalize(text) {
  return text.toLocaleLowerCase().replace(/\s+/gu,'');
}

function renderLibrary(){
  const query = normalize($('#search').value.trim());
  const foundTopics = query ? topics.filter(topic=>normalize([topic.title,topic.en,...topic.terms].join(' ')).includes(query)) : [];
  const ids = new Set(foundTopics.map(topic=>topic.id));
  const found = sources.filter(source=>!query || ids.has(source.topic) || normalize([source.code,source.title,source.summary,source.file].join(' ')).includes(query));
  const chips = foundTopics.map(topic=>{
    const item = button(topic.title,'',()=>choose(topic.id,true));
    tone(item,topic);
    return item;
  });
  $('#search-topics').replaceChildren(...chips);
  $('#library-summary').textContent = found.length ? `원본 PDF ${found.length}개` : '검색 결과가 없습니다. 다른 단어로 검색해 보세요.';
  $('#library-sources').replaceChildren(...found.map(sourceCard));
}

function setMode(next){
  mode = next;
  $('#graph-scroll').hidden = mode!=='graph';
  $('#topic-list').hidden = mode!=='list';
  $('#graph-mode').setAttribute('aria-pressed',String(mode==='graph'));
  $('#list-mode').setAttribute('aria-pressed',String(mode==='list'));
}

function showLibrary() {
  $('#search').value = '';
  setView('library');
  window.scrollTo(0,0);
}

$('#search').addEventListener('input',()=>setView('library'));
$('#graph-mode').onclick=()=>setMode('graph');
$('#list-mode').onclick=()=>setMode('list');
$('#reset').onclick=()=>choose(null);
$('[data-nav=overview]').onclick=()=>choose(null);
$('[data-nav=library]').onclick=showLibrary;
$('#top-library').onclick=showLibrary;
$('#browse-all').onclick=showLibrary;
$('#top-map').onclick=()=>{choose(selected);window.scrollTo(0,0);};
$('#source-dialog').addEventListener('close',()=>$('#dialog-body').replaceChildren());

buildGraph();
renderSelection();
