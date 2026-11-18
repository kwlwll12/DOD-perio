import * as T from './vendor/three.module.min.js';
import { anatomy } from './anatomy-data.js';

const root = [[-3.22,0],[-3.14,.12],[-2.95,.22],[-2.58,.34],[-2.08,.45],[-1.55,.53],[-.9,.59],[-.3,.63],[.2,.67],[.55,.70]];
const crown = [[.55,.70],[.76,.74],[1.14,.81],[1.66,.92],[2.19,1.02],[2.59,1.04],[2.84,.96],[3.01,.73],[3.1,.42],[3.14,0]];
const radius = (profile, y) => {
  const i = profile.findIndex(([height]) => height >= y);
  if (i < 0) return profile.at(-1)[1];
  if (i === 0) return profile[0][1];
  const [a,x] = profile[i-1], [b,z] = profile[i];
  return x+(z-x)*(y-a)/(b-a);
};
const rootAt = y => radius(root,y);
const toothAt = y => radius(y>.55 ? crown : root,y);
const front = .64;

export function buildCutaway(model) {
  const parts = new Map();
  function add(id, geometry, color, position) {
    const tone = new T.Color(color);
    const face = new T.MeshStandardMaterial({color:tone,roughness:.76});
    const side = new T.MeshStandardMaterial({color:tone.clone().multiplyScalar(.84),roughness:.8});
    const mesh = new T.Mesh(geometry, geometry.type==='ExtrudeGeometry' ? [face,side] : face);
    if (position) mesh.position.set(...position);
    model.add(mesh);
    if (!parts.has(id)) parts.set(id,[]);
    parts.get(id).push(mesh);
    return mesh;
  }
  function solid(id, pts, depth, z=0, bevel=.02, color=anatomy[id].color) {
    const shape=new T.Shape(pts.map(([x,y])=>new T.Vector2(x,y)));
    return add(id,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1}),color,[0,0,z]);
  }
  function mirror(profile, offset=0) {
    const a=profile.map(([y,x])=>[x+offset,y]);
    return a.concat(a.slice().reverse().map(([x,y])=>[-x,y]));
  }
  function stripe(id, inner, outer, depth, z, bevel) {
    for (const s of [-1,1]) solid(id, inner.concat(outer.slice().reverse()).map(([x,y])=>[s*x,y]),depth,z,bevel);
  }
  function tube(id, pts, thickness, color=anatomy[id].color) {
    const curve = new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
    add(id,new T.TubeGeometry(curve,12,thickness,5,false),color);
  }
  // Front of the tooth is slightly behind the cut faces of the surrounding tissues.
  solid('enamel',mirror(crown),.99,-.67,.045);
  solid('cementum',mirror(root),.89,-.56,.012);
  const body=root.concat(crown.slice(1)).map(([y,x])=>[y+(y<-3 ? .045 : y>2.7 ? -.17 : 0),Math.max(0,x-(y>.58?.15:.06))]);
  solid('dentin',mirror(body),1.04,-.685,.013);
  const pulp=[[-3.12,0],[-2.86,.033],[-2.45,.062],[-1.58,.095],[-.62,.145],[.27,.20],[.96,.27],[1.61,.37],[2.05,.36],[2.26,.27],[2.34,.11],[2.36,0]];
  solid('pulp',mirror(pulp),.047,.356,.011);
  tube('cej',[[.63,.55,.34],[.67,.55,.37],[.73,.55,.34]],.019);

  const levels=[-3.55,-3.33,-3.17,-2.95,-2.55,-2.05,-1.55,-1.05,-.65,-.42,-.32];
  const band=(offset,ys=levels) => ys.map(y=>[rootAt(y)+offset,y]);
  const outer=(base,top) => levels.map(y=>[base+(top-base)*(y+3.55)/3.23,y]);
  stripe('pdl',band(.02),band(.22),.92,-.52,.009);
  stripe('bundle',band(.22),band(.34),1.015,-.51,.013);
  stripe('lamellar',band(.34),band(.58),1.007,-.518,.015);
  stripe('cancellous',band(.58),outer(1.9,1.36),.95,-.50,.017);
  stripe('cortical',outer(1.9,1.36),outer(2.16,1.53),1.014,-.515,.021);
  solid('cortical',[[-2.16,-3.85],[2.16,-3.85],[2.16,-3.53],[-2.16,-3.53]],1.013,-.515,.038);

  for (let row=0;row<7;row++) {
    const y=-3.36+row*.44;
    const left=rootAt(y)+.70;
    const right=1.80-.16*(y+3.36);
    for (let j=0;j<3;j++) {
      const x=left+(right-left)*(j+1)/4+.032*Math.sin(row*3+j);
      for (const s of [-1,1]) {
        const geo=new T.SphereGeometry(.056+(j%2)*.018,10,7);
        geo.scale(1,.65,.20);
        add('cancellous',geo,'#a98e6b',[s*x,y+.085*Math.sin(j*3+row),.46]);
      }
    }
  }
  for (const s of [-1,1]) {
    for (const t of [.385,.446,.507,.56]){
      tube('lamellar',levels.slice(1).map(y=>[s*(rootAt(y)+t),y,.505]),.009,'#b39775');
    }
    const rim=[[-1.54,2.24],[-1.28,2.11],[-.95,1.96],[-.56,1.85],[-.18,1.69],[.19,1.56],[.43,1.39],[.67,1.25],[.84,1.11],[1.03,1.03],[1.14,.93]].map(([y,x])=>[x,y]);
    const inner=[[.90,.99],[.85,.87],[.81,.74],[.77,.70],[.76,.51],[.72,.23],[.83,-.11],[1.01,-.26],[1.32,-.30],[1.53,-.34],[1.76,-.89],[1.98,-1.54]];
    solid('ct',rim.concat(inner).map(([x,y])=>[s*x,y]),1.06,-.49,.047);
    const freeGrass=[[.93,1.14],[1.03,1.03],[1.11,.84],[1.25,.67],[1.18,.54],[1.01,.61],[.91,.77],[.85,.87],[.90,.99]];
    solid('free',freeGrass.map(([x,y])=>[s*x,y]),.025,.57,.017);
    const attachedStripe=rim.slice(0,8).concat(rim.slice(0,8).reverse().map(([x,y])=>[x-.14,y+.025]));
    solid('attached',attachedStripe.map(([x,y])=>[s*x,y]),.031,.57,.012);
    const lining=[[2.24,-1.54],[2.30,-1.83],[2.38,-2.34],[2.40,-2.63],[2.16,-2.53],[2.12,-2.14],[2.06,-1.77],[1.98,-1.54]];
    solid('mucosa',lining.map(([x,y])=>[s*x,y]),1.00,-.46,.028);
    tube('mgj',[[s*2.22,-1.58,.43],[s*2.21,-1.53,.59],[s*2.16,-1.52,.6]],.022);
    tube('oral',rim.map(([x,y])=>[s*x,y,.62]),.024);
    tube('margin',[[s*.95,1.11,.49],[s*.93,1.14,.62],[s*.94,1.12,.66]],.034);
    tube('sulcular',[[s*.923,1.10,.622],[s*.89,.98,.639],[s*.853,.87,.646],[s*.810,.74,.647]],.024);
    tube('sulcus',[[s*.840,1.054,.49],[s*.822,.96,.53],[s*.796,.76,.55]],.019,'#597782');
    tube('je',[[s*.776,.73,.64],[s*.75,.59,.65],[s*.728,.42,.65]],.036);
    tube('crest',[[s*.86,-.32,.525],[s*1.01,-.30,.537],[s*1.19,-.32,.53]],.023);
    for (let i=0;i<6;i++){
      const y=.21+i*.028;
      const pts=[[s*(toothAt(y)+.017),y,.663],[s*.88,y-.05,.662],[s*(1.01+i*.054),.34+i*.046,.659],[s*(1.28-i*.020),.43+i*.028,.656]];
      tube('gingival',pts,.013);
    }
    for (const [y, rise] of [[-.60,.22],[-.91,0],[-1.17,.23],[-1.46,.26],[-1.75,.24],[-2.04,.24],[-2.32,.22],[-2.59,.19],[-2.82,.13],[-3.02,-.06],[-3.15,-.13]]){
      const a=rootAt(y);
      const b=rootAt(y+rise)+.22;
      const points=[[s*(a+.02),y,.661],[s*(a+(b-a)*.47),y+rise*.42,.676],[s*(b-.012),y+rise,.662]];
      tube('principal',points,.014);
      tube('sharpey',[[s*(a-.035),y-.026,.65],points[0]],.018);
      tube('sharpey',[points[2],[s*(b+.078),y+rise+(rise>=0?.032:-.035),.65]],.018);
    }
  }
  return parts;
}
