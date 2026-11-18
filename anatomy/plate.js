'use strict';

const canvas = document.querySelector('#canvas');
const plate = document.querySelector('#plate');
const zoomReadout = document.querySelector('#zoom');
const nativeWidth = Number(plate.getAttribute('width'));
const nativeHeight = Number(plate.getAttribute('height'));
let zoom = 1;
let fit = false;

function draw() {
  if (fit) zoom = Math.min(1, canvas.clientHeight * nativeWidth / (nativeHeight * canvas.clientWidth));
  const width = Math.round(canvas.clientWidth * zoom);
  plate.style.width = width + 'px';
  zoomReadout.value = Math.round(width / nativeWidth * 100) + '%';
}

function changeZoom(factor) {
  const oldWidth = plate.getBoundingClientRect().width;
  const x = (canvas.scrollLeft + canvas.clientWidth / 2) / oldWidth;
  const y = (canvas.scrollTop + canvas.clientHeight / 2) / oldWidth;
  fit = false;
  const minZoom = Math.min(1, canvas.clientHeight * nativeWidth / (nativeHeight * canvas.clientWidth));
  zoom = Math.min(Math.max(4, nativeWidth * 2 / canvas.clientWidth), Math.max(minZoom, zoom * factor));
  draw();
  canvas.scrollLeft = x * plate.clientWidth - canvas.clientWidth / 2;
  canvas.scrollTop = y * plate.clientWidth - canvas.clientHeight / 2;
}

document.querySelector('#in').onclick = () => changeZoom(1.35);
document.querySelector('#out').onclick = () => changeZoom(1 / 1.35);
document.querySelector('#fit').onclick = () => {
  fit = true;
  canvas.scrollTo(0, 0);
  draw();
};
new ResizeObserver(draw).observe(canvas);
draw();
