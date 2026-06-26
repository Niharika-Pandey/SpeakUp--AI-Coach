import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PolarRadiusAxis, Legend,
} from 'recharts';
import { getSessions, clearSessions } from '../hooks/useSessionStore';

const C = { conf:'#7c3aed', eye:'#0d9488', pron:'#6366f1', fillers:'#e11d48' };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--ink-800)', border:'1px solid var(--ink-600)', borderRadius:8, padding:'0.6rem 0.9rem', fontSize:'0.78rem' }}>
      <p style={{ margin:'0 0 0.3rem', color:'var(--ink-300)', fontWeight:600 }}>{label}</p>
      {payload.map(p => <div key={p.dataKey} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
}

function Empty({ onStart }) {
  return (
    <div style={{ textAlign:'center', padding:'6rem 1rem' }}>
      <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'0.6rem' }}>No sessions yet</h2>
      <p style={{ color:'var(--ink-300)', marginBottom:'2rem', maxWidth:380, margin:'0 auto 2rem' }}>
        Complete your first session to start tracking progress.
      </p>
      <button className="btn btn-primary btn-lg" onClick={onStart}>Start first session</button>
    </div>
  );
}

export default function Dashboard({ onStart }) {
  const sessions = getSessions();
  const chartData = useMemo(() =>
    sessions.slice().reverse().map((s, i) => ({
      name: `#${i+1}`,
      date: new Date(s.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      confidence: s.confidence_score,
      eye_contact: s.eye_contact_score,
      pronunciation: s.pronunciation_score,
      fillers: s.filler_count,
      topic: s.topic,
    }))
  , [sessions]);

  const last = sessions[0];
  const radarData = last ? [
    {m:'Confidence',  v:last.confidence_score},
    {m:'Eye contact', v:last.eye_contact_score},
    {m:'Pronunciation',v:last.pronunciation_score},
    {m:'Pauses',      v:last.pauses_score ?? 70},
    {m:'Filler-free', v:Math.max(0,100-(last.filler_count||0)*5)},
  ] : [];

  const avg = useMemo(() => {
    if (!sessions.length) return null;
    const sum = k => sessions.reduce((a,s) => a+(s[k]||0),0);
    return {
      confidence: Math.round(sum('confidence_score')/sessions.length),
      eye: Math.round(sum('eye_contact_score')/sessions.length),
      pron: Math.round(sum('pronunciation_score')/sessions.length),
      fillers: Math.round(sum('filler_count')/sessions.length),
    };
  },[sessions]);

  if (!sessions.length) return <Empty onStart={onStart}/>;

  return (
    <div className="container" style={{ paddingTop:'5.5rem', paddingBottom:'5rem' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'clamp(1.6rem,3.5vw,2.2rem)', fontWeight:800, marginBottom:'0.3rem' }}>Progress</h1>
          <p style={{ color:'var(--ink-300)', fontSize:'0.9rem' }}>{sessions.length} session{sessions.length!==1?'s':''} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={onStart}>+ New session</button>
      </div>

      {/* Avg stats */}
      {avg && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'2rem' }}>
          {[
            {l:'Avg confidence', v:`${avg.confidence}`, c:C.conf},
            {l:'Avg eye contact', v:`${avg.eye}%`, c:C.eye},
            {l:'Avg pronunciation', v:`${avg.pron}`, c:C.pron},
            {l:'Avg fillers/session', v:avg.fillers, c:C.fillers},
          ].map(({l,v,c}) => (
            <div key={l} className="surface" style={{ padding:'1rem 1.25rem' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:c, fontFamily:"'Space Grotesk',sans-serif", marginBottom:'0.2rem' }}>{v}</div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Line chart */}
      <div className="surface" style={{ padding:'1.5rem', marginBottom:'1rem' }}>
        <div className="label" style={{ marginBottom:'1.25rem' }}>Score over time</div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-600)"/>
            <XAxis dataKey="date" tick={{fill:'var(--ink-400)',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis domain={[0,100]} tick={{fill:'var(--ink-400)',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Line type="monotone" dataKey="confidence" name="Confidence" stroke={C.conf} strokeWidth={2.5} dot={{r:4,fill:C.conf}} activeDot={{r:5}}/>
            <Line type="monotone" dataKey="eye_contact" name="Eye contact" stroke={C.eye} strokeWidth={2} strokeDasharray="4 2" dot={{r:3,fill:C.eye}}/>
            <Line type="monotone" dataKey="pronunciation" name="Pronunciation" stroke={C.pron} strokeWidth={2} strokeDasharray="4 2" dot={{r:3,fill:C.pron}}/>
            <Legend wrapperStyle={{fontSize:'0.78rem',color:'var(--ink-300)'}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
        {/* Filler bar chart */}
        <div className="surface" style={{ padding:'1.5rem' }}>
          <div className="label" style={{ marginBottom:'1.25rem', color:'var(--rose)' }}>Filler words per session</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-600)"/>
              <XAxis dataKey="date" tick={{fill:'var(--ink-400)',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'var(--ink-400)',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="fillers" name="Fillers" fill={C.fillers} radius={[3,3,0,0]} opacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="surface" style={{ padding:'1.5rem' }}>
          <div className="label" style={{ marginBottom:'1rem', color:'var(--violet-xl)' }}>Latest session breakdown</div>
          <ResponsiveContainer width="100%" height={170}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--ink-600)"/>
              <PolarAngleAxis dataKey="m" tick={{fill:'var(--ink-400)',fontSize:10}}/>
              <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
              <Radar dataKey="v" stroke="var(--violet)" fill="var(--violet)" fillOpacity={0.12} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History table */}
      <div className="surface" style={{ padding:'1.5rem', overflowX:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div className="label">Session history</div>
          <button
            onClick={() => { if (window.confirm('Clear all session history?')) { clearSessions(); window.location.reload(); }}}
            style={{ background:'transparent', border:'1px solid rgba(225,29,72,0.3)', borderRadius:7, color:'var(--rose)', fontSize:'0.72rem', padding:'0.3rem 0.65rem', cursor:'pointer', fontWeight:600 }}
          >
            Clear all
          </button>
        </div>
        <table className="data-table" style={{ minWidth:580 }}>
          <thead>
            <tr>
              {['Date','Niche','Topic','Confidence','Fillers','WPM','Eye contact'].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                <td>{s.niche}</td>
                <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.topic}</td>
                <td style={{ fontWeight:700, color: s.confidence_score>=70?'var(--green)':s.confidence_score>=50?'var(--amber)':'var(--rose)' }}>{s.confidence_score}</td>
                <td style={{ color: s.filler_count<=3?'var(--green)':'var(--amber)' }}>{s.filler_count}</td>
                <td>{s.pace_wpm}</td>
                <td style={{ color: s.eye_contact_score>=70?'var(--green)':'var(--amber)' }}>{s.eye_contact_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
