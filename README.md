<p align="center"><img src="assets/banner.svg" alt="NetOps Console" width="100%"></p>

<p align="center">
  <a href="https://netops-console.netlify.app"><img src="https://img.shields.io/badge/LIVE_DEMO-Open_the_app-1F4E79?style=for-the-badge" alt="Live demo"></a>
</p>
<p align="center">
  <img src="https://github.com/shaikumar11/netops-console/actions/workflows/ci.yml/badge.svg" alt="CI">
  <img src="https://img.shields.io/badge/tests-14_passing-15803d?style=flat-square" alt="tests">
  <img src="https://img.shields.io/badge/coverage-100%25-15803d?style=flat-square" alt="coverage">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
</p>

A network operations dashboard. An engineer signs in, sees the health of a fleet of routers, switches, firewalls and access points, finds a problem device quickly, and acknowledges its alert.

<p align="center"><img src="assets/overview.png" alt="Overview with live latency, alerts and topology" width="100%"></p>
<p align="center"><img src="assets/devices.png" alt="Device list with details drawer" width="100%"></p>

## Try it in 30 seconds
Open the **[live demo](https://netops-console.netlify.app)** and click **Sign in**. The demo account is filled in for you (`engineer` / `demo123`).

1. **Overview:** read the summary cards, the live latency chart and the active alerts.
2. **Topology:** click any colored dot on the map. Green is up, amber is degraded and red is down.
3. **Devices:** filter by status or type, sort by a column, and open a device to see its CPU, latency trend and p95.
4. **Alerts:** acknowledge an alert.
5. Press **Ctrl K** (or Cmd K on a Mac) from anywhere to jump to a device by name, site or IP.

## What I focused on
| Area | How it shows in the app |
|---|---|
| **Clear UX** | A sidebar with three views, the worst devices first, a live chart, a clickable network map and a Ctrl K search. |
| **Accessibility** | Every input has a label, sortable headers announce their state, the device count updates for screen readers, focus is clearly visible, and status is shown as text and not only color. |
| **Responsive** | Works from phone to desktop. Dark mode follows the system setting. |
| **Secure coding** | No raw HTML is ever injected, so React escapes all text. The site ships with a Content Security Policy and other security headers. The session is kept only for the browser tab. |
| **Testing** | 14 automated tests cover the logic and the real user flows. |
| **Clean structure** | Data, business logic and screens are in separate files, and the logic has no UI code in it. |

## Quality
- **14 tests** (Vitest and React Testing Library) with **100% line coverage**. CI fails if line coverage drops below 85%.
- The tests cover wrong password, the overview, filtering and the empty state, the details drawer, alerts, the topology map, the Ctrl K search, sorting, and a session that survives a reload.
- **TypeScript strict mode** is checked on every build, and GitHub Actions runs the tests and the build on every push.

## Project structure
```
src/
  types.ts        Device and status types
  data.ts         Deterministic demo fleet of 24 devices
  logic.ts        Pure functions: summarize, filter, sort, average, p95
  App.tsx         Sign in, dashboard, table and device details
  *.test.ts(x)    Unit and user flow tests
netlify.toml      Build settings and security headers
```

## Honest notes
- Device data is simulated. No real network is monitored.
- Sign in is a browser only demo, so there is no server and no real account system. My other apps, [PipelineHQ](https://github.com/shaikumar11/PipelineHQ) and [PeopleOps Hub](https://github.com/shaikumar11/peopleops-hub), use real server side sign in with hashed passwords and signed tokens.

## Run locally
```
npm install
npm run dev      # development server
npm test         # tests with coverage
npm run build    # type check and production build
```

## Built by
**Shaik Mohammed Umar** · [LinkedIn](https://linkedin.com/in/mohammed-umarshaik) · [GitHub](https://github.com/shaikumar11) · umarshaikno1@gmail.com
