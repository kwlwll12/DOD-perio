'use strict';

const {groups, nodes, edges} = window.perioMap;
const sources = new Map(window.lectureSources.map(source => [source.id, source]));
const groupById = new Map(groups.map(group => [group.id, group]));
const nodeById = new Map(nodes.map(node => [node.id, node]));
const linksById = new Map();
const buttons = new Map();
const $ = selector => document.querySelector(selector);
const viewport = $('#viewport');
const world = $('#world');
const detail = $('#detail');
const search = $('#find');
const matches = $('#matches');
const width = 4350;
const height = 2470;
const ns = 'http://www.w3.org/2000/svg';

let zoom = 1;
let panX = 0;
let panY = 0;
let activeId = null;
let drag = null;
let openFrom = null;

function element(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}

function button(text, action, className) {
  const item = element('button', text, className);
  item.type = 'button';
  item.addEventListener('click', action);
  return item;
}

function place(item, x, y) {
  item.style.left = x + 'px';
  item.style.top = y + 'px';
}

function renderRegions() {
  for (const group of groups) {
    const region = element('div', '', 'region');
    region.style.setProperty('--tone', group.color);
    place(region, group.x, group.y);
    region.style.width = group.width + 'px';
    region.style.height = group.height + 'px';
    world.append(region);
    const option = element('option', group.label);
    option.value = group.id;
    $('#jump').append(option);
    if (group.id === 'anatomy') {
      const title = button(group.label, () => focusGroup(group), 'region-heading');
      title.style.setProperty('--tone', group.color);
      place(title, group.x + 35, group.y + 22);
      world.append(title);
    }
  }
}

function renderNodes() {
  for (const node of nodes) {
    const group = groupById.get(node.group);
    const item = button(node.isGroup ? node.label : '', () => {
      if (node.isGroup) focusGroup(group);
      selectNode(node, item);
    }, node.isGroup ? 'region-heading' : 'map-node');
    place(item, node.x, node.isGroup ? group.y + 22 : node.y);
    item.style.setProperty('--tone', group.color);
    item.dataset.node = node.id;
    item.setAttribute('aria-expanded', 'false');
    item.setAttribute('aria-controls', 'detail');
    if (!node.isGroup) item.append(element('strong', node.label), element('small', node.sub));
    item.addEventListener('focus', event => {
      if (event.target.matches(':focus-visible')) {
        const r = item.getBoundingClientRect();
        if (r.left < 12 || r.right > innerWidth - 12 || r.top < 65 || r.bottom > innerHeight - 55) centerNode(node);
      }
    });
    buttons.set(node.id, item);
    world.append(item);
  }
}

function center(node) {
  const btn = buttons.get(node.id);
  return [btn.offsetLeft + btn.offsetWidth / 2, btn.offsetTop + btn.offsetHeight / 2];
}

function renderLinks() {
  for (const [from, to, description] of edges) {
    const a = nodeById.get(from);
    const b = nodeById.get(to);
    const [x1, y1] = center(a);
    const [x2, y2] = center(b);
    const across = a.group !== b.group;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const path = document.createElementNS(ns, 'path');
    const bend = across ? Math.min(180, Math.hypot(dx, dy) * .12) : 0;
    const norm = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 - bend * dy / norm;
    const cy = (y1 + y2) / 2 + bend * dx / norm;
    path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    path.setAttribute('class', description ? 'link cross' : 'link');
    $('#links').append(path);
    for (const [id, other] of [[from, to], [to, from]]) {
      if (!linksById.has(id)) linksById.set(id, []);
      linksById.get(id).push({other, description, path});
    }
  }
}

function draw() {
  world.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
  world.classList.toggle('overview', zoom < .46);
  viewport.style.backgroundPosition = `${panX % 22}px ${panY % 22}px`;
  $('#scale').value = Math.round(zoom * 100) + '%';
}

function centerArea(x, y, w, h, maxZoom = 1.35) {
  const visibleHeight = Math.max(90, innerHeight - 130);
  zoom = Math.min((innerWidth - 25) / w, visibleHeight / h, maxZoom);
  panX = (innerWidth - w * zoom) / 2 - x * zoom;
  panY = (innerHeight - h * zoom) / 2 - y * zoom + 10;
  draw();
}

function fit() {
  closeDetail();
  centerArea(0, 0, width, height);
}

function focusGroup(group) {
  centerArea(group.x - 40, group.y - 35, group.width + 80, group.height + 70, 1.12);
}

function centerNode(node) {
  zoom = Math.max(zoom, .92);
  const [x, y] = center(node);
  const leftWidth = innerWidth > 720 && !detail.hidden ? innerWidth - detail.offsetWidth - 24 : innerWidth;
  panX = leftWidth / 2 - x * zoom;
  panY = (innerWidth > 720 ? innerHeight / 2 : innerHeight * .3) - y * zoom;
  draw();
}

function scale(factor, x = innerWidth / 2, y = innerHeight / 2) {
  const next = Math.min(3.5, Math.max(Math.min(.035, zoom), zoom * factor));
  panX = x - (x - panX) * next / zoom;
  panY = y - (y - panY) * next / zoom;
  zoom = next;
  draw();
}

function sourceCaption([id, page]) {
  const {code, title} = sources.get(id);
  return `${code} · ${title} · page ${page}`;
}

function sourceLink([id, page]) {
  const link = element('a', 'Open original PDF ↗', 'source-link');
  link.href = `./${encodeURIComponent(sources.get(id).file)}#page=${page}`;
  link.target = '_blank';
  link.rel = 'noopener';
  return link;
}

function sourceImage([id, page]) {
  return `study-assets/pages/${String(id).padStart(2, '0')}-${String(page).padStart(3, '0')}.jpg`;
}

function slideToggles(node) {
  const list = element('details');
  list.append(element('summary', `Original lecture slides (${node.refs.length})`));
  list.addEventListener('toggle', () => {
    if (!list.open || list.childElementCount > 1) return;
    for (const ref of node.refs) {
      const caption = sourceCaption(ref);
      const figure = element('figure');
      const img = element('img');
      img.src = sourceImage(ref);
      img.alt = caption;
      img.loading = 'lazy';
      const zoomSlide = button('', () => {
        $('#slide-title').textContent = caption;
        $('#slide-full').alt = caption;
        $('#slide-full').src = img.src;
        $('#slide').showModal();
      });
      zoomSlide.setAttribute('aria-label', `Enlarge ${caption}`);
      zoomSlide.append(img);
      figure.append(element('figcaption', caption), zoomSlide, sourceLink(ref));
      list.append(figure);
    }
  });
  return list;
}

function highlight() {
  for (const [id, btn] of buttons) {
    btn.classList.toggle('active', id === activeId);
    btn.setAttribute('aria-expanded', String(id === activeId));
  }
  for (const path of $('#links').children) {
    path.classList.remove('active');
    path.classList.toggle('dim', Boolean(activeId));
  }
  for (const {path} of linksById.get(activeId) || []) path.classList.add('active');
}

function selectNode(node, trigger) {
  activeId = node.id;
  if (trigger) openFrom = trigger;
  detail.hidden = false;
  detail.scrollTop = 0;
  const group = groupById.get(node.group);
  detail.style.setProperty('--tone', group.color);
  $('#detail-group').textContent = group.label;
  $('#detail-title').textContent = node.label;
  const body = $('#detail-body');
  body.replaceChildren();
  for (const quote of node.quote || []) {
    const label = quote.pages?.length > 1
      ? `L1b · original slide text · pages ${quote.pages.join(', ')}`
      : `Original slide text · ${sourceCaption(quote.ref)}`;
    body.append(element('p', label, 'quote-label'), element('blockquote', quote.text));
  }
  if (node.refs?.length) body.append(slideToggles(node));
  const linkList = element('div', '', 'neighbors');
  for (const {other, description} of linksById.get(node.id) || []) {
    const neighbor = nodeById.get(other);
    const item = button(neighbor.label, () => {
      selectNode(neighbor);
      centerNode(neighbor);
      $('#close').focus({preventScroll:true});
    }, 'neighbor');
    if (description) item.append(element('small', description));
    linkList.append(item);
  }
  if (linkList.childElementCount) body.append(element('h3', 'Connected concepts'), linkList);
  highlight();
  history.replaceState(null, '', '#' + node.id);
}

function closeDetail(restoreFocus = false) {
  if (!activeId) return;
  activeId = null;
  detail.hidden = true;
  highlight();
  history.replaceState(null, '', location.pathname + location.search);
  if (restoreFocus) openFrom?.focus({preventScroll:true});
  openFrom = null;
}

function findNodes() {
  const query = search.value.toLowerCase().trim();
  matches.replaceChildren();
  matches.hidden = !query;
  if (!query) return;
  const found = nodes.filter(node => {
    const lectures = [...new Set((node.refs || []).map(([id]) => id))]
      .map(id => sources.get(id));
    const fields = [node.label, node.sub, groupById.get(node.group).label, ...lectures.flatMap(s => [s.code, s.title])];
    return fields.join(' ').toLowerCase().includes(query);
  }).sort((a,b) => Number(b.label.toLowerCase().includes(query)) - Number(a.label.toLowerCase().includes(query)));
  for (const node of found) {
    matches.append(button(node.label, () => {
      matches.hidden = true;
      selectNode(node, search);
      centerNode(node);
      $('#close').focus({preventScroll:true});
    }));
  }
  if (!found.length) matches.append(element('p', 'No matching concepts.'));
}

renderRegions();
renderNodes();
renderLinks();
const target = nodeById.get(location.hash.slice(1));
if (target) {
  selectNode(target);
  centerNode(target);
} else fit();
$('#fit').onclick = fit;
$('#zoom-in').onclick = () => scale(1.25);
$('#zoom-out').onclick = () => scale(.8);
$('#close').onclick = () => closeDetail(true);
$('#jump').onchange = event => {
  const group = groupById.get(event.target.value);
  if (group) { closeDetail(); focusGroup(group); }
  event.target.value = '';
};
search.oninput = findNodes;
search.onfocus = findNodes;
search.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !matches.hidden) { event.preventDefault(); matches.querySelector('button')?.click(); }
  if (event.key === 'ArrowDown' && !matches.hidden) { event.preventDefault(); matches.querySelector('button')?.focus(); }
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.search-wrap')) matches.hidden = true;
});
viewport.addEventListener('wheel', event => {
  event.preventDefault();
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
  scale(Math.exp(-Math.max(-160, Math.min(160, delta)) * .0035), event.clientX, event.clientY);
}, {passive:false});
viewport.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.target.closest('button')) return;
  drag = {id:event.pointerId, x:event.clientX - panX, y:event.clientY - panY};
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  panX = event.clientX - drag.x;
  panY = event.clientY - drag.y;
  draw();
});
viewport.addEventListener('lostpointercapture', () => {
  drag = null;
  viewport.classList.remove('dragging');
});
document.addEventListener('keydown', event => {
  if ($('#slide').open) return;
  if (event.key === 'Escape') {
    if (!matches.hidden) matches.hidden = true;
    else closeDetail(true);
    return;
  }
  if (event.target !== viewport) return;
  const pan = {ArrowUp:[0,80], ArrowDown:[0,-80], ArrowLeft:[80,0], ArrowRight:[-80,0]}[event.key];
  if (pan) { event.preventDefault(); panX += pan[0]; panY += pan[1]; draw(); }
  else if (['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault();
    if (event.key === '0') fit();
    else scale(event.key === '-' ? .8 : 1.25);
  }
});
window.addEventListener('resize', () => activeId ? centerNode(nodeById.get(activeId)) : draw());
