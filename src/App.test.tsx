import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

beforeEach(() => sessionStorage.clear())
const signIn = () => userEvent.click(screen.getByRole('button', { name: /sign in/i }))

describe('App', () => {
  it('rejects a wrong password', async () => {
    render(<App />)
    await userEvent.clear(screen.getByLabelText(/password/i))
    await userEvent.type(screen.getByLabelText(/password/i), 'bad')
    await signIn()
    expect(screen.getByRole('alert')).toHaveTextContent(/wrong username or password/i)
  })
  it('shows the dashboard after signing in', async () => {
    render(<App />)
    await signIn()
    expect(screen.getByText(/showing 24 of 24 devices/i)).toBeInTheDocument()
  })
  it('filters devices by status and search, with an empty state', async () => {
    render(<App />)
    await signIn()
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'down')
    expect(screen.getByText(/showing \d+ of 24 devices/i).textContent).not.toMatch(/showing 24/)
    await userEvent.type(screen.getByLabelText(/search/i), 'zzz')
    expect(screen.getByText(/no devices match/i)).toBeInTheDocument()
  })
  it('opens device details and acknowledges an alert', async () => {
    render(<App />)
    await signIn()
    await userEvent.click(screen.getAllByRole('button', { name: /^(rt|sw|fw|ap)-/ })[0])
    expect(screen.getByLabelText(/device details/i)).toHaveTextContent(/latency trend/i)
    await userEvent.click(screen.getByRole('button', { name: /acknowledge alert/i }))
    expect(screen.getByText(/alert acknowledged/i)).toBeInTheDocument()
  })
  it('re-sorts when a column header is clicked', async () => {
    render(<App />)
    await signIn()
    const name = screen.getByRole('button', { name: 'Device' })
    await userEvent.click(name)
    await userEvent.click(name)
    expect(name.closest('th')).toHaveAttribute('aria-sort', 'ascending')
  })
  it('signs out and keeps the session across a reload', async () => {
    const { unmount } = render(<App />)
    await signIn()
    unmount()
    render(<App />)
    expect(screen.getByText(/showing 24 of 24/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
