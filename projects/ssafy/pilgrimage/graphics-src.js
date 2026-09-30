import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// These illustrations explain the implementation. They do not call the project API.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const diagrams = [];
const clamp = THREE.MathUtils.clamp;
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const v = (x, y, z) => new THREE.Vector3(x, y, z);

const stories = {
  service: {
    selector: '.service-flow',
    label: '서비스 이용 흐름 입체 도식',
    steps: ['촬영지 탐색', '주변 장소 검색', '위시리스트 저장', '여행 일정 편집'],
    descriptions: [
      '작품에 연결된 촬영지를 지도에서 확인합니다.',
      '촬영지 주변의 장소를 찾아 여행 동선을 구성합니다.',
      '관심 있는 촬영지와 장소를 모아 둡니다.',
      '저장한 장소를 날짜별 일정에 배치합니다.'
    ]
  },
  transaction: {
    selector: '.transaction-flow',
    label: '입력 검증과 트랜잭션 처리 입체 도식',
    steps: ['소유권과 입력 검증', '삭제 / 수정 / 추가', 'DB 반영'],
    descriptions: [
      '소유권과 전체 입력을 확인한 뒤 데이터 변경을 시작합니다.',
      '삭제, 수정, 추가를 하나의 트랜잭션 안에서 처리합니다.',
      '모든 변경이 성공해야 저장 결과를 반영합니다.'
    ]
  },
  batch: {
    selector: '.batch-flow',
    label: '여섯 단계 데이터 수집 배치 입체 도식',
    steps: ['게시물 탐색', '본문 파싱', '작품 매칭', '촬영지 저장', '이미지 저장', '결과 집계'],
    descriptions: [
      '외부 게시물을 찾아 수집 대상으로 등록합니다.',
      '본문에서 작품명과 촬영지 정보를 추출합니다.',
      '후보 점수와 점수 차를 확인해 TMDB 작품을 연결합니다.',
      '주소를 검증하고 좌표를 확인한 촬영지를 저장합니다.',
      '이미지를 WebP로 변환한 뒤 S3에 저장합니다.',
      '처리 상태와 오류 정보를 모아 결과를 확인합니다.'
    ]
  }
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .04, ...extra });
}

function box(w, h, d, mat, radius = .045) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, h / 3, d / 3, w / 3)), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function line(points, color = 0xa9aaa7, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}

function cylinder(radius, height, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sphere(radius, mat) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), mat);
  mesh.castShadow = true;
  return mesh;
}

function add(parent, child, x = 0, y = 0, z = 0) {
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

function paperLines(parent, mat, y, count = 3, width = .70) {
  for (let i = 0; i < count; i++) add(parent, box(width - i * .09, .013, .024, mat, .004), -.06, y, -.28 + i * .20);
}

function makeMap(parent, mats) {
  const xs = [-.80, -.27, .27, .80];
  const ys = [.14, .26, .14, .25];
  const vertices = [];
  for (let i = 0; i < 3; i++) {
    vertices.push(xs[i], ys[i], -.48, xs[i + 1], ys[i + 1], -.48, xs[i], ys[i], .48);
    vertices.push(xs[i + 1], ys[i + 1], -.48, xs[i + 1], ys[i + 1], .48, xs[i], ys[i], .48);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const map = new THREE.Mesh(geometry, mats.paperDouble);
  map.castShadow = true;
  map.receiveShadow = true;
  parent.add(map);
  for (let i = 0; i < 4; i++) parent.add(line([v(xs[i], ys[i] + .008, -.48), v(xs[i], ys[i] + .008, .48)], 0xc1c2be));
  parent.add(line(xs.map((x, i) => v(x, ys[i] + .01, -.48)), 0x9d9e99));
  parent.add(line(xs.map((x, i) => v(x, ys[i] + .01, .48)), 0x9d9e99));
  parent.add(line([v(-.64,.19,.27),v(-.37,.25,.13),v(-.12,.24,.13),v(.15,.19,-.14),v(.48,.21,-.14)], 0x666a64));
  add(parent, cylinder(.020, .33, mats.ink), .46, .39, -.14);
  add(parent, sphere(.100, mats.ink), .46, .60, -.14);
  add(parent, cylinder(.09, .016, mats.silver), .46, .235, -.14);
}

function makeSearch(parent, mats) {
  add(parent, box(1.20, .04, .94, mats.paper), -.07, .17, .02);
  paperLines(parent, mats.silver, .198, 3, .69);
  const glass = new THREE.Group();
  glass.rotation.x = -.43;
  glass.rotation.z = -.20;
  add(parent, glass, .12, .57, -.02);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.28, .043, 12, 48), mats.ink);
  rim.castShadow = true;
  glass.add(rim);
  const handle = cylinder(.035, .38, mats.ink);
  handle.rotation.z = -.63;
  add(glass, handle, -.25, -.34, 0);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.235, 40), new THREE.MeshStandardMaterial({color:0xf0f2ef,transparent:true,opacity:.38,roughness:.14,side:THREE.DoubleSide}));
  glass.add(lens);
  return glass;
}

function makeWishlist(parent, mats) {
  for (let i = 0; i < 3; i++) {
    const page = new THREE.Group();
    page.rotation.y = (i - 1) * .10;
    add(parent, page, (i - 1) * .05, .18 + i * .075, 0);
    page.add(box(1.02, .035, 1.15, mats.paper));
    if (i === 2) {
      paperLines(page, mats.silver, .025, 3, .56);
      const shape = new THREE.Shape();
      shape.moveTo(-.10, -.36); shape.lineTo(.10, -.36); shape.lineTo(.10, .19);
      shape.lineTo(0, .11); shape.lineTo(-.10, .19); shape.closePath();
      const bookmark = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.ink);
      bookmark.rotation.x = -Math.PI / 2;
      add(page, bookmark, .29, .032, -.19);
    }
  }
}

function makeCalendar(parent, mats) {
  const calendar = new THREE.Group();
  calendar.rotation.x = -.42;
  add(parent, calendar, 0, .60, .02);
  calendar.add(box(1.10, 1.08, .085, mats.paper));
  for (const x of [-.32,.32]) add(calendar, box(.06,.19,.10,mats.ink),x,.50,.02);
  add(calendar,box(.88,.022,.014,mats.silver),0,.23,.054);
  for(let i=0;i<3;i++) {
    add(calendar,box(.075,.075,.024,i===1?mats.ink:mats.silver),-.32,.05-i*.19,.059);
    add(calendar,box(.44-i*.055,.027,.018,mats.silver),.06,.05-i*.19,.058);
  }
}

class Diagram {
  constructor(kind) {
    this.kind = kind;
    this.story = stories[kind];
    this.original = document.querySelector(this.story.selector);
    this.selected = 0;
    this.hovered = -1;
    this.visible = false;
    this.paused = reducedMotion.matches;
    this.clock = 0;
    this.mode = 'normal';
    this.elapsed = 0;
    this.batchMode = 'flow';
    this.batchProgress = 0;
    this.angle = {x: 0, y: 0};
    this.targetAngle = {x: 0, y: 0};
    this.dirty = true;
    this.stations = [];
    this.pickables = [];
    this.makeDOM();
    try {
      this.makeScene();
      this.makeObjects();
      this.resize();
      this.renderer.render(this.scene, this.camera);
      this.figure.classList.add('is-ready');
      this.original.classList.add('enhanced-static');
      this.original.closest('.page').classList.add('has-motion');
      this.bindEvents();
    } catch (error) {
      this.dispose();
      this.figure.remove();
      this.original.classList.remove('enhanced-static');
      console.warn('Interactive illustration unavailable; showing the document diagram.', error.message);
    }
  }

  makeDOM() {
    this.figure = element('figure','motion-figure');
    this.figure.dataset.kind = this.kind;
    this.figure.setAttribute('aria-label',this.story.label);
    const top = element('div','motion-topline');
    if (this.kind === 'transaction') top.append(element('code','', 'PUT /api/v1/plans/{planId}/details'));
    const tools = element('div','motion-tools');
    tools.append(element('span','', '드래그해 회전'));
    this.reset = element('button','', '시점 초기화');
    this.reset.type = 'button';
    this.pause = element('button','', this.paused ? '재생' : '정지');
    this.pause.type = 'button';
    this.pause.setAttribute('aria-label',this.paused ? '움직임 재생' : '움직임 일시정지');
    tools.append(this.reset,this.pause);
    top.append(tools);
    this.stage = element('div','motion-stage');
    this.stage.tabIndex = 0;
    this.stage.setAttribute('role','group');
    this.stage.setAttribute('aria-label',`${this.story.label}. 드래그 또는 방향키로 회전하고 Home 키로 초기화합니다.`);
    this.stepBar = element('div','motion-steps');
    this.stepBar.style.setProperty('--step-count',this.story.steps.length);
    this.stepButtons = this.story.steps.map((name,index)=>{
      const button=element('button','motion-step');
      button.type='button';
      button.append(element('span','',String(index+1).padStart(2,'0')),document.createTextNode(name));
      button.setAttribute('aria-pressed',String(index===0));
      button.addEventListener('click',()=>this.select(index));
      this.stepBar.append(button);
      return button;
    });
    this.caption=element('figcaption','motion-caption',this.story.descriptions[0]);
    this.caption.setAttribute('aria-live','polite');
    this.figure.append(top,this.stage,this.stepBar,this.caption);
    if(this.kind!=='service') {
      this.actions=element('div','motion-actions');
      if(this.kind==='transaction') {
        this.commitButton=element('button','', '정상 저장');
        this.rollbackButton=element('button','', '오류 시 롤백');
        this.commitButton.type=this.rollbackButton.type='button';
        this.commitButton.addEventListener('click',()=>this.runTransaction('normal'));
        this.rollbackButton.addEventListener('click',()=>this.runTransaction('rollback'));
        this.actions.append(this.commitButton,this.rollbackButton);
      } else {
        this.resumeButton=element('button','', '실패 상황 보기');
        this.resumeButton.type='button';
        this.resumeButton.addEventListener('click',()=>this.batchAction());
        this.actions.append(this.resumeButton);
      }
      this.status=element('span','motion-status',this.kind==='transaction'?'변경 전 상태':'6단계 처리 흐름');
      this.status.setAttribute('aria-live','polite');
      this.actions.append(this.status);
      this.figure.append(this.actions);
    }
    this.original.before(this.figure);
  }

  makeScene() {
    this.scene=new THREE.Scene();
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor(0xffffff,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.18;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.stage.append(this.renderer.domElement);
    this.camera=new THREE.OrthographicCamera(-6,6,2,-2,.1,80);
    this.camera.position.set(1.2,7.0,10.5);
    this.camera.lookAt(0,.2,0);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xa4a59e,2.5));
    const key=new THREE.DirectionalLight(0xffffff,3.3);
    key.position.set(-3,8,4);
    key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    Object.assign(key.shadow.camera,{left:-9,right:9,top:5,bottom:-5,near:.5,far:30});
    key.shadow.bias=-.0005;
    key.shadow.normalBias=.015;
    key.shadow.radius=4;
    this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xf4f6ff,.8);
    fill.position.set(4,3,-5);
    this.scene.add(fill);
    this.root=new THREE.Group();
    this.scene.add(this.root);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,30),new THREE.ShadowMaterial({opacity:.12}));
    floor.rotation.x=-Math.PI/2;
    floor.position.y=-.115;
    floor.receiveShadow=true;
    this.root.add(floor);
    this.mats={paper:material(0xf7f7f4),paperDouble:material(0xf7f7f4,{side:THREE.DoubleSide}),silver:material(0xb6b8b2),ink:material(0x343733),base:material(0xe9eae6),line:material(0xc4c6bf)};
    this.raycaster=new THREE.Raycaster();
    this.pointer=new THREE.Vector2();
  }

  station(index, width=1.7, depth=1.35) {
    const station=new THREE.Group();
    const base=box(width,.10,depth,this.mats.base);
    station.add(base);
    const content=new THREE.Group();
    station.add(content);
    this.root.add(station);
    const item={group:station,content,index,base};
    this.stations.push(item);
    return item;
  }

  makeObjects() {
    if(this.kind==='service') {
      [makeMap,makeSearch,makeWishlist,makeCalendar].forEach((factory,i)=>{
        const s=this.station(i);
        s.feature=factory(s.content,this.mats);
      });
    } else if(this.kind==='transaction') {
      const request=this.station(0,1.9,1.35);
      for(let i=0;i<3;i++) {
        const page=add(request.content,box(1.24,.04,.98,this.mats.paper),.04*i,.16+i*.12,0);
        page.rotation.y=(i-1)*.06;
      }
      paperLines(request.content,this.mats.silver,.425,3,.75);
      const transaction=this.station(1,2.15,1.45);
      const framePoints=[v(-.88,.15,-.58),v(.88,.15,-.58),v(.88,.15,.58),v(-.88,.15,.58),v(-.88,.15,-.58)];
      transaction.content.add(line(framePoints,0x858b80));
      this.records=[];
      for(let i=0;i<3;i++) this.records.push(add(transaction.content,box(.43,.085,.81,i===2?this.mats.ink:this.mats.paper),-.56+i*.56,.235,0));
      const db=this.station(2,1.75,1.35);
      for(let i=0;i<3;i++) {
        add(db.content,cylinder(.48,.18,this.mats.paper),0,.20+i*.20,0);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.012,8,48),this.mats.silver);
        ring.rotation.x=Math.PI/2;
        add(db.content,ring,0,.295+i*.20,0);
      }
      this.dbCap=add(db.content,cylinder(.485,.065,this.mats.ink),0,.76,0);
      this.dbCap.scale.set(1,.01,1);
      this.savedMark=add(db.content,sphere(.065,this.mats.ink),0,.96,0);
      this.savedMark.visible=false;
    } else {
      for(let i=0;i<6;i++) {
        const s=this.station(i,1.37,1.19);
        const count=[1,3,2,2,3,1][i];
        for(let j=0;j<count;j++) add(s.content,box(.94,.07,.78,this.mats.paper),0,.14+j*.105,0);
        if(i===0||i===1) paperLines(s.content,this.mats.silver,.185+(count-1)*.105,2,.55);
        if(i===2) {
          const small=sphere(.07,this.mats.ink);
          add(s.content,small,.22,.42,.08);
          add(s.content,box(.42,.025,.025,this.mats.silver),-.1,.31,-.1);
        }
        if(i===3) {
          add(s.content,cylinder(.018,.20,this.mats.ink),.10,.39,0);
          add(s.content,sphere(.075,this.mats.ink),.10,.53,0);
        }
        if(i===4) {
          add(s.content,box(.52,.025,.38,this.mats.silver),0,.425,0);
          add(s.content,sphere(.07,this.mats.paper),.11,.46,-.045);
        }
        if(i===5) {
          for(let j=0;j<3;j++) add(s.content,box(.115,.15+j*.13,.4,j===2?this.mats.ink:this.mats.silver),-.24+j*.24,.22+j*.065,0);
        }
      }
    }
    this.stations.forEach((s)=>s.group.traverse((child)=>{
      if(child.isMesh){child.userData.stageIndex=s.index;this.pickables.push(child);}
    }));
    this.bead=add(this.root,sphere(.060,this.mats.ink));
    this.beadHalo=add(this.root,new THREE.Mesh(new THREE.TorusGeometry(.105,.009,8,32),this.mats.silver));
    this.beadHalo.rotation.x=Math.PI/2;
  }

  layout() {
    const narrow=this.stage.clientWidth<470;
    this.narrow=narrow;
    if(this.kind==='service') this.stations.forEach((s,i)=>s.group.position.set((i-1.5)*(narrow?2:3),0,0));
    if(this.kind==='transaction') this.stations.forEach((s,i)=>s.group.position.set((i-1)*(narrow?2.75:3.65),0,0));
    if(this.kind==='batch') this.stations.forEach((s,i)=>s.group.position.set(narrow?(i%3-1)*2.4:(i-2.5)*2.06,0,narrow?(i<3?-.95:1.0):0));
    if(this.track){this.root.remove(this.track);this.track.geometry.dispose();this.track.material.dispose();}
    const points=this.stations.map(s=>s.group.position.clone().add(v(0,.075,0)));
    const pathPoints=[];
    points.forEach((p,i)=>{
      if(this.kind==='batch'&&narrow&&i===3) {
        pathPoints.push(v(3.15,.075,-.95),v(3.15,.075,.95),v(-3.15,.075,.95));
      }
      pathPoints.push(p);
    });
    this.path=new THREE.CatmullRomCurve3(pathPoints,false,'catmullrom',.08);
    this.segments=points.slice(0,-1).map((point,i)=>{
      const segment=[point];
      if(this.kind==='batch'&&narrow&&i===2) segment.push(v(3.15,.075,-.95),v(3.15,.075,1),v(-3.15,.075,1));
      segment.push(points[i+1]);
      return new THREE.CatmullRomCurve3(segment,false,'catmullrom',.08);
    });
    this.track=line(this.path.getPoints(180),0xa3a69e,.55);
    this.root.add(this.track);
    this.worldWidth=narrow?(this.kind==='batch'?8.0:8.8):(this.kind==='batch'?13.4:12.25);
  }

  resize() {
    if(!this.renderer)return;
    this.layout();
    const width=this.stage.clientWidth||660;
    const height=this.stage.clientHeight||148;
    this.renderer.setSize(width,height,false);
    const half=this.worldWidth/2;
    this.camera.left=-half;this.camera.right=half;
    this.camera.top=half*height/width;this.camera.bottom=-half*height/width;
    this.camera.updateProjectionMatrix();
    this.dirty=true;
  }

  select(index, describe=true) {
    this.selected=index;
    this.stepButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    if(describe)this.caption.textContent=this.story.descriptions[index];
    this.dirty=true;
  }

  setPaused(paused) {
    this.paused=paused;
    this.pause.textContent=paused?'재생':'정지';
    this.pause.setAttribute('aria-label',paused?'움직임 재생':'움직임 일시정지');
    this.dirty=true;
  }

  runTransaction(mode) {
    this.mode=mode;
    this.elapsed=0;
    this.phase='';
    this.select(0,false);
    this.commitButton.setAttribute('aria-pressed',String(mode==='normal'));
    this.rollbackButton.setAttribute('aria-pressed',String(mode==='rollback'));
    if(reducedMotion.matches)this.elapsed=8;
    else this.setPaused(false);
    this.dirty=true;
  }

  batchAction() {
    if(this.batchMode==='failed') {
      this.batchMode='resume';
      this.batchProgress=reducedMotion.matches?6:3;
      this.resumeButton.textContent='남은 단계 처리 중';
      this.resumeButton.disabled=true;
      this.status.textContent='같은 ingestKey로 재개';
      this.caption.textContent='완료한 1~3단계를 건너뛰고 촬영지 저장부터 이어갑니다.';
      if(!reducedMotion.matches)this.setPaused(false);
    } else {
      this.batchMode='failed';
      this.batchProgress=3;
      this.select(3,false);
      this.caption.textContent='촬영지 저장 단계에서 중단된 예시입니다. 완료한 1~3단계는 유지합니다.';
      this.status.textContent='4단계에서 중단';
      this.resumeButton.textContent='같은 키로 재시작';
    }
    this.dirty=true;
  }

  hit(event) {
    const rect=this.stage.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    return this.raycaster.intersectObjects(this.pickables,false)[0]?.object.userData.stageIndex??-1;
  }

  bindEvents() {
    this.pause.addEventListener('click',()=>this.setPaused(!this.paused));
    this.reset.addEventListener('click',()=>{this.targetAngle={x:0,y:0};this.dirty=true;});
    this.stage.addEventListener('keydown',(event)=>{
      const delta={ArrowLeft:[0,-.08],ArrowRight:[0,.08],ArrowUp:[-.06,0],ArrowDown:[.06,0]};
      if(event.key==='Home'){this.targetAngle={x:0,y:0};event.preventDefault();}
      else if(delta[event.key]) {
        this.targetAngle.x=clamp(this.targetAngle.x+delta[event.key][0],-.18,.18);
        this.targetAngle.y=clamp(this.targetAngle.y+delta[event.key][1],-.35,.35);
        event.preventDefault();
      }
      this.dirty=true;
    });
    this.stage.addEventListener('pointerdown',(event)=>{
      if(event.button!==0)return;
      this.drag={x:event.clientX,y:event.clientY,ax:this.targetAngle.x,ay:this.targetAngle.y,moved:false};
      this.stage.setPointerCapture(event.pointerId);
      this.stage.classList.add('is-dragging');
    });
    this.stage.addEventListener('pointermove',(event)=>{
      if(this.drag) {
        const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;
        if(Math.hypot(dx,dy)>4)this.drag.moved=true;
        this.targetAngle.x=clamp(this.drag.ax+dy*.003,-.18,.18);
        this.targetAngle.y=clamp(this.drag.ay+dx*.003,-.35,.35);
      } else this.hovered=this.hit(event);
      this.dirty=true;
    });
    this.stage.addEventListener('pointerup',(event)=>{
      if(this.drag&&!this.drag.moved){const index=this.hit(event);if(index>=0)this.select(index);}
      this.drag=null;this.stage.classList.remove('is-dragging');
    });
    this.stage.addEventListener('pointercancel',()=>{this.drag=null;this.stage.classList.remove('is-dragging');});
    this.stage.addEventListener('pointerleave',()=>{this.hovered=-1;this.dirty=true;});
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.stage);
    this.intersection=new IntersectionObserver((entries)=>{this.visible=entries[0].isIntersecting;this.dirty=true;},{rootMargin:'80px'});
    this.intersection.observe(this.figure);
    this.renderer.domElement.addEventListener('webglcontextlost',(event)=>{
      event.preventDefault();this.visible=false;this.unavailable=true;
      this.figure.hidden=true;this.original.classList.remove('enhanced-static');
    });
  }

  update(dt) {
    if(!this.renderer||this.unavailable||!this.visible||document.hidden)return;
    const moving=!this.paused;
    const contentSettling=this.stations.some(s=>Math.abs(s.content.position.y-(s.index===(this.hovered>=0?this.hovered:this.selected)?.09:0))>.0001);
    const needsSettle=contentSettling||Math.abs(this.angle.x-this.targetAngle.x)+Math.abs(this.angle.y-this.targetAngle.y)>.0001;
    if(!moving&&!this.dirty&&!needsSettle)return;
    if(moving)this.clock+=dt;
    const easing=reducedMotion.matches?1:1-Math.exp(-dt*9);
    this.angle.x=THREE.MathUtils.lerp(this.angle.x,this.targetAngle.x,easing);
    this.angle.y=THREE.MathUtils.lerp(this.angle.y,this.targetAngle.y,easing);
    this.root.rotation.set(this.angle.x,this.angle.y,0);
    for(const s of this.stations) {
      const focus=s.index===(this.hovered>=0?this.hovered:this.selected);
      const target=focus?.09:0;
      s.content.position.y=THREE.MathUtils.lerp(s.content.position.y,target,easing);
    }
    if(this.kind==='service') {
      const t=(this.clock*.085)%1;
      const point=this.path.getPointAt(t);
      point.y=.13;
      this.bead.position.copy(point);
      this.beadHalo.position.copy(point).y=.081;
      this.stations[1].feature.rotation.z=-.20+Math.sin(this.clock*.65)*.035;
      this.stations[1].feature.position.y=.57+Math.sin(this.clock*.8)*.022;
    }
    if(this.kind==='transaction')this.updateTransaction(moving?dt:0);
    if(this.kind==='batch')this.updateBatch(moving?dt:0);
    this.renderer.render(this.scene,this.camera);
    this.dirty=false;
  }

  updateTransaction(dt) {
    this.elapsed=Math.min(8,this.elapsed+dt);
    const t=this.elapsed/8;
    const rollback=this.mode==='rollback';
    let journey=rollback?(t<.55?smooth(t/.55)*.53:(1-smooth((t-.55)/.45))*.53):smooth(t);
    const point=this.path.getPointAt(clamp(journey,0,1));
    point.y=.18+Math.sin(Math.PI*clamp(journey,0,1))*.12;
    this.bead.position.copy(point);
    this.bead.visible=t<.99;
    this.beadHalo.visible=t<.99;
    this.beadHalo.position.copy(point).y=.08;
    const lift=smooth((t-.16)/.2)*(1-smooth((t-.65)/.3));
    this.records.forEach((record,i)=>{
      record.position.y=.235+lift*(.20+i*.035);
      record.position.z=lift*(i-1)*.13;
    });
    const saved=rollback?0:smooth((t-.72)/.23);
    this.dbCap.visible=saved>.02;
    this.dbCap.scale.y=Math.max(.01,saved);
    this.dbCap.position.y=.70+saved*.06;
    this.savedMark.visible=saved>.98;
    const phase=t<.24?'validate':t<.56?'change':t<.98?(rollback?'undo':'save'):'done';
    if(this.phase!==phase) {
      this.phase=phase;
      const status={validate:'소유권과 입력 확인',change:'트랜잭션 안에서 변경',undo:'변경 내용 롤백',save:'변경 내용 반영',done:rollback?'변경 전 상태 유지':'전체 변경 저장 완료'};
      this.status.textContent=status[phase];
      this.select(phase==='validate'?0:phase==='save'||phase==='done'?2:1,false);
      if(phase==='done')this.caption.textContent=rollback?'처리 중 오류가 나면 변경을 롤백해 DB의 기존 상태를 유지합니다.':'삭제, 수정, 추가가 함께 반영된 뒤 저장 결과를 반환합니다.';
      else if(phase==='undo')this.caption.textContent='변경 도중 발생한 오류로 전체 트랜잭션을 되돌리는 예시입니다.';
      else this.caption.textContent=this.story.descriptions[this.selected];
    }
  }

  updateBatch(dt) {
    if(this.batchMode==='flow')this.batchProgress=(this.batchProgress+dt*.42)%6;
    if(this.batchMode==='resume') {
      this.batchProgress=Math.min(6,this.batchProgress+dt*.70);
      if(this.batchProgress>=6) {
        this.batchMode='complete';this.resumeButton.disabled=false;
        this.resumeButton.textContent='실패 상황 다시 보기';
        this.status.textContent='남은 단계 처리 완료';
        this.caption.textContent='완료한 1~3단계는 유지하고, 4~6단계를 처리했습니다.';
        this.select(5,false);
      }
    }
    const progress=this.batchMode==='failed'?3:this.batchProgress;
    const index=Math.min(5,Math.floor(progress));
    for(const s of this.stations) {
      const completed=this.batchMode!=='flow'&&s.index<progress;
      s.base.material=completed?this.mats.silver:this.mats.base;
      const pulse=this.batchMode==='failed'&&s.index===3?.025:0;
      s.group.position.y=pulse;
    }
    const segmentIndex=Math.min(4,Math.floor(progress));
    const point=this.segments[segmentIndex].getPointAt(clamp(progress-segmentIndex,0,1));
    point.y=.12;
    this.bead.position.copy(point);
    this.beadHalo.position.copy(point).y=.08;
    this.bead.visible=this.batchMode!=='complete';
    this.beadHalo.visible=this.batchMode!=='complete';
    if(this.batchMode==='resume'&&this.selected!==index)this.select(index,false);
  }

  dispose() {
    this.resizeObserver?.disconnect();this.intersection?.disconnect();
    this.scene?.traverse((object)=>{
      object.geometry?.dispose();
      if(object.material)for(const mat of [].concat(object.material))mat.dispose();
    });
    this.renderer?.dispose();
  }
}

for(const kind of Object.keys(stories))diagrams.push(new Diagram(kind));
let previous=performance.now();
let printing=false;
function frame(now) {
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(!printing)diagrams.forEach(diagram=>diagram.update(dt));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('beforeprint',()=>{printing=true;});
addEventListener('afterprint',()=>{printing=false;diagrams.forEach(d=>d.dirty=true);});
reducedMotion.addEventListener('change',(event)=>diagrams.forEach(d=>d.setPaused(event.matches)));
addEventListener('pagehide',(event)=>{if(!event.persisted)diagrams.forEach(d=>d.dispose());});
