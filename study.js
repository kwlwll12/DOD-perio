'use strict';

const topics = [
  {id:'structure', title:'Healthy Structures', en:'Anatomy', icon:'◇', color:'#315fc3', tint:'#eaf0ff', x:360, y:57,
    text:'The gingiva is part of the masticatory mucosa and one of the four components of the periodontium. Healthy anatomy helps you locate the landmarks used in probing and interpret the alveolar bone on radiographs.',
    terms:['Periodontium','Oral mucosa','Gingiva','PDL','Junctional epithelium','Keratinization','Transseptal','Cementum','Alveolar bone','Fibers'], featured:6},
  {id:'exam', title:'Examination & Imaging', en:'Clinical assessment', icon:'⌖', color:'#137875', tint:'#e5f5f3', x:555, y:104,
    text:'Periodontal probing and charting measure clinical attachment and bleeding. Radiographs show bone loss and the structures around the roots. Together, these findings inform the diagnosis.',
    terms:['Probing','Charting','CAL','BOP','Radiographs','CBCT','X-ray','Clinical attachment loss'], featured:8},
  {id:'disease', title:'Disease Mechanisms', en:'Pathogenesis', icon:'≋', color:'#9a522c', tint:'#faeee6', x:156, y:111,
    text:'Biofilm dysbiosis and the host response change healthy periodontal tissues. The location and extent of inflammation help explain the difference between gingivitis and periodontitis.',
    terms:['Biofilm','Microbiology','Dysbiosis','Pathogenesis','Gingivitis','Periodontitis'], featured:10},
  {id:'risk', title:'Risk & Systemic Health', en:'Risk assessment', icon:'✧', color:'#8051a2', tint:'#f2eafa', x:110, y:260,
    text:'Smoking and diabetes can affect disease progression. Population prevalence describes how common disease is, while a patient’s risk assessment estimates their likelihood of progression.',
    terms:['Diabetes','Smoking','Systemic disease','Prevalence','Epidemiology'], featured:11},
  {id:'diagnosis', title:'Diagnosis & Classification', en:'Staging and grading', icon:'▤', color:'#2856ac', tint:'#e9f0fc', x:610, y:251,
    text:'Use clinical attachment loss, radiographic bone loss, and other findings to stage and grade periodontitis. Stage describes severity and treatment complexity. Grade estimates progression and incorporates relevant risk factors.',
    terms:['Staging','Grading','Stage','Grade','Occlusion','Classification'], featured:20},
  {id:'therapy', title:'Periodontal Therapy', en:'Treatment options', icon:'✚', color:'#337047', tint:'#e8f4eb', x:510, y:377,
    text:'Begin with initial therapy and oral hygiene. Consider medications, treatment for acute lesions, or further procedures when indicated. Reassessment helps identify sites that need additional treatment.',
    terms:['Treatment planning','Medications','Antibiotics','Periodontal abscess','Root planing','Scaling','Surgery'], featured:13},
  {id:'review', title:'Reassessment & Maintenance', en:'Follow-up care', icon:'↻', color:'#6a52ae', tint:'#f0ebfb', x:338, y:397,
    text:'After initial therapy, reassess bleeding, probing depth, and residual problems. Use the findings to guide further treatment, referral, or maintenance. Continue to reassess at subsequent visits.',
    terms:['Phase I','Reassessment','Maintenance','BOP','Probing depth'], featured:19},
  {id:'cases', title:'Clinical Cases', en:'Clinical reasoning', icon:'▣', color:'#af5967', tint:'#faedf1', x:170, y:377,
    text:'Combine the patient’s history, charting, and radiographs to decide on a diagnosis and treatment. Use the case to revisit the relevant examination findings, risk factors, or therapies.',
    terms:['Case','Critical Decisions','Treatment planning','Clinical presentation'], featured:4},
];

const relationships = [
  ['structure','exam','Compare findings with healthy anatomy'], ['structure','disease','Compare healthy tissue with lesions'],
  ['exam','diagnosis','Classify using charting and bone loss'], ['exam','review','Measure the same clinical indicators again'],
  ['disease','risk','See how patient factors affect disease'], ['disease','therapy','Address contributors to inflammation'],
  ['risk','diagnosis','Apply smoking and diabetes as grade modifiers'], ['risk','cases','Interpret the history and risk of progression'],
  ['diagnosis','therapy','Plan treatment around the stage and findings'], ['diagnosis','cases','Stage and grade from case findings'],
  ['therapy','review','Choose follow-up care based on response'], ['therapy','cases','Build a treatment plan for each case'],
  ['review','cases','Revise the treatment plan after reassessment'],
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
  copy.append(node('small', `${source.code} · ${source.pages} pages`), node('b', source.title), node('p', source.summary));
  card.append(image(source), copy);
  return card;
}

function showSource(source) {
  $('#dialog-label').textContent = `${source.code} · PDF preview, page ${source.preview}`;
  $('#dialog-title').textContent = source.title;
  const img = image(source);
  img.alt = source.visual;
  img.loading = 'eager';
  const pdf = node('a','Open original PDF ↗');
  pdf.href = `./${encodeURIComponent(source.file)}#page=${source.preview}`;
  pdf.target = '_blank';
  pdf.rel = 'noopener';
  const download = node('a','Download PDF');
  download.href = `./${encodeURIComponent(source.file)}`;
  download.download = source.file;
  download.style.marginLeft = '8px';
  $('#dialog-body').replaceChildren(img, pdf, download);
  $('#source-dialog').showModal();
}

function showStructure() {
  $('#dialog-label').textContent = 'L1b · Periodontal Health';
  $('#dialog-title').textContent = 'Explore Healthy Periodontal Structures';
  const frame = node('iframe');
  frame.src = 'study-assets/structure.html';
  frame.title = 'Detailed map of gingival epithelium, connective tissue, and PDL fibers';
  const full = node('a','Open in a new tab ↗');
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
    if (selected === 'structure') panel.append(button('Explore the L1b Anatomy Map ↗','primary-button',showStructure));
    panel.append(node('div','Related Topics','connection-title'));
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
    labelText.append(node('strong','Preview an original slide'),node('small',`${featured.code} · page ${featured.preview}`));
    sample.append(image(featured),labelText);
    panel.append(sample);
  } else {
    panel.append(node('h2','Where would you like to start?'),node('p','Choose a topic to see its connections and lecture PDFs.'));
    for (const topic of topics){
      const item = button('','related',()=>choose(topic.id,true));
      tone(item,topic);
      item.append(dot(topic),node('b',topic.title),node('em','→'));
      panel.append(item);
    }
  }
  $('#sources-description').textContent = topic ? `${list.length} original PDFs for ${topic.title}` : 'Original PDFs by topic';
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
  $('#library-summary').textContent = found.length ? `${found.length} original PDFs` : 'No results. Try a different search term.';
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
