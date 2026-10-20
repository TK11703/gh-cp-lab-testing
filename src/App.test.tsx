// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { initialRequests } from './lib/requests'

let container: HTMLDivElement
let root: Root

function selectByLabel(text: string): HTMLSelectElement {
  const label = Array.from(container.querySelectorAll('label')).find(
    (candidate) => candidate.textContent === text,
  )
  const control = label?.control
  if (!(control instanceof HTMLSelectElement)) {
    throw new Error(`Missing labeled select: ${text}`)
  }
  return control
}

function choose(select: HTMLSelectElement, value: string) {
  act(() => {
    select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function titles() {
  return Array.from(container.querySelectorAll('.request-card h3')).map(
    (heading) => heading.textContent,
  )
}

function expectCount(visible: number, total = 4) {
  expect(container.querySelector('[role="status"]')?.textContent).toBe(
    `${visible} of ${total} requests`,
  )
}

function clearFilters() {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === 'Clear filters',
  )
  if (!button) throw new Error('Missing clear filters button')
  act(() => button.click())
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(<App />))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('queue filters', () => {
  it('provides visibly labeled native, focusable selects and shows the full queue', () => {
    const status = selectByLabel('Filter by status')
    const priority = selectByLabel('Filter by priority')
    expect(status.value).toBe('')
    expect(priority.value).toBe('')
    expect(Array.from(status.options).map((option) => option.value)).toEqual([
      '', 'Open', 'In progress', 'Resolved',
    ])
    expect(Array.from(priority.options).map((option) => option.value)).toEqual([
      '', 'Low', 'Medium', 'High',
    ])
    for (const select of [status, priority]) {
      expect(select.tabIndex).toBe(0)
      select.focus()
      expect(document.activeElement).toBe(select)
    }
    expect(titles()).toEqual(initialRequests.map((request) => request.title))
    expectCount(4)
  })

  it('filters independently and together without resetting the other selection', () => {
    const status = selectByLabel('Filter by status')
    const priority = selectByLabel('Filter by priority')
    choose(priority, 'Low')
    expect(titles()).toEqual(initialRequests.slice(2).map((request) => request.title))
    expectCount(2)
    choose(status, 'Open')
    expect(priority.value).toBe('Low')
    expect(titles()).toEqual([initialRequests[2].title])
    expectCount(1)
    choose(priority, '')
    expect(status.value).toBe('Open')
    expect(titles()).toEqual([initialRequests[0].title, initialRequests[2].title])
    expectCount(2)
    expect(Array.from(container.querySelectorAll('.summary-card strong')).map(
      (value) => value.textContent,
    )).toEqual(['4', '2', '1', '1'])
  })

  it('shows an empty state and clears both filters to restore the original queue', () => {
    choose(selectByLabel('Filter by status'), 'Resolved')
    choose(selectByLabel('Filter by priority'), 'High')
    expect(titles()).toEqual([])
    expectCount(0)
    expect(container.querySelector('.queue-empty')?.textContent).toContain(
      'No requests match these filters',
    )
    clearFilters()
    expect(selectByLabel('Filter by status').value).toBe('')
    expect(selectByLabel('Filter by priority').value).toBe('')
    expect(container.querySelector('.queue-empty')).toBeNull()
    expect(titles()).toEqual(initialRequests.map((request) => request.title))
    expectCount(4)
  })

  it('uses the latest selections during repeated changes', () => {
    const status = selectByLabel('Filter by status')
    const priority = selectByLabel('Filter by priority')
    for (const value of ['Open', 'Resolved', '', 'In progress', 'Open']) {
      choose(status, value)
    }
    for (const value of ['Low', 'High', '', 'Medium', 'Low']) {
      choose(priority, value)
    }
    expect(titles()).toEqual([initialRequests[2].title])
    expectCount(1)
  })

  it('preserves filters on submission and includes new requests only when they match', () => {
    const status = selectByLabel('Filter by status')
    const priority = selectByLabel('Filter by priority')
    choose(status, 'Open')
    choose(priority, 'High')
    const title = container.querySelector('#title')
    const description = container.querySelector('#description')
    if (!(title instanceof HTMLInputElement) ||
        !(description instanceof HTMLTextAreaElement)) {
      throw new Error('Missing request fields')
    }
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        ?.call(title, 'New matching request')
      title.dispatchEvent(new Event('input', { bubbles: true }))
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
        ?.call(description, 'Needs attention')
      description.dispatchEvent(new Event('input', { bubbles: true }))
    })
    choose(selectByLabel('Priority'), 'High')
    act(() => container.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ))
    expect(status.value).toBe('Open')
    expect(priority.value).toBe('High')
    expect(titles()).toEqual(['New matching request', initialRequests[0].title])
    expectCount(2, 5)
    choose(status, 'Resolved')
    expect(titles()).toEqual([])
    expectCount(0, 5)
    clearFilters()
    expect(titles()[0]).toBe('New matching request')
    expectCount(5, 5)
  })
})
