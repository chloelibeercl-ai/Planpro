import{useState,useRef,useEffect,useCallback}from"react";
const F=[{id:"carre",label:"Carré",emoji:"⬜"},{id:"rectangle",label:"Rectangle",emoji:"▬"},{id:"triangle",label:"Triangle",emoji:"🔺"},{id:"U",label:"U",emoji:"⊓"},{id:"L",label:"L",emoji:"⌐"}];
const CHAMPS={carre:[{k:"cote",l:"Côté (m)"}],rectangle:[{k:"lon",l:"Longueur"},{k:"lar",l:"Largeur"}],triangle:[{k:"base",l:"Base"},{k:"haut",l:"Hauteur"}],L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"w1",l:"Larg.1"},{k:"w2",l:"Larg.2"}],U:[{k:"lt",l:"Larg.tot"},{k:"ht",l:"Haut.tot"},{k:"ep",l:"Épais."}]};
function getRealSize(f,d){const n=k=>Number(d[k]||1);if(f==="carre")return{w:n("cote"),h:n("cote")};if(f==="rectangle")return{w:n("lon"),h:n("lar")};if(f==="triangle")return{w:n("base"),h:n("haut")};if(f==="L")return{w:Math.max(n("l1"),n("l2")),h:n("w1")+n("w2")};if(f==="U")return{w:n("lt"),h:n("ht")};return{w:5,h:5};}
function getPts(f,d,ox,oy,sc){const n=k=>Number(d[k]||1);if(f==="carre"){const s=n("cote")*sc;return[[ox,oy],[ox+s,oy],[ox+s,oy+s],[ox,oy+s]];}if(f==="rectangle"){const w=n("lon")*sc,h=n("lar")*sc;return[[ox,oy],[ox+w,oy],[ox+w,oy+h],[ox,oy+h]];}if(f==="triangle"){const b=n("base")*sc,h=n("haut")*sc;return[[ox+b/2,oy],[ox+b,oy+h],[ox,oy+h]];}if(f==="L"){const a=n("l1")*sc,b=n("l2")*sc,c=n("w1")*sc,e=n("w2")*sc;return[[ox,oy],[ox+a,oy],[ox+a,oy+c],[ox+b,oy+c],[ox+b,oy+c+e],[ox,oy+c+e]];}if(f==="U"){const W=n("lt")*sc,H=n("ht")*sc,E=n("ep")*sc;return[[ox,oy],[ox+W,oy],[ox+W,oy+H],[ox+W-E,oy+H],[ox+W-E,oy+E],[ox+E,oy+E],[ox+E,oy+H],[ox,oy+H]];}return[];}
function PlanCanvas({forme,dims}){
  const cvRef=useRef();
  const zoom=useRef(1);
  const pan=useRef({x:0,y:0});
  const drag=useRef(false);
  const lastT=useRef(null);
  const pinch=useRef(null);

  const draw=useCallback(()=>{
    const cv=cvRef.current;
    if(!cv)return;
    const ctx=cv.getContext("2d");
    const W=cv.width,H=cv.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#12151f";
    ctx.fillRect(0,0,W,H);
    const gs=50*zoom.current;
    const ox2=(pan.current.x%gs+gs)%gs;
    const oy2=(pan.current.y%gs+gs)%gs;
    ctx.strokeStyle="rgba(255,255,255,0.06)";
    ctx.lineWidth=0.5;
    for(let x=ox2;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=oy2;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="rgba(255,255,255,0.12)";
    ctx.lineWidth=1;
    for(let x=ox2;x<W;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=oy2;y<H;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    const rs=getRealSize(forme,dims);
    const base=Math.min((W-80)/rs.w,(H-80)/rs.h);
    const sc=base*zoom.current;
    const ox=W/2-rs.w*sc/2+pan.current.x;
    const oy=H/2-rs.h*sc/2+pan.current.y;
    const pts=getPts(forme,dims,ox,oy,sc);
    if(!pts.length)return;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();
    ctx.fillStyle="rgba(232,168,56,0.12)";ctx.fill();
    ctx.strokeStyle="#e8a838";ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.stroke();
    ctx.setLineDash([5,3]);ctx.strokeStyle="#4a9eff";ctx.lineWidth=1;
    if(forme==="carre"||forme==="rectangle"){
      const w=(forme==="carre"?Number(dims.cote):Number(dims.lon))*sc;
      const h=(forme==="carre"?Number(dims.cote):Number(dims.lar))*sc;
      ctx.beginPath();ctx.moveTo(ox,oy-18);ctx.lineTo(ox+w,oy-18);ctx.stroke();
      ctx.fillStyle="#12151f";ctx.fillRect(ox+w/2-18,oy-30,36,14);
      ctx.fillStyle="#4a9eff";ctx.font="bold 11px sans-serif";
      ctx.fillText((forme==="carre"?dims.cote:dims.lon)+"m",ox+w/2-14,oy-19);
      ctx.beginPath();ctx.moveTo(ox+w+18,oy);ctx.lineTo(ox+w+18,oy+h);ctx.stroke();
      ctx.fillStyle="#12151f";ctx.fillRect(ox+w+8,oy+h/2-7,34,14);
      ctx.fillStyle="#4a9eff";ctx.fillText((forme==="carre"?dims.cote:dims.lar)+"m",ox+w+10,oy+h/2+5);
    }
    ctx.setLineDash([]);
    const bLen=sc*2;
    ctx.strokeStyle="#888";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(16,H-20);ctx.lineTo(16+bLen,H-20);ctx.stroke();
    ctx.beginPath();ctx.moveTo(16,H-25);ctx.lineTo(16,H-15);ctx.stroke();
    ctx.beginPath();ctx.moveTo(16+bLen,H-25);ctx.lineTo(16+bLen,H-15);ctx.stroke();
    ctx.fillStyle="#888";ctx.font="11px sans-serif";ctx.fillText("2m",16+bLen/2-8,H-24);
    ctx.fillStyle="#e8a838";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",W-28,22);
  },[forme,dims]);

  useEffect(()=>{draw();},[draw]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ts=e=>{
      if(e.touches.length===1){drag.current=true;lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
      if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinch.current=Math.sqrt(dx*dx+dy*dy);}
    };
    const tm=e=>{
      e.preventDefault();
      if(e.touches.length===1&&drag.current&&lastT.current){
        pan.current.x+=e.touches[0].clientX-lastT.current.x;
        pan.current.y+=e.touches[0].clientY-lastT.current.y;
        lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};
        draw();
      }
      if(e.touches.length===2&&pinch.current){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
        const d=Math.sqrt(dx*dx+dy*dy);
        zoom.current=Math.min(5,Math.max(0.2,zoom.current*(d/pinch.current)));
        pinch.current=d;draw();
      }
    };
    const te=()=>{drag.current=false;pinch.current=null;};
    cv.addEventListener("touchstart",ts,{passive:false});
    cv.addEventListener("touchmove",tm,{passive:false});
    cv.addEventListener("touchend",te);
    return()=>{cv.removeEventListener("touchstart",ts);cv.removeEventListener("touchmove",tm);cv.removeEventListener("touchend",te);};
  },[draw]);

  const reset=()=>{zoom.current=1;pan.current={x:0,y:0};draw();};
  const zIn=()=>{zoom.current=Math.min(5,zoom.current+0.3);draw();};
  const zOut=()=>{zoom.current=Math.max(0.2,zoom.current-0.3);draw();};

  return(<div>
    <canvas ref={cvRef} width={340} height={320} style={{borderRadius:12,display:"block",margin:"0 auto",maxWidth:"100%",touchAction:"none"}}/>
    <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:8}}>
      <button onClick={zIn} style={Sb}>＋</button>
      <button onClick={zOut} style={Sb}>－</button>
      <button onClick={reset} style={Sb}>⌂ Reset</button>
    </div>
  </div>);
}
const Sb={background:"#2a2d3e",border:"1px solid #3a3d4e",borderRadius:8,color:"#fff",padding:"6px 14px",fontSize:14,cursor:"pointer"};
function EditDims({forme,dims,onChange}){
  const ch=CHAMPS[forme]||[];
  return(<div style={{background:"#1c1f2e",borderRadius:12,padding:14,marginTop:12}}>
    <p style={{color:"#e8a838",fontWeight:700,fontSize:14,margin:"0 0 10px"}}>✏️ Modifier les cotes</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {ch.map(c=><div key={c.k}>
        <label style={{color:"#aaa",fontSize:11,display:"block",marginBottom:2}}>{c.l}</label>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <button onClick={()=>onChange(c.k,Math.max(0.5,(Number(dims[c.k]||1)-0.5)).toFixed(1))} style={{...Sb,padding:"4px 9px"}}>−</button>
          <input type="number" value={dims[c.k]||""} min="0.5" step="0.5" onChange={e=>onChange(c.k,e.target.value)} style={{width:"100%",background:"#12151f",border:"1px solid #333",borderRadius:6,color:"#fff",fontSize:14,padding:"5px 4px",textAlign:"center"}}/>
          <button onClick={()=>onChange(c.k,(Number(dims[c.k]||1)+0.5).toFixed(1))} style={{...Sb,padding:"4px 9px"}}>＋</button>
        </div>
      </div>)}
    </div>
  </div>);
}
function Plan({data,onR}){
  const[dims,setDims]=useState(data.dims);
  const upd=(k,v)=>setDims(d=>({...d,[k]:v}));
  const surf=data.id==="carre"?(Number(dims.cote)**2).toFixed(2):data.id==="rectangle"?(Number(dims.lon)*Number(dims.lar)).toFixed(2):data.id==="triangle"?((Number(dims.base)*Number(dims.haut))/2).toFixed(2):"—";
  return(<div style={S.screen}>
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={{...S.h2,marginBottom:8}}>{data.emoji} {data.label}</h2>
    <PlanCanvas forme={data.id} dims={dims}/>
    <EditDims forme={data.id} dims={dims} onChange={upd}/>
    <div style={{...S.card,marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"#aaa",fontSize:14}}>Surface</span>
      <span style={{color:"#e8a838",fontWeight:800,fontSize:22}}>{surf} m²</span>
    </div>
    <button style={{...S.cta,marginTop:12}}>✚ Portes &amp; fenêtres</button>
  </div>);
}
function Dims({f,onV,onR}){
  const ch=CHAMPS[f.id]||[];
  const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(<div style={S.screen}>
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={S.h2}>{f.emoji} {f.label}</h2>
    <p style={S.sub}>Dimensions de départ</p>
    <div style={{marginTop:16}}>{ch.map(c=><div key={c.k} style={{marginBottom:12}}>
      <label style={S.lbl}>{c.l}</label>
      <input type="number" min="0.5" step="0.5" placeholder="ex: 4" onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
    </div>)}</div>
    <button onClick={()=>ok&&onV({...f,dims:d})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Créer le plan →</button>
  </div>);
}
export default function App(){
  const[e,se]=useState("choix");
  const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={d=>{sf(d);se("plan")}} onR={()=>se("choix")}/>;
  if(e==="plan"&&f)return<Plan data={f} onR={()=>se("choix")}/>;
  return(<div style={S.screen}>
    <h1 style={{textAlign:"center",color:"#e8a838",fontSize:26,marginBottom:4}}>📐 PlanPro</h1>
    <p style={S.sub}>Choisissez la forme de la pièce</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
      {F.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
        <div style={{fontSize:24}}>{x.emoji}</div>
        <div style={{fontWeight:700,marginTop:4}}>{x.label}</div>
      </button>)}
    </div>
  </div>);
}
const S={screen:{background:"#0f1117",minHeight:"100vh",padding:"20px 16px 40px",fontFamily:"sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",boxSizing:"border-box"},back:{background:"none",border:"none",color:"#e8a838",fontSize:16,cursor:"pointer",padding:"4px 0",marginBottom:8},h2:{fontSize:20,fontWeight:700,margin:"8px 0 0"},sub:{color:"#aaa",fontSize:14,margin:"4px 0 0",textAlign:"center"},lbl:{color:"#aaa",fontSize:13,fontWeight:600,display:"block",marginBottom:4},inp:{width:"100%",padding:12,background:"#1c1f2e",border:"1px solid #333",borderRadius:10,color:"#fff",fontSize:18,boxSizing:"border-box"},cta:{width:"100%",padding:16,background:"#e8a838",border:"none",borderRadius:12,fontWeight:800,fontSize:17,cursor:"pointer",color:"#0f1117"},card:{background:"#1c1f2e",borderRadius:12,padding:"14px 16px"},card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}};
