import { useMemo, useState } from 'react'
import { makeDevices } from './data'
import { avg, filterDevices, p95, sortDevices, summarize, type Filters, type SortKey } from './logic'
import type { Device } from './types'

const USER = 'engineer'
const PASS = 'demo123'
const read = () => { try { return sessionStorage.getItem('auth') === '1' } catch { return false } }
const write = (on: boolean) => { try { on ? sessionStorage.setItem('auth', '1') : sessionStorage.removeItem('auth') } catch { /* private mode */ } }

function Login({ onOk }: { onOk: () => void }) {
  const [u, setU] = useState(USER)
  const [p, setP] = useState(PASS)
  const [err, setErr] = useState('')
  return (
    <section id="login">
      <form className="card lg" onSubmit={(e) => { e.preventDefault(); if (u.trim() === USER && p === PASS) onOk(); else setErr('Wrong username or password') }}>
        <div className="logo">N</div><h1>NetOps Console</h1><p className="mut">Network device health at a glance</p>
        <label htmlFor="u">Username</label><input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <label htmlFor="p">Password</label><input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
        {err && <p role="alert" className="err">{err}</p>}
        <button className="submit">Sign in</button>
        <p className="hint">Demo sign in (checked in the browser only). Username engineer, password demo123.</p>
      </form>
    </section>
  )
}

function Spark({ v }: { v: number[] }) {
  const max = Math.max(...v, 1)
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 200},${50 - (x / max) * 46}`).join(' ')
  return <svg viewBox="0 0 200 50" className="spark" preserveAspectRatio="none" role="img" aria-label="Latency trend"><polyline points={pts} fill="none" stroke="var(--pri)" strokeWidth="2" /></svg>
}

function Dashboard({ onOut }: { onOut: () => void }) {
  const [devices] = useState<Device[]>(() => makeDevices())
  const [f, setF] = useState<Filters>({ q: '', status: 'all', type: 'all' })
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'status', dir: 'desc' })
  const [sel, setSel] = useState<string | null>(null)
  const [acked, setAcked] = useState<string[]>([])
  const s = useMemo(() => summarize(devices), [devices])
  const rows = useMemo(() => sortDevices(filterDevices(devices, f), sort.key, sort.dir), [devices, f, sort])
  const cur = devices.find((d) => d.id === sel)
  const th = (key: SortKey, label: string) => (
    <th aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="ghost" onClick={() => setSort({ key, dir: sort.key === key && sort.dir === 'desc' ? 'asc' : 'desc' })}>{label}</button>
    </th>
  )
  return (
    <div>
      <header><div className="logo">N</div><div><h1>NetOps Console</h1><small>Network device health at a glance</small></div>
        <div className="me"><button className="ghost" onClick={onOut}>Sign out</button></div></header>
      <main>
        <section className="kpis">
          <div className="card kpi"><span>Devices</span><b>{s.total}</b></div>
          <div className="card kpi"><span>Healthy</span><b>{s.healthPct}%</b></div>
          <div className="card kpi"><span>Degraded</span><b>{s.degraded}</b></div>
          <div className="card kpi"><span>Down</span><b>{s.down}</b></div>
        </section>
        <div className="grid">
          <div className="card">
            <div className="filters">
              <div><label htmlFor="q">Search</label><input id="q" placeholder="Name, site or IP" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
              <div><label htmlFor="st">Status</label><select id="st" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Filters['status'] })}>
                <option value="all">All</option><option value="up">Up</option><option value="degraded">Degraded</option><option value="down">Down</option></select></div>
              <div><label htmlFor="ty">Type</label><select id="ty" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                <option value="all">All</option><option>router</option><option>switch</option><option>firewall</option><option>access point</option></select></div>
            </div>
            <p className="note" aria-live="polite">Showing {rows.length} of {devices.length} devices</p>
            <div className="wrap"><table><thead><tr>{th('name', 'Device')}<th>Site</th><th>Type</th>{th('status', 'Status')}{th('latency', 'Latency')}</tr></thead>
              <tbody>{rows.map((d) => (
                <tr key={d.id} className={d.id === sel ? 'sel' : ''}>
                  <td><button className="link" onClick={() => setSel(d.id)}>{d.name}</button></td><td>{d.site}</td><td>{d.type}</td>
                  <td><span className={`pill ${d.status}`}>{d.status}</span></td><td>{avg(d.latency)} ms</td></tr>))}</tbody></table>
              {!rows.length && <div className="empty">No devices match these filters</div>}</div>
          </div>
          <aside className="card" aria-label="Device details">
            {!cur ? <div className="empty">Select a device to see its details</div> : (<div>
              <h2>{cur.name}</h2><p className="note">{cur.ip} · {cur.site} · {cur.type}</p>
              <span className={`pill ${cur.status}`}>{cur.status}</span>
              <p>CPU {cur.cpu}%</p><div className="bar"><i style={{ width: `${cur.cpu}%` }} /></div>
              <p>Latency trend (last 12 checks)</p><Spark v={cur.latency} />
              <p className="note">Average {avg(cur.latency)} ms · p95 {p95(cur.latency)} ms</p>
              {cur.status !== 'up' && (acked.includes(cur.id) ? <p className="hint">Alert acknowledged</p> :
                <button onClick={() => setAcked([...acked, cur.id])}>Acknowledge alert</button>)}
            </div>)}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(read)
  return authed ? <Dashboard onOut={() => { write(false); setAuthed(false) }} /> : <Login onOk={() => { write(true); setAuthed(true) }} />
}
