import{useState,useRef,useEffect,useCallback}from"react";
const F=[{id:"carre",label:"Carré"},{id:"rectangle",label:"Rectangle"},{id:"triangle",label:"Triangle"},{id:"U",label:"Forme U"},{id:"L",label:"Forme L"}];

const CHAMPS={
  carre:[{k:"cote",l:"Côté (m)"}],
  rectangle:[{k:"lon",l:"Longueur"},{k:"lar",l:"Largeur"}],
  triangle:[{k:"base",l:"Base"},{k:"haut",l:"Hauteur"}],
  L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"w1",l:"Larg.1"},{k:"w2",l:"Larg.2"}],
  U:[{k:"lt",l:"Larg.totale"},{k:"ht",l:"Haut.totale"},{k:"ep",l:"Épaisseur"}]
};

// Chaque arête a un id unique et une key éditable
function getAretes(f,d,ox,oy,sc){
  const n=k=>Math.max(0.1,Number(d[k]||1));
  const m=k=>n(k).toFixed(1).replace(/\.0$/,"")+"m";
  const ar=[];
  if(f==="carre"){
    const s=n("cote")*sc;
    ar.push({id:"top",   x1:ox,   y1:oy,   x2:ox+s, y2:oy,   lbl:m("cote"),key:"cote"});
    ar.push({id:"right", x1:ox+s, y1:oy,   x2:ox+s, y2:oy+s, lbl:m("cote"),key:"cote"});
    ar.push({id:"bot",   x1:ox,   y1:oy+s, x2:ox+s, y2:oy+s, lbl:m("cote"),key:"cote"});
    ar.push({id:"left",  x1:ox,   y1:oy,   x2:ox,   y2:oy+s, lbl:m("cote"),key:"cote"});
  }else if(f==="rectangle"){
    const w=n("lon")*sc,h=n("lar")*sc;
    ar.push({id:"top",   x1:ox,   y1:oy,   x2:ox+w, y2:oy,   lbl:m("lon"),key:"lon"});
    ar.push({id:"right", x1:ox+w, y1:oy,   x2:ox+w, y2:oy+h, lbl:m("lar"),key:"lar"});
    ar.push({id:"bot",   x1:ox,   y1:oy+h, x2:ox+w, y2:oy+h, lbl:m("lon"),key:"lon"});
    ar.push({id:"left",  x1:ox,   y1:oy,   x2:ox,   y2:oy+h, lbl:m("lar"),key:"lar"});
  }else if(f==="triangle"){
    const b=n("base")*sc,h=n("haut")*sc;
    ar.push({id:"base",  x1:ox,     y1:oy+h, x2:ox+b,   y2:oy+h, lbl:m("base"),key:"base"});
    ar.push({id:"right", x1:ox+b/2, y1:oy,   x2:ox+b,   y2:oy+h, lbl:m("haut"),key:"haut"});
    ar.push({id:"left",  x1:ox,     y1:oy+h, x2:ox+b/2, y2:oy,   lbl:m("haut"),key:"haut"});
  }else if(f==="L"){
    const a=n("l1")*sc,b=n("l2")*sc,c=n("w1")*sc,e=n("w2")*sc;
    const htot=(n("w1")+n("w2")).toFixed(1).replace(/\.0$/,"")+"m";
    const diff=Math.abs(n("l1")-n("l2")).toFixed(1).replace(/\.0$/,"")+"m";
    ar.push({id:"top",    x1:ox,   y1:oy,     x2:ox+a, y2:oy,     lbl:m("l1"), key:"l1"});
    ar.push({id:"r1",     x1:ox+a, y1:oy,     x2:ox+a, y2:oy+c,   lbl:m("w1"), key:"w1"});
    ar.push({id:"mid",    x1:ox+b, y1:oy+c,   x2:ox+a, y2:oy+c,   lbl:diff,    key:"l2"});
    ar.push({id:"r2",     x1:ox+b, y1:oy+c,   x2:ox+b, y2:oy+c+e, lbl:m("w2"), key:"w2"});
    ar.push({id:"bot",    x1:ox,   y1:oy+c+e, x2:ox+b, y2:oy+c+e, lbl:m("l2"), key:"l2"});
    ar.push({id:"left",   x1:ox,   y1:oy,     x2:ox,   y2:oy+c+e, lbl:htot,    key:"w1"});
  }else if(f==="U"){
    const lt=n("lt"),ht=n("ht"),ep=n("ep");
    const W=lt*sc,H=ht*sc,E=Math.min(ep*sc,W/2-2,H-2);
    const iw=Math.max(0,lt-2*ep).toFixed(1).replace(/\.0$/,"")+"m";
    const ih=Math.max(0,ht-ep).toFixed(1).replace(/\.0$/,"")+"m";
    const epL=ep.toFixed(1).replace(/\.0$/,"")+"m";
    ar.push({id:"top",  x1:ox,     y1:oy,   x2:ox+W,   y2:oy,   lbl:m("lt"), key:"lt"});
    ar.push({id:"r_out",x1:ox+W,   y1:oy,   x2:ox+W,   y2:oy+H, lbl:m("ht"), key:"ht"});
    ar.push({id:"br",   x1:ox+W-E, y1:oy+H, x2:ox+W,   y2:oy+H, lbl:epL,     key:"ep"});
    ar.push({id:"r_in", x1:ox+W-E, y1:oy+E, x2:ox+W-E, y2:oy+H, lbl:ih,      key:"ht"});
    ar.push({id:"inner",x1:ox+E,   y1:oy+E, x2:ox+W-E, y2:oy+E, lbl:iw,      key:"lt"});
    ar.push({id:"l_in", x1:ox+E,   y1:oy+E, x2:ox+E,   y2:oy+H, lbl:ih,      key:"ht"});
    ar.push({id:"bl",   x1:ox,     y1:oy+H, x2:ox+E,   y2:oy+H, lbl:epL,     key:"ep"});
    ar.push({id:"l_out",x1:ox,     y1:oy,   x2:ox,     y2:oy+H, lbl:m("ht"), key:"ht"});
  }
  return ar;
}

function calcSurf(f,d){
  const n=k=>Math.max(0,Number(d[k]||0));
  if(f==="carre")return(n("cote")**2).toFixed(2);
  if(f==="rectangle")return(n("lon")*n("lar")).toFixed(2);
  if(f==="triangle")return((n("base")*n("haut"))/2).toFixed(2);
  if(f==="L")return(n("l1")*n("w1")+n("l2")*n("w2")).toFixed(2);
  if(f==="U"){const lt=n("lt"),ht=n("ht"),ep=n("ep");return(lt*ht-Math.max(0,lt-2*ep)*Math.max(0,ht-ep)).toFixed(2);}
  return"—";
}

function getRealSize(f,d){
  const n=k=>Math.max(0.1,Number(d[k]||1));
  if(f==="carre")return{w:n("cote"),h:n("cote")};
  if(f==="rectangle")return{w:n("lon"),h:n("lar")};
  if(f==="triangle")return{w:n("base"),h:n("haut")};
  if(f==="L")return{w:Math.max(n("l1"),n("l2")),h:n("w1")+n("w2")};
  if(f==="U")return{w:n("lt"),h:n("ht")};
  return{w:5,h:5};
}

function getPts(f,d,ox,oy,sc){
  const n=k=>Math.max(0.1,Number(d[k]||1));
  if(f==="carre"){const s=n("cote")*sc;return[[ox,oy],[ox+s,oy],[ox+s,oy+s],[ox,oy+s]];}
  if(f==="rectangle"){const w=n("lon")*sc,h=n("lar")*sc;return[[ox,oy],[ox+w,oy],[ox+w,oy+h],[ox,oy+h]];}
  if(f==="triangle"){const b=n("base")*sc,h=n("haut")*sc;return[[ox+b/2,oy],[ox+b,oy+h],[ox,oy+h]];}
  if(f==="L"){const a=n("l1")*sc,b=n("l2")*sc,c=n("w1")*sc,e=n("w2")*sc;return[[ox,oy],[ox+a,oy],[ox+a,oy+c],[ox+b,oy+c],[ox+b,oy+c+e],[ox,oy+c+e]];}
  if(f==="U"){const W=n("lt")*sc,H=n("ht")*sc,E=Math.min(n("ep")*sc,W/2-2,H-2);return[[ox,oy],[ox+W,oy],[ox+W,oy+H],[ox+W-E,oy+H],[ox+W-E,oy+E],[ox+E,oy+E],[ox+E,oy+H],[ox,oy+H]];}
  return[];
}

function PlanCanvas({forme,dims,surf,onAreteTap}){
  const cvRef=useRef();
  const zoom=useRef(1);
  const pan=useRef({x:0,y:0});
  const drag=useRef(false);
  const lastT=useRef(null);
  const pinch=useRef(null);
  const hitZones=useRef([]);

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const W=cv.width,H=cv.height;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,W,H);
    const z=zoom.current,px=pan.current.x,py=pan.current.y;
    const PAD=75;

    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,W,H);

    const gs=40*z;
    const rs=getRealSize(forme,dims);
    const sc0=Math.min((W-PAD*2)/rs.w,(H-PAD*2)/rs.h);
    const sc=sc0*z;
    const planX=W/2-rs.w*sc/2+px;
    const planY=H/2-rs.h*sc/2+py;
    const gox=((planX%gs)+gs)%gs,goy=((planY%gs)+gs)%gs;

    ctx.strokeStyle="#e0dbd0";ctx.lineWidth=0.8;
    for(let x=gox-gs;x<W+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=goy-gs;y<H+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#ccc8bc";ctx.lineWidth=1.2;
    for(let x=gox-gs*5;x<W+gs*5;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=goy-gs*5;y<H+gs*5;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    const ox=planX,oy=planY;
    const pts=getPts(forme,dims,ox,oy,sc);
    if(!pts.length)return;

    ctx.shadowColor="rgba(0,0,0,0.1)";ctx.shadowBlur=8;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();ctx.fillStyle="rgba(255,252,235,0.97)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();ctx.strokeStyle="#c8820a";ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Surface au centre
    const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length;
    const cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;
    ctx.textAlign="center";ctx.font="bold 14px sans-serif";
    const st=surf+" m²";
    const stw=ctx.measureText(st).width+18;
    ctx.fillStyle="rgba(255,255,255,0.9)";
    if(ctx.roundRect)ctx.roundRect(cx-stw/2,cy-12,stw,22,5);
    else ctx.rect(cx-stw/2,cy-12,stw,22);
    ctx.fill();ctx.fillStyle="#c8820a";ctx.fillText(st,cx,cy+5);

    // Cotes — chaque arête indépendante
    hitZones.current=[];
    ctx.font="bold 11px sans-serif";
    const aretes=getAretes(forme,dims,ox,oy,sc);

    aretes.forEach(ar=>{
      const{id,x1,y1,x2,y2,lbl,key}=ar;
      if(Math.hypot(x2-x1,y2-y1)<4)return;
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
      const nx=-dy/len,ny=dx/len;
      const OFF=26;
      const lx=mx+nx*OFF,ly=my+ny*OFF;

      ctx.setLineDash([4,3]);ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(lx,ly);ctx.stroke();
      ctx.setLineDash([]);

      const tw=Math.max(ctx.measureText(lbl).width+14,32),th=20;
      ctx.fillStyle="#e8f4ff";ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1.5;
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(lx-tw/2,ly-th/2,tw,th,4);
      else ctx.rect(lx-tw/2,ly-th/2,tw,th);
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#1a5fa8";ctx.textAlign="center";ctx.fillText(lbl,lx,ly+4);
      // id unique pour chaque arête
      hitZones.current.push({id,key,lbl,x:lx-tw/2,y:ly-th/2,w:tw,h:th});
    });

    ctx.textAlign="left";
    const bLen=sc*2;
    ctx.strokeStyle="#999";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(12,H-16);ctx.lineTo(12+bLen,H-16);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,H-22);ctx.lineTo(12,H-10);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12+bLen,H-22);ctx.lineTo(12+bLen,H-10);ctx.stroke();
    ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.fillText("2m",12+bLen/2-8,H-20);
    ctx.fillStyle="#b06010";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",W-30,22);
  },[forme,dims,surf]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;draw();};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[draw]);

  useEffect(()=>{draw();},[draw]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    let moved=false;
    const ts=e=>{
      e.preventDefault();moved=false;
      if(e.touches.length===1){drag.current=true;lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
      if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinch.current=Math.hypot(dx,dy);}
    };
    const tm=e=>{
      e.preventDefault();moved=true;
      if(e.touches.length===1&&drag.current&&lastT.current){
        pan.current.x+=e.touches[0].clientX-lastT.current.x;
        pan.current.y+=e.touches[0].clientY-lastT.current.y;
        lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};draw();
      }
      if(e.touches.length===2&&pinch.current){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
        const d=Math.hypot(dx,dy);
        zoom.current=Math.min(8,Math.max(0.2,zoom.current*(d/pinch.current)));
        pinch.current=d;draw();
      }
    };
    const te=e=>{
      drag.current=false;pinch.current=null;
      if(!moved&&e.changedTouches.length===1){
        const r=cv.getBoundingClientRect();
        const tx=(e.changedTouches[0].clientX-r.left)*(cv.width/r.width);
        const ty=(e.changedTouches[0].clientY-r.top)*(cv.height/r.height);
        hitZones.current.forEach(z=>{
          if(tx>=z.x&&tx<=z.x+z.w&&ty>=z.y&&ty<=z.y+z.h)onAreteTap(z);
        });
      }
    };
    cv.addEventListener("touchstart",ts,{passive:false});
    cv.addEventListener("touchmove",tm,{passive:false});
    cv.addEventListener("touchend",te);
    return()=>{cv.removeEventListener("touchstart",ts);cv.removeEventListener("touchmove",tm);cv.removeEventListener("touchend",te);};
  },[draw,onAreteTap]);

  return <canvas ref={cvRef} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",touchAction:"none"}}/>;
}

function EditModal({arete,onSave,onClose}){
  const[v,sv]=useState(arete.lbl.replace("m",""));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#1c1f2e",borderRadius:16,padding:24,width:"100%",maxWidth:300}}>
        <p style={{color:"#e8a838",fontWeight:700,fontSize:16,margin:"0 0 4px"}}>✏️ Modifier cette arête</p>
        <p style={{color:"#888",fontSize:12,margin:"0 0 16px"}}>{CHAMPS[arete.forme]?.find(c=>c.k===arete.key)?.l||arete.key}</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <button onClick={()=>sv(p=>String(Math.max(0.5,parseFloat(p)-0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>−</button>
          <input type="number" value={v} min="0.5" step="0.5" onChange={e=>sv(e.target.value)}
            style={{flex:1,background:"#12151f",border:"2px solid #e8a838",borderRadius:8,color:"#fff",fontSize:24,padding:"8px",textAlign:"center"}}/>
          <button onClick={()=>sv(p=>String((parseFloat(p)+0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>＋</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:12,background:"#2a2d3e",border:"none",borderRadius:10,color:"#aaa",fontWeight:700,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>onSave(arete.key,v)} style={{flex:1,padding:12,background:"#e8a838",border:"none",borderRadius:10,color:"#0f1117",fontWeight:800,cursor:"pointer"}}>✓ OK</button>
        </div>
      </div>
    </div>
  );
}

function Plan({data,onR}){
  const[dims,setDims]=useState(data.dims);
  const[editing,setEditing]=useState(null);
  const surf=calcSurf(data.id,dims);
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden"}}>
      {editing&&<EditModal arete={{...editing,forme:data.id}}
        onSave={(key,v)=>{setDims(d=>({...d,[key]:v}));setEditing(null);}}
        onClose={()=>setEditing(null)}/>}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"rgba(15,17,23,0.85)",backdropFilter:"blur(8px)"}}>
        <button onClick={onR} style={{background:"none",border:"none",color:"#e8a838",fontSize:15,cursor:"pointer",fontWeight:700}}>← Retour</button>
        <span style={{color:"#fff",fontWeight:700,fontSize:15}}>{data.label}</span>
        <button style={{background:"#e8a838",border:"none",borderRadius:8,color:"#0f1117",fontWeight:800,fontSize:13,padding:"6px 12px",cursor:"pointer"}}>+ Éléments</button>
      </div>
      <PlanCanvas forme={data.id} dims={dims} surf={surf}
        onAreteTap={z=>setEditing(z)}/>
    </div>
  );
}

function Dims({f,onV,onR}){
  const ch=CHAMPS[f.id]||[];const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(
    <div style={S.screen}>
      <button onClick={onR} style={S.back}>← Retour</button>
      <h2 style={S.h2}>{f.label}</h2>
      <p style={S.sub}>Dimensions de départ</p>
      <div style={{marginTop:16}}>
        {ch.map(c=><div key={c.k} style={{marginBottom:12}}>
          <label style={S.lbl}>{c.l}</label>
          <input type="number" min="0.5" step="0.5" placeholder="ex: 4"
            onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
        </div>)}
      </div>
      <button onClick={()=>ok&&onV({...f,dims:d})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Créer le plan →</button>
    </div>
  );
}

export default function App(){
  const[e,se]=useState("choix");const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={d=>{sf(d);se("plan")}} onR={()=>se("choix")}/>;
  if(e==="plan"&&f)return<Plan data={f} onR={()=>se("choix")}/>;
  return(
    <div style={S.screen}>
      <h1 style={{textAlign:"center",color:"#e8a838",fontSize:26,marginBottom:4}}>📐 PlanPro</h1>
      <p style={S.sub}>Choisissez la forme de la pièce</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
        {F.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
          <div style={{fontWeight:700,fontSize:18}}>{x.label}</div>
        </button>)}
      </div>
    </div>
  );
}

const S={
  screen:{background:"#0f1117",minHeight:"100vh",padding:"20px 16px 40px",fontFamily:"sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",boxSizing:"border-box"},
  back:{background:"none",border:"none",color:"#e8a838",fontSize:16,cursor:"pointer",padding:"4px 0",marginBottom:8},
  h2:{fontSize:20,fontWeight:700,margin:"8px 0 0"},
  sub:{color:"#aaa",fontSize:14,margin:"4px 0 0",textAlign:"center"},
  lbl:{color:"#aaa",fontSize:13,fontWeight:600,display:"block",marginBottom:4},
  inp:{width:"100%",padding:12,background:"#1c1f2e",border:"1px solid #333",borderRadius:10,color:"#fff",fontSize:18,boxSizing:"border-box"},
  cta:{width:"100%",padding:16,background:"#e8a838",border:"none",borderRadius:12,fontWeight:800,fontSize:17,cursor:"pointer",color:"#0f1117"},
  card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}
};
