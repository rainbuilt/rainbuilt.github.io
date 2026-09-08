/* Hand-built WebGL meshes. No engine, remote assets, or network requests. */
(() => {
  'use strict';
  const canvas = document.getElementById('stack-model');
  if (!canvas) return;
  const viewport = canvas.parentElement;
  const slider = document.getElementById('explode');
  const hint = document.getElementById('model-hint');
  const description = document.getElementById('layer-description');
  const layerButtons = [...document.querySelectorAll('[data-layer]')];
  const descriptions = [
    'PC: Ryzen의 CPU 가상화 기능을 Linux KVM에서 사용합니다. GPU는 화면을 그리는 일을 맡습니다.',
    'Fedora: Linux 커널의 KVM과 /dev/kvm 접근 권한을 확인합니다. KDE는 창과 입력을 관리합니다.',
    'Android: Emulator가 AVD 설정과 시스템 이미지를 읽어 가상 기기를 실행합니다. CPU 경로에는 KVM을 사용합니다.',
    '앱: Gradle이 만든 APK를 adb로 설치합니다. 앱 코드는 Android 런타임에서 실행되고 Compose가 화면을 구성합니다.'
  ];
  let selected = 0;
  let yaw = 0.63, pitch = 0.67, expansion = Number(slider.value) / 100;
  let gl, program, drawRequested = false, cssScene = null, cssOrbit = null;
  let interactionSurface = canvas;
  const objects = [];

  function setLayer(index) {
    selected = index;
    layerButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    description.textContent = descriptions[index];
    requestDraw();
  }
  layerButtons.forEach(button => button.addEventListener('click', () => setLayer(Number(button.dataset.layer))));

  function makeCSSModel() {
    if (!window.CSS || !CSS.supports('transform-style','preserve-3d')) return false;
    const tops = [
      '<rect width="280" height="186" rx="10" fill="#294e5c"/><g fill="none" stroke="#739085" stroke-width="2"><path d="M15 30H240V60H210V135H20M20 45H220V80H175V115H25M25 62H155V98H250"/></g><rect x="28" y="52" width="76" height="65" rx="6" fill="#193541"/><rect x="42" y="65" width="48" height="37" rx="3" fill="#abbdb4"/><g fill="#1c3840"><rect x="145" y="50" width="20" height="54"/><rect x="179" y="50" width="20" height="54"/><rect x="213" y="50" width="20" height="54"/></g><text x="19" y="154" fill="#eff7ee" font-size="18" font-weight="700">01 / HARDWARE</text><text x="19" y="174" fill="#c2d6d2" font-size="10">RYZEN CPU + MEMORY + GPU</text>',
      '<rect width="280" height="186" rx="10" fill="#bcd6ee"/><text x="20" y="34" fill="#2e5875" font-size="22" font-weight="700">02 / FEDORA 44</text><text x="21" y="54" fill="#4a6c82" font-size="11">KDE PLASMA</text><rect x="20" y="72" width="240" height="77" rx="10" fill="#deebf7"/><text x="37" y="115" fill="#2b5b7b" font-size="35" font-weight="700">KVM</text><text x="39" y="134" fill="#4c6c80" font-size="12">/dev/kvm</text><rect x="198" y="93" width="35" height="35" fill="none" stroke="#81a6bf" stroke-width="3"/><text x="21" y="172" fill="#4a6c82" font-size="10">LINUX KERNEL / CPU VIRTUALIZATION</text>',
      '<rect width="180" height="240" rx="16" fill="#264b42"/><rect x="7" y="8" width="166" height="224" rx="11" fill="#b5dcc6"/><text x="19" y="38" fill="#2a5844" font-size="14" font-weight="700">03 / ANDROID</text><text x="19" y="57" fill="#46735a" font-size="10">API 37 / x86_64</text><path d="M39 101L31 85M141 101L149 85" fill="none" stroke="#71a98a" stroke-width="6" stroke-linecap="round"/><rect x="30" y="97" width="120" height="73" rx="22" fill="#71a98a"/><circle cx="65" cy="125" r="4" fill="#264b3d"/><circle cx="115" cy="125" r="4" fill="#264b3d"/><text x="90" y="201" text-anchor="middle" fill="#315d48" font-size="16" font-weight="700">EMULATOR</text><rect x="65" y="222" width="50" height="3" rx="2" fill="#81ac92"/>',
      '<rect width="170" height="226" rx="12" fill="#fffdf3"/><text x="15" y="25" fill="#62806c" font-size="10" font-weight="700">04 / YOUR APP</text><text x="85" y="65" text-anchor="middle" fill="#2c493a" font-size="17" font-weight="700">Fedora Hello</text><text x="85" y="82" text-anchor="middle" fill="#6b8072" font-size="8">Kotlin + Jetpack Compose</text><text x="85" y="135" text-anchor="middle" fill="#285039" font-size="53" font-weight="700">3</text><rect x="25" y="155" width="120" height="33" rx="17" fill="#347550"/><text x="85" y="178" text-anchor="middle" fill="#fff" font-size="22" font-weight="700">+ 1</text><text x="85" y="209" text-anchor="middle" fill="#859185" font-size="8">APK / DEBUG BUILD</text>'
    ];
    const sizes=[[280,186,'#294e5c','#193846'],[250,166,'#bcd6ee','#7fa4c0'],[174,232,'#264b42','#193d35'],[161,214,'#fffdf3','#bac6b6']];
    cssScene=document.createElement('div');cssScene.className='css-model';cssScene.tabIndex=0;
    cssScene.setAttribute('role','img');cssScene.setAttribute('aria-label','개발 환경의 CSS 3D 모형. 끌거나 방향키로 회전합니다.');
    cssOrbit=document.createElement('div');cssOrbit.className='css-orbit';cssScene.append(cssOrbit);
    sizes.forEach(([width,height,top,side],index)=>{
      const slab=document.createElement('div');slab.className='css-slab';slab.dataset.cssLayer=String(index);
      slab.style.cssText=`width:${width}px;height:${height}px;--slab:${top};--side:${side}`;
      const view=index<2?'0 0 280 186':index===2?'0 0 180 240':'0 0 170 226';
      slab.innerHTML=`<div class="slab-top"><svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" font-family="sans-serif">${tops[index]}</svg></div><div class="slab-front"></div><div class="slab-right"></div>`;
      cssOrbit.append(slab);
    });
    viewport.append(cssScene);viewport.classList.add('css-model-ready');interactionSurface=cssScene;
    hint.textContent='CSS 3D / 끌어서 회전 / 방향키';canvas.dataset.renderer='css-3d';
    requestDraw();return true;
  }
  function drawCSSModel() {
    let scale=Math.min(1,Math.max(.55,viewport.clientWidth/430));
    let top=viewport.clientHeight*.62;
    const transform=()=>{cssOrbit.style.transform=`scale(${scale}) rotateX(${90-pitch*180/Math.PI}deg) rotateZ(${-yaw*180/Math.PI}deg)`;cssOrbit.style.top=`${top}px`;};
    const gap=12+expansion*53;
    cssOrbit.querySelectorAll('.css-slab').forEach((slab,i)=>{
      slab.style.transform=`translate3d(-50%,-50%,${i*gap}px)`;slab.classList.toggle('is-selected',i===selected);
    });
    transform();
    const bounds=()=>{const rects=[...cssOrbit.querySelectorAll('.slab-top')].map(node=>node.getBoundingClientRect());return {top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom)),left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right))};};
    let box=bounds();
    scale*=Math.min(1,(viewport.clientHeight-48)/(box.bottom-box.top),(viewport.clientWidth-38)/(box.right-box.left));
    transform();box=bounds();
    top+=viewport.getBoundingClientRect().top+(viewport.clientHeight-15)/2-(box.top+box.bottom)/2;
    transform();canvas.dataset.rendered='true';
  }

  // Column-major matrices use the same order as WebGL uniforms.
  const multiply = (a, b) => {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
    }
    return out;
  };
  const normalize = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const dot = (a,b) => a.reduce((sum,v,i) => sum + v*b[i], 0);
  function lookAt(eye, center) {
    const z = normalize(eye.map((v,i) => v-center[i]));
    const x = normalize(cross([0,1,0], z));
    const y = cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function orthographic(left,right,bottom,top,near,far) {
    return new Float32Array([2/(right-left),0,0,0, 0,2/(top-bottom),0,0, 0,0,-2/(far-near),0,
      -(right+left)/(right-left),-(top+bottom)/(top-bottom),-(far+near)/(far-near),1]);
  }
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  function geometry(positions,normals,uvs) {
    const buffers = [positions,normals,uvs].map(data => {
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW); return buffer;
    });
    return {buffers,count:positions.length/3};
  }
  function prism(width,depth,height,radius=.10) {
    const outline = [];
    const r = Math.min(radius,width/2,depth/2);
    const centers = [[width/2-r,depth/2-r],[-width/2+r,depth/2-r],[-width/2+r,-depth/2+r],[width/2-r,-depth/2+r]];
    centers.forEach(([x,z],corner) => {
      for(let i=0;i<=7;i++) {const a=(corner*90+i*90/7)*Math.PI/180; outline.push([x+r*Math.cos(a),z+r*Math.sin(a)]);}
    });
    const positions=[],normals=[],uvs=[];
    function tri(vertices,normal) {
      vertices.forEach(v => {positions.push(...v);normals.push(...normal);uvs.push(0,0);});
    }
    outline.forEach((a,i) => {
      const b=outline[(i+1)%outline.length], t=height/2, d=-height/2;
      tri([[0,t,0],[a[0],t,a[1]],[b[0],t,b[1]]],[0,1,0]);
      tri([[0,d,0],[b[0],d,b[1]],[a[0],d,a[1]]],[0,-1,0]);
      const normal=normalize([b[1]-a[1],0,a[0]-b[0]]);
      tri([[a[0],d,a[1]],[b[0],t,b[1]],[a[0],t,a[1]]],normal);
      tri([[a[0],d,a[1]],[b[0],d,b[1]],[b[0],t,b[1]]],normal);
    });
    return geometry(positions,normals,uvs);
  }
  function plane(width,depth) {
    const x=width/2,z=depth/2;
    return geometry([-x,0,-z, -x,0,z, x,0,z, -x,0,-z, x,0,z, x,0,-z],
      [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0], [0,0,0,1,1,1,0,0,1,1,1,0]);
  }
  const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  function add(layer,shape,color,x=0,y=0,z=0,texture=null) {
    objects.push({layer,shape,color:rgb(color),position:[x,y,z],texture});
  }
  function surface(width,height,paint) {
    const source=document.createElement('canvas');source.width=width;source.height=height;
    const ctx=source.getContext('2d'); paint(ctx,width,height);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    return texture;
  }
  function roundRect(ctx,x,y,w,h,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function createScene() {
    // Hardware board and small chips. A conceptual diagram, not a hardware scale model.
    add(0,prism(4.5,3.05,.20,.17),'#244654');
    const hardware=surface(900,590,(ctx,w,h)=>{
      ctx.fillStyle='#2c5260';ctx.fillRect(0,0,w,h);
      ctx.lineWidth=3;ctx.strokeStyle='#64817e';
      for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(60,140+i*32);ctx.lineTo(370+i*20,140+i*32);ctx.lineTo(420+i*20,90);ctx.lineTo(820,90);ctx.stroke();}
      ctx.fillStyle='#ecf3e8';ctx.font='bold 48px sans-serif';ctx.fillText('01 / HARDWARE',55,525);
      ctx.font='24px monospace';ctx.fillStyle='#c0d7d6';ctx.fillText('CPU + MEMORY + GPU',55,563);
    });
    add(0,plane(4.29,2.85),'#ffffff',0,.102,0,hardware);
    add(0,prism(.95,.88,.14,.07),'#203b47',-.92,.19,-.04);
    add(0,prism(.66,.58,.045,.025),'#bdc7c1',-.92,.281,-.04);
    for(let i=0;i<3;i++)add(0,prism(.29,.75,.085,.02),'#1d3540',.53+i*.43,.16,.1);
    for(let i=0;i<9;i++)add(0,prism(.12,.22,.02,.015),'#b6ab75',-1.62+i*.35,.119,1.46);
    // Fedora and KVM share this pedagogical layer.
    add(1,prism(4.07,2.73,.115,.16),'#82aace');
    const fedora=surface(960,620,(ctx,w,h)=>{
      ctx.fillStyle='#bcd6ee';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#2c526e';ctx.font='bold 57px sans-serif';ctx.fillText('02 / FEDORA 44',55,114);
      ctx.font='28px sans-serif';ctx.fillText('KDE PLASMA',55,165);
      roundRect(ctx,60,258,830,234,28,'#dcebf7');
      ctx.fillStyle='#2f638b';ctx.font='bold 92px monospace';ctx.fillText('KVM',98,367);
      ctx.fillStyle='#48687d';ctx.font='28px monospace';ctx.fillText('/dev/kvm',98,424);
      ctx.strokeStyle='#82aac9';ctx.lineWidth=6;ctx.strokeRect(651,306,120,120);
      for(let i=0;i<5;i++){const a=667+i*22;ctx.beginPath();ctx.moveTo(a,286);ctx.lineTo(a,306);ctx.moveTo(a,426);ctx.lineTo(a,446);ctx.stroke();}
      ctx.font='22px sans-serif';ctx.fillStyle='#4b6f86';ctx.fillText('LINUX KERNEL / CPU VIRTUALIZATION',60,564);
    });
    add(1,plane(3.87,2.51),'#ffffff',0,.059,0,fedora);
    // Emulator's virtual phone. The surrounding frame provides depth cues.
    add(2,prism(2.53,3.48,.17,.24),'#294a47');
    add(2,prism(2.39,3.31,.035,.20),'#86b7a0',0,.1,0);
    const android=surface(630,910,(ctx,w,h)=>{
      ctx.fillStyle='#bbe0c9';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#234f40';ctx.font='bold 33px sans-serif';ctx.fillText('03 / ANDROID',42,115);
      ctx.font='25px monospace';ctx.fillText('API 37 / x86_64',42,161);
      roundRect(ctx,109,280,412,290,50,'#72ae90');
      ctx.fillStyle='#244c3b';ctx.beginPath();ctx.arc(252,383,13,0,Math.PI*2);ctx.arc(378,383,13,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#72ae90';ctx.lineWidth=17;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(166,297);ctx.lineTo(133,241);ctx.moveTo(465,297);ctx.lineTo(498,241);ctx.stroke();
      ctx.fillStyle='#34634d';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.fillText('AVD',315,695);
      ctx.font='23px sans-serif';ctx.fillText('EMULATOR + SYSTEM IMAGE',315,743);
      roundRect(ctx,237,852,156,10,5,'#7aaa90');
    });
    add(2,plane(2.21,3.08),'#ffffff',0,.120,0,android);
    add(2,prism(.47,.065,.01,.028),'#263f3b',0,.127,-1.625);
    add(2,prism(.047,.56,.055,.018),'#6f9587',1.277,0,-.55);
    // App plane shows the sample counter. The UI is drawn locally to a texture.
    add(3,prism(2.22,3.10,.075,.18),'#c5cfbc');
    const app=surface(680,980,(ctx,w,h)=>{
      ctx.fillStyle='#fffdf3';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#517466';ctx.font='bold 27px sans-serif';ctx.fillText('04 / YOUR APP',47,80);
      ctx.fillStyle='#263f37';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('Fedora Hello',340,270);
      ctx.fillStyle='#526e61';ctx.font='25px sans-serif';ctx.fillText('Kotlin + Jetpack Compose',340,328);
      ctx.fillStyle='#234e3a';ctx.font='bold 154px sans-serif';ctx.fillText('3',340,523);
      roundRect(ctx,103,622,474,121,57,'#2f7151');ctx.fillStyle='#ffffff';ctx.font='bold 40px sans-serif';ctx.fillText('+ 1',340,699);
      ctx.fillStyle='#839184';ctx.font='23px monospace';ctx.fillText('APK / DEBUG BUILD',340,871);
      roundRect(ctx,243,931,194,9,4,'#9cae9f');
    });
    add(3,plane(2.06,2.91),'#ffffff',0,.039,0,app);
  }
  function requestDraw(){if((!gl&&!cssScene)||drawRequested)return;drawRequested=true;requestAnimationFrame(draw);}
  let locations;
  function draw(){
    drawRequested=false;if(cssScene){drawCSSModel();return;}if(!gl||gl.isContextLost())return;
    const bounds=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    const width=Math.max(1,Math.round(bounds.width*dpr)),height=Math.max(1,Math.round(bounds.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const gap=.26+expansion*.98, total=gap*3;
    const center=[0,total/2,0],r=10;
    const eye=[Math.sin(yaw)*Math.cos(pitch)*r,center[1]+Math.sin(pitch)*r,Math.cos(yaw)*Math.cos(pitch)*r];
    const aspect=width/height;
    const halfY=Math.max(3.1,3.15/aspect),halfX=halfY*aspect;
    const vp=multiply(orthographic(-halfX,halfX,-halfY,halfY,.1,40),lookAt(eye,center));
    gl.useProgram(program);gl.uniformMatrix4fv(locations.vp,false,vp);
    objects.forEach(object=>{
      const shift=[object.position[0],object.position[1]+object.layer*gap,object.position[2]];
      gl.uniform3fv(locations.offset,shift);gl.uniform3fv(locations.color,object.color);
      gl.uniform1f(locations.emphasis,object.layer===selected?1.03:.94);
      gl.uniform1f(locations.useTexture,object.texture?1:0);
      if(object.texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,object.texture);gl.uniform1i(locations.sampler,0);}
      [locations.position,locations.normal,locations.uv].forEach((attribute,i)=>{
        gl.bindBuffer(gl.ARRAY_BUFFER,object.shape.buffers[i]);gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute,i===2?2:3,gl.FLOAT,false,0,0);
      });
      gl.drawArrays(gl.TRIANGLES,0,object.shape.count);
    });
    canvas.dataset.rendered='true';
  }
  try {
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!gl)throw new Error('WebGL unavailable');
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;
      uniform mat4 uVP;uniform vec3 uOffset;varying vec3 vNormal;varying vec2 vUV;
      void main(){vNormal=aNormal;vUV=aUV;gl_Position=uVP*vec4(aPosition+uOffset,1.0);}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vNormal;varying vec2 vUV;
      uniform vec3 uColor;uniform float uUseTexture;uniform float uEmphasis;uniform sampler2D uSampler;
      void main(){float light=.69+.31*max(dot(normalize(vNormal),normalize(vec3(-.3,1.0,.7))),0.0);
      vec3 color=mix(uColor,texture2D(uSampler,vUV).rgb,uUseTexture);gl_FragColor=vec4(color*light*uEmphasis,1.0);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    locations={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),uv:gl.getAttribLocation(program,'aUV'),
      vp:gl.getUniformLocation(program,'uVP'),offset:gl.getUniformLocation(program,'uOffset'),color:gl.getUniformLocation(program,'uColor'),
      emphasis:gl.getUniformLocation(program,'uEmphasis'),useTexture:gl.getUniformLocation(program,'uUseTexture'),sampler:gl.getUniformLocation(program,'uSampler')};
    gl.enable(gl.DEPTH_TEST);createScene();viewport.classList.add('model-ready');canvas.dataset.renderer='webgl';
    hint.textContent='끌어서 회전 / 방향키로 회전';requestDraw();
    if('ResizeObserver' in window)new ResizeObserver(requestDraw).observe(canvas);
    else window.addEventListener('resize',requestDraw);
  }catch(error){canvas.dataset.modelError=String(error.message||error);gl=null;if(!makeCSSModel()){hint.textContent='SVG 모형으로 표시 중';slider.disabled=true;document.querySelector('.model-badge').textContent='SVG / 정적 모형';}window.addEventListener('resize',requestDraw);}
  slider.addEventListener('input',()=>{expansion=Number(slider.value)/100;requestDraw();});
  document.getElementById('model-reset').addEventListener('click',()=>{
    yaw=.63;pitch=.67;expansion=.68;slider.value='68';setLayer(0);requestDraw();
  });
  let drag=null;
  interactionSurface.addEventListener('pointerdown',event=>{
    if((!gl&&!cssScene)||event.button!==0)return;drag={x:event.clientX,y:event.clientY};interactionSurface.setPointerCapture(event.pointerId);interactionSurface.classList.add('dragging');
  });
  interactionSurface.addEventListener('pointermove',event=>{
    if(!drag)return;yaw-=(event.clientX-drag.x)*.008;pitch=Math.max(.25,Math.min(1.30,pitch+(event.clientY-drag.y)*.006));
    drag={x:event.clientX,y:event.clientY};requestDraw();
  });
  const stop=()=>{drag=null;interactionSurface.classList.remove('dragging');};
  interactionSurface.addEventListener('pointerup',stop);interactionSurface.addEventListener('pointercancel',stop);interactionSurface.addEventListener('lostpointercapture',stop);
  interactionSurface.addEventListener('keydown',event=>{
    const keys={ArrowLeft:[.10,0],ArrowRight:[-.10,0],ArrowUp:[0,.07],ArrowDown:[0,-.07]};
    if(!keys[event.key])return;event.preventDefault();yaw+=keys[event.key][0];pitch=Math.max(.25,Math.min(1.3,pitch+keys[event.key][1]));requestDraw();
  });
  canvas.addEventListener('webglcontextlost',()=>{gl=null;viewport.classList.remove('model-ready');hint.textContent='SVG 모형으로 표시 중. 새로고침하면 3D를 다시 시도합니다.';slider.disabled=true;});
})();
