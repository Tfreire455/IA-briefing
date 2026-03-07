export default function CircuitBg({ opacity = 0.4 }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity }}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>{`
            .tl { stroke: #0EA5E9; stroke-width: 1; fill: none; }
            .ts { stroke: #06EEF5; stroke-width: 0.6; fill: none; }
            .td { stroke: #0369A1; stroke-width: 0.5; fill: none; }
            @keyframes tf { 0%{stroke-dashoffset:400;opacity:.1} 40%{opacity:.6} 70%{opacity:.5} 100%{stroke-dashoffset:0;opacity:.1} }
            @keyframes dp { 0%,100%{opacity:.15} 50%{opacity:.7} }
            @keyframes sv { 0%{opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
            .a1{stroke-dasharray:400;animation:tf 5s linear infinite}
            .a2{stroke-dasharray:400;animation:tf 6s linear infinite 1s}
            .a3{stroke-dasharray:400;animation:tf 4s linear infinite 2s}
            .a4{stroke-dasharray:400;animation:tf 7s linear infinite 0.5s}
            .a5{stroke-dasharray:400;animation:tf 5.5s linear infinite 3s}
            .p1{animation:dp 3s ease-in-out infinite}
            .p2{animation:dp 4s ease-in-out infinite 1.5s}
            .p3{animation:dp 5s ease-in-out infinite 1s}
            .sig{fill:#06EEF5;filter:url(#gc)}
            .sig1{animation:sv 4s linear infinite}
            .sig2{animation:sv 5s linear infinite 1s}
            .sig3{animation:sv 3.5s linear infinite 2s}
            .sig4{animation:sv 6s linear infinite 0.5s}
          `}</style>
          <filter id="gc"><feGaussianBlur stdDeviation="2.5"/><feComposite in="SourceGraphic" operator="over"/></filter>
          <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,45 30,58 2,45 2,17" fill="none" stroke="#0EA5E9" strokeWidth="0.3" opacity="0.12"/>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#hex)"/>

        {/* Horizontal backbones */}
        <path className="tl a1" d="M0,80 H200 V120 H500 V80 H900 V140 H1200 V80 H1440"/>
        <path className="td p1" d="M0,100 H180 V140 H460 V100 H840 V160 H1160 V100 H1440"/>
        <path className="tl a2" d="M0,280 H200 V240 H600 V280 H900 V220 H1200 V280 H1440"/>
        <path className="td p2" d="M0,300 H220 V260 H580 V300 H880 V240 H1180 V300 H1440"/>
        <path className="ts a3" d="M0,480 H200 V460 H480 V500 H700 V460 H1000 V500 H1200 V460 H1440"/>
        <path className="tl a4" d="M0,620 H350 V580 H650 V640 H900 V580 H1200 V620 H1440"/>
        <path className="ts a5" d="M0,760 H200 V800 H500 V760 H800 V820 H1100 V760 H1440"/>
        <path className="td p3" d="M0,820 H300 V780 H700 V840 H1100 V800 H1440"/>

        {/* Vertical trunks */}
        <path className="tl a1" d="M100,0 V80 H60 V200 H100 V380 H140 V520 H100 V700 H60 V900"/>
        <path className="tl a3" d="M1340,0 V80 H1380 V200 H1340 V350 H1300 V500 H1340 V700 H1380 V900"/>
        <path className="td p1" d="M240,0 V60 H280 V180 H240 V360 H200 V540 H240 V740 H280 V900" opacity="0.4"/>
        <path className="td p2" d="M1200,0 V60 H1160 V180 H1200 V360 H1240 V540 H1200 V740 H1160 V900" opacity="0.4"/>

        {/* Diagonals */}
        {[[200,80,340,200],[900,80,780,200],[500,280,640,380],[1200,280,1080,400],[300,480,180,600],[1000,480,1120,600],[350,620,200,740],[900,620,1060,740]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="td" opacity="0.35"/>
        ))}

        {/* IC packages */}
        <g opacity="0.45">
          <rect x="320" y="160" width="80" height="60" fill="none" stroke="#0EA5E9" strokeWidth="0.8"/>
          {[175,190,205].map(y=><line key={y} x1="320" y1={y} x2="300" y2={y} stroke="#0EA5E9" strokeWidth="0.8"/>)}
          {[175,190,205].map(y=><line key={y} x1="400" y1={y} x2="420" y2={y} stroke="#0EA5E9" strokeWidth="0.8"/>)}
          <text x="342" y="196" fill="#0EA5E9" fontSize="8" fontFamily="monospace" opacity="0.7">MCU</text>
        </g>
        <g opacity="0.4">
          <rect x="800" y="320" width="100" height="70" fill="none" stroke="#06EEF5" strokeWidth="0.8"/>
          {[335,350,365,380].map(y=><line key={y} x1="800" y1={y} x2="775" y2={y} stroke="#06EEF5" strokeWidth="0.8"/>)}
          {[335,350,365,380].map(y=><line key={y} x1="900" y1={y} x2="925" y2={y} stroke="#06EEF5" strokeWidth="0.8"/>)}
          <text x="822" y="362" fill="#06EEF5" fontSize="8" fontFamily="monospace" opacity="0.7">GPU</text>
        </g>
        <g opacity="0.35">
          <rect x="550" y="540" width="90" height="65" fill="none" stroke="#0EA5E9" strokeWidth="0.8"/>
          {[555,570,585].map(y=><line key={y} x1="550" y1={y} x2="525" y2={y} stroke="#0EA5E9" strokeWidth="0.8"/>)}
          {[555,570,585].map(y=><line key={y} x1="640" y1={y} x2="665" y2={y} stroke="#0EA5E9" strokeWidth="0.8"/>)}
          <text x="570" y="578" fill="#0EA5E9" fontSize="8" fontFamily="monospace" opacity="0.7">RAM</text>
        </g>

        {/* Capacitors */}
        {[[240,180],[480,300],[1000,250],[720,460],[1100,640],[200,680],[850,560],[400,740],[1250,440],[660,180],[1060,720]].map(([x,y],i)=>(
          <g key={i} opacity="0.45">
            <line x1={x-6} y1={y}   x2={x+6} y2={y}   stroke="#0EA5E9" strokeWidth="1.2"/>
            <line x1={x-6} y1={y+4} x2={x+6} y2={y+4} stroke="#0EA5E9" strokeWidth="1.2"/>
            <line x1={x}   y1={y-6} x2={x}   y2={y}   stroke="#0EA5E9" strokeWidth="0.7"/>
            <line x1={x}   y1={y+4} x2={x}   y2={y+10} stroke="#0EA5E9" strokeWidth="0.7"/>
          </g>
        ))}

        {/* Via holes */}
        {[[100,80],[500,80],[900,80],[1200,80],[100,280],[600,280],[900,280],[1200,280],[200,480],[700,480],[350,620],[900,620],[200,760],[800,760]].map(([x,y],i)=>(
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="none" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.5"/>
            <circle cx={x} cy={y} r="2" fill="#0EA5E9" opacity="0.7"/>
          </g>
        ))}

        {/* Signal dots */}
        <circle className="sig sig1" r="3" cx="100" cy="80"/>
        <circle className="sig sig2" r="2.5" cx="600" cy="280"/>
        <circle className="sig sig3" r="2" cx="700" cy="480"/>
        <circle className="sig sig4" r="3" cx="1200" cy="80"/>
        <circle className="sig sig1" r="2.5" cx="350" cy="620"/>
        <circle className="sig sig2" r="2" cx="900" cy="760"/>

        {/* Corner brackets */}
        {[[[20,20,'H60'],[20,20,'V60']],[[1420,20,'H1380'],[1420,20,'V60']],[[20,880,'V840'],[20,880,'H60']],[[1420,880,'V840'],[1420,880,'H1380']]].map(([[x1,y1,d1],[x2,y2,d2]],i)=>(
          <g key={i} stroke="#0EA5E9" strokeWidth="1.5" fill="none" opacity="0.6">
            <path d={`M${x1},${y1} ${d1}`}/><path d={`M${x2},${y2} ${d2}`}/>
          </g>
        ))}
      </svg>
    </div>
  );
}
