import * as T from './vendor/three.module.min.js';
import { anatomy } from './anatomy-data.js';
import { buildCutaway } from './geometry.js';

const $ = selector => document.querySelector(selector);
const ns = 'http://www.w3.org/2000/svg';
const labels = {
  overview: ['enamel','cej','margin','je','gingival','crest','pdl','bundle','cancellous'],
  gingiva: ['margin','sulcus','sulcular','je','oral','attached','mgj','mucosa'],
  attachment: ['crest','cementum','pdl','principal','sharpey','bundle','lamellar','cancellous','cortical'],
};
const setups = {
  overview: {center:-.28, zoom:1},
  gingiva:{center:.05, zoom:1.41},
  attachment:{center:-1.36, zoom:1.36},
};
const groupViews = {Tooth:'overview',Gingiva:'gingiva',Attachment:'attachment'};
const modelBox = $('#model');
const pinLayer = $('#pins');
const leaders = $('#leaders');
const entries = Object.entries(anatomy);
const groups = [...new Set(entries.map(([, part])=>part.group))];
const layerButtons = new Map();
let view = 'overview';
let selected = null;
let magnification = 1;
let drag = null;
let frame = null;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(label, action, className) {
  const node=element('button',label,className);
  node.type='button';
  node.addEventListener('click',action);
  return node;
}

for (const group of groups) {
  const section = element('div','','layer-group');
  const list = element('div','','layer-items');
  section.append(element('h3',group),list);
  for (const [id,part] of entries.filter(([, item])=>item.group===group)) {
    const btn=button(part.label,()=>select(id));
    btn.style.setProperty('--chip',part.color);
    btn.prepend(element('i'));
    layerButtons.set(id,btn);
    list.append(btn);
  }
  $('#layer-list').append(section);
}

function renderDetail() {
  const panel=$('#detail');
  panel.replaceChildren();
  if (!selected) {
    panel.append(
      element('p','L1b · Periodontal Health','eyebrow'),
      element('h2','From gingival margin to root apex'),
      element('p','Select a label to highlight it. Use Gingival margin to follow the sulcus to the junctional epithelium, or Attachment to trace the fibers into the socket wall.'),
      element('p','This single-rooted model uses an enlarged, schematic cut face. Layer thickness and fiber size are exaggerated.')
    );
    return;
  }
  const part=anatomy[selected];
  panel.append(element('p',part.group,'eyebrow'),element('h2',part.label),element('p',part.text));
  if (part.map) {
    const link=element('a','Find this concept on the map →','map-link');
    link.href='../#'+part.map;
    panel.append(link);
  }
  if (part.pages?.length) {
    const original=element('details');
    original.append(element('summary',`Original L1b slides (${part.pages.length})`));
    original.addEventListener('toggle',()=>{
      if (!original.open || original.childElementCount>1) return;
      for (const page of part.pages) {
        const figure=element('figure');
        const a=element('a');
        a.href='../'+encodeURIComponent('L1b_Periodontium in Health.pdf')+'#page='+page;
        a.target='_blank';
        a.rel='noopener';
        const image=element('img');
        image.src=`../study-assets/pages/06-${String(page).padStart(3,'0')}.jpg`;
        image.alt=`Original L1b page ${page}`;
        image.loading='lazy';
        a.append(image);
        figure.append(a,element('figcaption',`L1b · page ${page}`));
        original.append(figure);
      }
    });
    panel.append(original);
  }
}

const model = new T.Group();
const scene = new T.Scene();
const camera = new T.OrthographicCamera(-1,1,1,-1,.1,80);
camera.position.set(0,0,12);
scene.add(model);
const key=new T.DirectionalLight(0xfff8e8,2.45);
key.position.set(-4,8,9);
const fill=new T.DirectionalLight(0xdaebff,.68);
fill.position.set(5,2,5);
scene.add(new T.HemisphereLight(0xfafcff,0xb9a68f,1.65),key,fill);

let renderer;
let parts = new Map();
try {
  renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.domElement.setAttribute('aria-hidden','true');
  modelBox.prepend(renderer.domElement);
  parts=buildCutaway(model);
} catch (error) {
  renderer?.dispose();
  renderer?.domElement.remove();
  renderer=null;
  $('#unavailable').hidden=false;
  for (const sel of ['#minus','#plus','#reset']) $(sel).disabled=true;
}

/* Refresh label positions after camera or model changes. Each label remains attached to its 3D point. */
function drawLabels(w,h) {
  const ids = labels[view].slice();
  if (selected && !ids.includes(selected)) ids.push(selected);
  const limit=w<520 ? 5 : 10;
  const shown=ids.length<=limit ? ids : ids.filter(id=>id!==selected).slice(0,limit-(selected?1:0)).concat(selected?[selected]:[]);
  const projected=shown.map(id=>{
    const point=new T.Vector3(...anatomy[id].at);
    model.localToWorld(point);
    point.project(camera);
    return {id,x:(point.x+1)*w/2,y:(1-point.y)*h/2};
  }).filter(({x,y})=>x>0&&x<w&&y>43&&y<h-36).sort((a,b)=>a.y-b.y);
  const lo=72;
  const hi=h-58;
  const gap=w<520?26:31;
  const rail=w-(w<520?151:214);
  let cursor=lo-gap;
  const rows=projected.map(point=>{
    cursor=Math.max(cursor+gap,point.y);
    return {...point,row:cursor};
  });
  const overflow=Math.max(0,(rows.at(-1)?.row||lo)-hi);
  for (const entry of rows) entry.row-=overflow;
  for (let i=0;i<rows.length;i++) rows[i].row=Math.max(lo+i*gap,rows[i].row);

  const existing=new Map([...pinLayer.children].map(item=>[item.dataset.part,item]));
  const lines=[];
  for (const item of rows) {
    const {id,x,y,row}=item;
    const part=anatomy[id];
    const b=existing.get(id)||button(part.label,()=>select(id),'pin');
    existing.delete(id);
    b.dataset.part=id;
    b.style.setProperty('--chip',part.color);
    b.classList.toggle('active',id===selected);
    b.setAttribute('aria-pressed',String(id===selected));
    b.style.left=rail+'px';
    b.style.top=row+'px';
    if (!b.isConnected) pinLayer.append(b);
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',`M ${x} ${y} L ${rail-13} ${row} H ${rail}`);
    if(id===selected)path.classList.add('active');
    const dot=document.createElementNS(ns,'circle');
    dot.setAttribute('cx',x);
    dot.setAttribute('cy',y);
    dot.setAttribute('r',id===selected?5:3.8);
    dot.setAttribute('fill',part.color);
    lines.push(path,dot);
  }
  for (const item of existing.values()) item.remove();
  leaders.replaceChildren(...lines);
}

function draw() {
  frame=null;
  if (!renderer) return;
  const w=modelBox.clientWidth, h=modelBox.clientHeight;
  if (!w||!h) return;
  const previous=renderer.getSize(new T.Vector2());
  if (previous.x!==w||previous.y!==h) renderer.setSize(w,h,false);
  const horizontal=w/h;
  const setup=setups[view];
  const span=Math.max(4.52,3.4/horizontal)/(setup.zoom*magnification);
  const shift=span*horizontal*(w<520?.24:.18);
  camera.left=-span*horizontal+shift;
  camera.right=span*horizontal+shift;
  camera.top=span+setup.center;
  camera.bottom=-span+setup.center;
  camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  drawLabels(w,h);
}
function queueDraw() {
  if (frame===null) frame=requestAnimationFrame(draw);
}
function refreshHighlight() {
  for (const [id,meshes] of parts) {
    for (const mesh of meshes) {
      const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      for (const material of materials) {
        material.emissive.copy(id===selected?material.color:new T.Color(0));
        material.emissiveIntensity=id===selected?.38:0;
      }
    }
  }
  for (const [id,btn] of layerButtons) {
    btn.classList.toggle('active',id===selected);
    btn.setAttribute('aria-pressed',String(id===selected));
  }
  queueDraw();
}
function setView(next, resetSelection=true) {
  view=next;
  magnification=1;
  model.rotation.set(.055,-.24,0);
  if (resetSelection) selected=null;
  for (const btn of document.querySelectorAll('[data-view]')) btn.setAttribute('aria-pressed',String(btn.dataset.view===view));
  renderDetail();
  refreshHighlight();
}
function select(id) {
  selected=selected===id?null:id;
  if (selected && view!=='overview' && view!==groupViews[anatomy[id].group]) {
    setView(groupViews[anatomy[id].group],false);
    return;
  }
  renderDetail();
  refreshHighlight();
}
function zoom(factor) {
  magnification=Math.min(2.2,Math.max(.66,magnification*factor));
  queueDraw();
}
function rotate(dx,dy) {
  model.rotation.y=T.MathUtils.clamp(model.rotation.y+dx*.008,-.83,.83);
  model.rotation.x=T.MathUtils.clamp(model.rotation.x+dy*.008,-.42,.42);
  queueDraw();
}

for (const btn of document.querySelectorAll('[data-view]')) btn.onclick=()=>setView(btn.dataset.view);
$('#minus').onclick=()=>zoom(.84);
$('#plus').onclick=()=>zoom(1.2);
$('#reset').onclick=()=>setView(view);
modelBox.addEventListener('pointerdown',event=>{
  if (!renderer || event.button!==0 || event.target.closest('button')) return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  modelBox.setPointerCapture(event.pointerId);
  modelBox.classList.add('dragging');
});
modelBox.addEventListener('pointermove',event=>{
  if (!drag||drag.id!==event.pointerId) return;
  rotate(event.clientX-drag.x,event.clientY-drag.y);
  drag.x=event.clientX;
  drag.y=event.clientY;
});
modelBox.addEventListener('lostpointercapture',()=>{
  drag=null;
  modelBox.classList.remove('dragging');
});
modelBox.addEventListener('wheel',event=>{
  if (!renderer) return;
  event.preventDefault();
  zoom(Math.exp(-Math.max(-140,Math.min(140,event.deltaY))*.004));
},{passive:false});
modelBox.addEventListener('keydown',event=>{
  if (event.target!==modelBox||!renderer) return;
  const directions={ArrowUp:[0,-16],ArrowDown:[0,16],ArrowLeft:[-16,0],ArrowRight:[16,0]};
  if (directions[event.key]) {event.preventDefault();rotate(...directions[event.key]);}
  if (['+','=','-'].includes(event.key)) {event.preventDefault();zoom(event.key==='-'?.84:1.2);}
  if (event.key==='0') {event.preventDefault();setView(view);}
});
new ResizeObserver(queueDraw).observe(modelBox);
setView('overview');
