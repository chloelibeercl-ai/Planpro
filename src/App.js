import{useState,useRef,useEffect}from"react";
const F=[{id:"carre",label:"Carré",emoji:"⬜"},{id:"rectangle",label:"Rectangle",emoji:"▬"},{id:"triangle",label:"Triangle",emoji:"🔺"},{id:"U",label:"Forme en U",emoji:"⊓"},{id:"L",label:"Forme en L",emoji:"⌐"}];
const CHAMPS={carre:[{k:"cote",l:"Côté (m)"}],rectangle:[{k:"lon",l:"Longueur (m)"},{k:"lar",l:"Largeur (m)"}],triangle:[{k:"base",l:"Base (m)"},{k:"haut",l:"Hauteur (m)"}],L:[{k:"l1",l:"Long. 1 (m)"},{k:"l2",l:"Long. 2 (m)"},{k:"w1",l:"Larg. 1 (m)"},{k:"w2",l:"Larg. 2 (m)"}],U:[{k:"lt",l:"Larg. totale (m)"},{k:"ht",l:"Haut. totale (m)"},{k:"ep",l:"Épaisseur (m)"}]};

function drawGrid(ctx,W,H,ox,oy,scale){
  // Quadrillage 1m
  ctx.strokeStyle="rgba(255,255,255,0.07)";
  ctx.lineWidth=0.5;
  ctx.setLineDash([]);
  for(let x=ox%scale;x<W;x+=scale){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=oy%scale;y<H;y+=scale){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // Quadrillage 5m plus visible
  ctx.strokeStyle="rgba(255,255,255,0.13)";
  ctx.lineWidth=1;
  for(let x=ox%(scale*5);x<W;x+=scale*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=oy%(scale*5);y<H;y+=scale*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}

function drawScale(ctx,W,H,scale){
  // Barre d'échelle en bas à gauche
  const bx=20,by=H-20,blen=scale*2;
  ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+blen,by);
  ctx.strokeStyle="#aaa";ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx,by-5);ctx.lineTo(bx,by+5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx+blen,by-5);ctx.lineTo(bx+blen,by+5);ctx.stroke();
  ctx.fillStyle="#aaa";ctx.font="11px sans-serif";
  ctx.fillText("2 m",bx+blen/2-10,by-8);
}

function drawPoly(ctx,pts){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
  ctx.closePath();
  ctx.fillStyle="rgba(232,168,56,0.1)";ctx.fill();
  ctx.strokeStyle="#e8a838";ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.stroke();
}

function drawDims(ctx,pts,labels){
  ctx.fillStyle="#4a9eff";ctx.font="bold 12px sans-serif";ctx.setLineDash([4,3]);ctx.strokeStyle="#4a9eff";ctx.lineWidth=1;
  labels.forEach(({x1,y1,x2,y2,txt})=>{
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.setLineDash([]);
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    ctx.fillStyle="#1c1f2e";ctx.fillRect(mx-18,my-14,36,16);
    ctx.fillStyle="#4a9eff";ctx.fillText(txt,mx-14,my-2);
    ctx.setLineDash([4,3]);
  });
  ctx.setLineDash([]);
}

function PlanCanvas({forme,dims,size=300}){
  const c=useRef();
  useEffect(()=>{
    const cv=c.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const W=cv.width,H=cv.height;
    const PAD=40;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#12151f";ctx.fillRect(0,0,W,H);
    const d=dims;
    let pts=[],scale=1,ox=PAD,oy=PAD,dimLabels=[];
    const aw=W-PAD*2,ah=H-PAD*2;

    if(forme==="carre"){
      const s=Number(d.cote||1);
      scale=Math.min(aw/s,ah/s);
      const pw=s*scale,ph=s*scale;
      ox=PAD+(aw-pw)/2;oy=PAD+(ah-ph)/2;
      pts=[[ox,oy],[ox+pw,oy],[ox+pw,oy+ph],[ox,oy+ph]];
      dimLabels=[{x1:ox,y1:oy-15,x2:ox+pw,y2:oy-15,txt:s+"m"},{x1:ox+pw+15,y1:oy,x2:ox+pw+15,y2:oy+ph,txt:s+"m"}];
    }else if(forme==="rectangle"){
      const lx=Number(d.lon||1),ly=Number(d.lar||1);
      scale=Math.min(aw/lx,ah/ly);
      const pw=lx*scale,ph=ly*scale;
      ox=PAD+(aw-pw)/2;oy=PAD+(ah-ph)/2;
      pts=[[ox,oy],[ox+pw,oy],[ox+pw,oy+ph],[ox,oy+ph]];
      dimLabels=[{x1:ox,y1:oy-15,x2:ox+pw,y2:oy-15,txt:lx+"m"},{x1:ox+pw+15,y1:oy,x2:ox+pw+15,y2:oy+ph,txt:ly+"m"}];
    }else if(forme==="triangle"){
      const b=Number(d.base||1),h=Number(d.haut||1);
      scale=Math.min(aw/b,ah/h);
      const pw=b*scale,ph=h*scale;
      ox=PAD+(aw-pw)/2;oy=PAD+(ah-ph)/2;
      pts=[[ox+pw/2,oy],[ox+pw,oy+ph],[ox,oy+ph]];
      dimLabels=[{x1:ox,y1:oy+ph+15,x2:ox+pw,y2:oy+ph+15,txt:b+"m"},{x1:ox+pw/2,y1:oy,x2:ox+pw,y2:oy+ph,txt:h+"m"}];
    }else if(forme==="L"){
      const l1=Number(d.l1||1),l2=Number(d.l2||1),w1=Number(d.w1||1),w2=Number(d.w2||1);
      const mW=Math.max(l1,l2),mH=w1+w2;
      scale=Math.min(aw/mW,ah/mH);
      ox=PAD+(aw-mW*scale)/2;oy=PAD+(ah-mH*scale)/2;
      pts=[[ox,oy],[ox+l1*scale,oy],[ox+l1*scale,oy+w1*scale],[ox+l2*scale,oy+w1*scale],[ox+l2*scale,oy+mH*scale],[ox,oy+mH*scale]];
      dimLabels=[{x1:ox,y1:oy-15,x2:ox+l1*scale,y2:oy-15,txt:l1+"m"},{x1:ox-15,y1:oy,x2:ox-15,y2:oy+mH*scale,txt:(w1+w2)+"m"}];
    }else if(forme==="U"){
      const lt=Number(d.lt||1),ht=Number(d.ht||1),ep=Number(d.ep||1);
      scale=Math.min(aw/lt,ah/ht);
      ox=PAD+(aw-lt*scale)/2;oy=PAD+(ah-ht*scale)/2;
      const W2=lt*scale,H2=ht*scale,E=ep*scale;
      pts=[[ox,oy],[ox+W2,oy],[ox+W2,oy+H2],[ox+W2-E,oy+H2],[ox+W2-E,oy+E],[ox+E,oy+E],[ox+E,oy+H2],[ox,oy+H2]];
      dimLabels=[{x1:ox,y1:oy-15,x2:ox+W2,y2:oy-15,txt:lt+"m"},{x1:ox-15,y1:oy,x2:ox-15,y2:oy+H2,txt:ht+"m"}];
    }

    drawGrid(ctx,W,H,ox,oy,scale);
    drawPoly(ctx,pts);
    drawDims(ctx,pts,dimLabels);
    drawScale(ctx,W,H,scale);

    // Nord
    ctx.fillStyle="#e8a838";ctx.font="bold 14px sans-serif";
    ctx.fillText("N↑",W-30,25);
  },[forme,dims,size]);
  return<canvas ref={c} width={size} height={size} style={{borderRadius:12,display:"block",margin:"0 auto",maxWidth:"100%"}}/>;
}

function Dims({f,onV,onR}){
  const ch=CHAMPS[f.id]||[];
  const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(<div style={S.screen}>
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={S.h2}>{f.emoji} {f.label}</h2>
    <p style={S.sub}>Entrez les dimensions</p>
    <div style={{marginTop:16}}>{ch.map(c=><div key={c.k} style={{marginBottom:12}}>
      <label style={S.lbl}>{c.l}</label>
      <input type="number" min="0.1" step="0.1" placeholder="ex: 4.5" onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
    </div>)}</div>
    {ok&&<div style={{marginTop:16}}><p style={{color:"#aaa",fontSize:12,textAlign:"center",marginBottom:6}}>Aperçu en temps réel</p><PlanCanvas forme={f.id} dims={d} size={280}/></div>}
    <button onClick={()=>ok&&onV({...f,dims:d})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Voir le plan →</button>
  </div>);
}

function Plan({data,onR}){
  const d=data.dims;
  const surf=data.id==="carre"?(d.cote**2).toFixed(2):data.id==="rectangle"?(d.lon*d.lar).toFixed(2):data.id==="triangle"?((d.base*d.haut)/2).toFixed(2):"—";
  return(<div style={S.screen}>
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={{...S.h2,marginBottom:8}}>📐 {data.label}</h2>
    <PlanCanvas forme={data.id} dims={d} size={320}/>
    <div style={S.card}>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
        {Object.entries(d).map(([k,v])=><span key={k} style={{background:"#2a2d3e",borderRadius:6,padding:"4px 10px",fontSize:13}}>{k}: <strong>{v}m</strong></span>)}
      </div>
      {surf!=="—"&&<p style={{color:"#e8a838",fontWeight:800,fontSize:20,margin:0}}>Surface ≈ {surf} m²</p>}
    </div>
    <button style={S.cta}>✚ Ajouter portes & fenêtres</button>
  </div>);
}

export default function App(){
  const[e,se]=useState("choix");
  const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={d=>{sf(d);se("plan")}} onR={()=>se("choix")}/>;
  if(e==="plan")return<Plan data={f} onR={()=>se("choix")}/>;
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

const S={screen:{background:"#0f1117",minHeight:"100vh",padding:"20px 16px 40px",fontFamily:"sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",boxSizing:"border-box"},back:{background:"none",border:"none",color:"#e8a838",fontSize:16,cursor:"pointer",padding:"4px 0",marginBottom:8},h2:{fontSize:20,fontWeight:700,margin:"8px 0 0"},sub:{color:"#aaa",fontSize:14,margin:"4px 0 0",textAlign:"center"},lbl:{color:"#aaa",fontSize:13,fontWeight:600,display:"block",marginBottom:4},inp:{width:"100%",padding:12,background:"#1c1f2e",border:"1px solid #333",borderRadius:10,color:"#fff",fontSize:18,boxSizing:"border-box"},cta:{width:"100%",padding:16,background:"#e8a838",border:"none",borderRadius:12,fontWeight:800,fontSize:17,cursor:"pointer",color:"#0f1117",marginTop:16},card:{background:"#1c1f2e",borderRadius:12,padding:"14px 16px",marginTop:12},card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}};
