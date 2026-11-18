import { useEffect, useMemo, useState } from 'react'
import { makeDevices } from './data'
import { alertsFrom, avg, filterDevices, nextPoint, p95, sortDevices, summarize, type Filters, type SortKey } from './logic'
import type { Device } from './types'

const USER = 'engineer'
const PASS = 'demo123'
const SITES = ['Bengaluru', 'Hyderabad', 'Chennai', 'Pune']
const POS = [[110, 70], [490, 70], [110, 240], [490, 240]]
type View = 'overview' | 'devices' | 'alerts'
const read = () => { try { return sessionStorage.getItem('auth') === '1' } catch { return false } }
const write = (on: boolean) => { try { on ? sessionStorage.setItem('auth', '1') : sessionStorage.removeItem('auth') } catch { /* private mode */ } }

function Login({ onOk }: { onOk: () => void }) {
  const [u, setU] = useState(USER)
  const [p, setP] = useState(PASS)
  const [err, setErr] = useState('')
  return (
    <section className="login">
      <form className="panel lg" onSubmit={(e) => { e.preventDefault(); if (u.trim() === USER && p === PASS) onOk(); else setErr('Wrong username or password') }}>
        <div className="logo">N</div><h1>NetOps Console</h1><p className="mut">Network health, alerts and topology in one place</p>
        <label htmlFor="u">Username</label><input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <label htmlFor="p">Password</label><input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
        {err && <p role="alert" className="err">{err}</p>}
        <button className="primary">Sign in</button>
        <p className="hint">Demo sign in, checked in the browser only. Username engineer, password demo123.</p>
      </form>
    </section>
  )
}

function Spark({ v }: { v: number[] }) {
  const max = Math.max(...v, 1)
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 200},${50 - (x / max) * 46}`).join(' ')
  return <svg viewBox="0 0 200 50" className="spark" preserveAspectRatio="none" role="img" aria-label="Latency trend"><polyline points={pts} fill="none" stroke="#049fd9" strokeWidth="2.5" /></svg>
}

function Chart({ v }: { v: number[] }) {
  const max = Math.max(...v, 40)
  const line = v.map((x, i) => `${(i / (v.length - 1)) * 600},${150 - (x / max) * 130}`).join(' ')
  return (
    <svg viewBox="0 0 600 160" className="chart" preserveAspectRatio="none" role="img" aria-label="Average network latency over time">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#049fd9" stopOpacity=".45" /><stop offset="1" stopColor="#049fd9" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,160 ${line} 600,160`} fill="url(#g)" /><polyline points={line} fill="none" stroke="#049fd9" strokeWidth="2.5" />
    </svg>
  )
}

function Topology({ devices, onPick }: { devices: Device[]; onPick: (id: string) => void }) {
  return (
    <svg viewBox="0 0 600 335" className="topo" role="group" aria-label="Network topology">
      {POS.map(([x, y], i) => <line key={i} x1={300} y1={155} x2={x} y2={y} className="edge" />)}
      <circle cx={300} cy={155} r={16} className="core" /><text x={300} y={160} textAnchor="middle" className="ctext">Core</text>
      {SITES.map((s, i) => {
        const [x, y] = POS[i]
        const ds = devices.filter((d) => d.site === s)
        return (
          <g key={s}>
            <text x={x} y={y < 150 ? y - 60 : y + 72} textAnchor="middle" className="lbl">{s}</text>
            {ds.map((d, j) => {
              const a = (j / ds.length) * Math.PI * 2 - Math.PI / 2
              const px = x + Math.cos(a) * 46, py = y + Math.sin(a) * 46
              return (
                <g key={d.id}>
                  <line x1={x} y1={y} x2={px} y2={py} className="edge" />
                  <circle role="button" tabIndex={0} aria-label={d.name} cx={px} cy={py} r={8} className={`dev ${d.status}`}
                    onClick={() => onPick(d.id)} onKeyDown={(e) => { if (e.key === 'Enter') onPick(d.id) }}><title>{`${d.name} (${d.status})`}</title></circle>
                </g>
              )
            })}
            <circle cx={x} cy={y} r={11} className="hub" />
          </g>
        )
      })}
    </svg>
  )
}

function Dashboard({ onOut }: { onOut: () => void }) {
  const [devices] = useState<Device[]>(() => makeDevices())
  const [view, setView] = useState<View>('overview')
  const [f, setF] = useState<Filters>({ q: '', status: 'all', type: 'all' })
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'status', dir: 'desc' })
  const [sel, setSel] = useState<string | null>(null)
  const [acked, setAcked] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [pq, setPq] = useState('')
  const base = Math.round(avg(devices.map((d) => avg(d.latency))))
  const [live, setLive] = useState<number[]>(() => Array.from({ length: 30 }, (_, i) => Math.round(base + Math.sin(i / 3) * 6)))
  useEffect(() => { const t = setInterval(() => setLive((s) => nextPoint(s, Math.random())), 2000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true) } else if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [])
  const s = useMemo(() => summarize(devices), [devices])
  const rows = useMemo(() => sortDevices(filterDevices(devices, f), sort.key, sort.dir), [devices, f, sort])
  const alerts = useMemo(() => alertsFrom(devices), [devices])
  const cur = devices.find((d) => d.id === sel)
  const pick = (id: string) => { setSel(id); setView('devices'); setOpen(false); setPq('') }
  const ack = (id: string) => setAcked((a) => (a.includes(id) ? a : [...a, id]))
  const th = (key: SortKey, label: string) => (
    <th aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="thbtn" onClick={() => setSort({ key, dir: sort.key === key && sort.dir === 'desc' ? 'asc' : 'desc' })}>{label}</button>
    </th>
  )
  const alertRow = (a: ReturnType<typeof alertsFrom>[number]) => (
    <li key={a.id} className="alert">
      <span className={`dot ${a.severity}`} /><div><b>{a.name}</b> <span className="mut">· {a.site}</span><div className="mut">{a.message}</div></div>
      {acked.includes(a.id) ? <span className="mut">Acknowledged</span> : <button className="ghost" onClick={() => ack(a.id)}>Acknowledge</button>}
    </li>
  )
  const titles: Record<View, string> = { overview: 'Network overview', devices: 'Devices', alerts: 'Alerts' }
  return (
    <div className="app">
      <nav className="side" aria-label="Main">
        <div className="brand"><div className="logo">N</div>NetOps Console</div>
        {(['overview', 'devices', 'alerts'] as View[]).map((v) => (
          <button key={v} className={`nav ${view === v ? 'on' : ''}`} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>
            {titles[v] === 'Network overview' ? 'Overview' : titles[v]}{v === 'alerts' && <span className="badge">{alerts.length}</span>}
          </button>
        ))}
        <button className="nav out" onClick={onOut}>Sign out</button>
      </nav>
      <main>
        <div className="top"><h1>{titles[view]}</h1><button className="search" onClick={() => setOpen(true)}>Search devices <kbd>Ctrl K</kbd></button></div>
        {view === 'overview' && (<>
          <section className="kpis">
            <div className="panel kpi"><span>Devices</span><b>{s.total}</b></div>
            <div className="panel kpi"><span>Healthy</span><b>{s.healthPct}%</b></div>
            <div className="panel kpi"><span>Degraded</span><b className="wa">{s.degraded}</b></div>
            <div className="panel kpi"><span>Down</span><b className="er">{s.down}</b></div>
          </section>
          <div className="two">
            <div className="panel"><h2>Live network latency <small className="mut">now {live[live.length - 1]} ms</small></h2><Chart v={live} /></div>
            <div className="panel"><h2>Active alerts</h2><ul className="alerts">{alerts.slice(0, 4).map(alertRow)}</ul></div>
          </div>
          <div className="panel"><h2>Topology <small className="mut">click a device</small></h2><Topology devices={devices} onPick={pick} /></div>
        </>)}
        {view === 'devices' && (
          <div className="panel">
            <div className="filters">
              <div><label htmlFor="q">Search</label><input id="q" placeholder="Name, site or IP" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
              <div><label htmlFor="st">Status</label><select id="st" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Filters['status'] })}>
                <option value="all">All</option><option value="up">Up</option><option value="degraded">Degraded</option><option value="down">Down</option></select></div>
              <div><label htmlFor="ty">Type</label><select id="ty" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                <option value="all">All</option><option>router</option><option>switch</option><option>firewall</option><option>access point</option></select></div>
            </div>
            <p className="mut" aria-live="polite">Showing {rows.length} of {devices.length} devices</p>
            <div className="wrap"><table><thead><tr>{th('name', 'Device')}<th>Site</th><th>Type</th>{th('status', 'Status')}{th('latency', 'Latency')}</tr></thead>
              <tbody>{rows.map((d) => (<tr key={d.id} className={d.id === sel ? 'sel' : ''}>
                <td><button className="link" onClick={() => setSel(d.id)}>{d.name}</button></td><td>{d.site}</td><td>{d.type}</td>
                <td><span className={`pill ${d.status}`}>{d.status}</span></td><td>{avg(d.latency)} ms</td></tr>))}</tbody></table>
              {!rows.length && <div className="empty">No devices match these filters</div>}</div>
          </div>
        )}
        {view === 'alerts' && <div className="panel"><h2>{alerts.length} active alerts</h2><ul className="alerts">{alerts.map(alertRow)}</ul></div>}
      </main>
      <aside className={`drawer ${cur && view === 'devices' ? 'open' : ''}`} aria-label="Device details">
        {cur && (<div>
          <button className="ghost close" onClick={() => setSel(null)}>Close</button>
          <h2>{cur.name}</h2><p className="mut">{cur.ip} · {cur.site} · {cur.type}</p><span className={`pill ${cur.status}`}>{cur.status}</span>
          <p>CPU {cur.cpu}%</p><div className="bar"><i style={{ width: `${cur.cpu}%` }} /></div>
          <p>Latency trend (last 12 checks)</p><Spark v={cur.latency} /><p className="mut">Average {avg(cur.latency)} ms · p95 {p95(cur.latency)} ms</p>
          {cur.status !== 'up' && (acked.includes(cur.id) ? <p className="mut">Alert acknowledged</p> : <button className="primary" onClick={() => ack(cur.id)}>Acknowledge alert</button>)}
        </div>)}
      </aside>
      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="palette" role="dialog" aria-label="Search devices" onClick={(e) => e.stopPropagation()}>
            <input autoFocus placeholder="Search devices by name, site or IP" aria-label="Search all devices" value={pq} onChange={(e) => setPq(e.target.value)} />
            <ul>{filterDevices(devices, { q: pq, status: 'all', type: 'all' }).slice(0, 6).map((d) => (
              <li key={d.id}><button onClick={() => pick(d.id)}><span className={`dot ${d.status}`} /> {d.name} <span className="mut">{d.site}</span></button></li>))}</ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(read)
  return authed ? <Dashboard onOut={() => { write(false); setAuthed(false) }} /> : <Login onOk={() => { write(true); setAuthed(true) }} />
}
