import { describe, expect, it } from 'vitest'
import { createRequest, filterRequests, summarizeRequests } from './requests'
import type { ServiceRequest } from '../types'

const requests: ServiceRequest[] = [
  {
    id: 1001,
    title: 'First request',
    description: 'Example',
    category: 'Access',
    status: 'Open',
    priority: 'High',
    submittedAt: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 1002,
    title: 'Second request',
    description: 'Example',
    category: 'Profile',
    status: 'Resolved',
    priority: 'Low',
    submittedAt: '2026-10-11T10:00:00.000Z',
  },
]

describe('request helpers', () => {
  it('summarizes requests by status', () => {
    expect(summarizeRequests(requests)).toEqual({
      total: 2,
      open: 1,
      inProgress: 0,
      resolved: 1,
    })
  })

  describe('filterRequests', () => {
    it('returns all requests in their existing order without mutating the queue', () => {
      const queue = Object.freeze([...requests])
      expect(filterRequests(queue)).toEqual(requests)
      expect(filterRequests(queue, '', '')).toEqual(requests)
      expect(queue).toEqual(requests)
    })

    it('filters by status independently', () => {
      expect(filterRequests(requests, 'Open')).toEqual([requests[0]])
      expect(filterRequests(requests, 'Resolved')).toEqual([requests[1]])
      const inProgress = { ...requests[0], status: 'In progress' as const }
      expect(filterRequests([inProgress], 'In progress')).toEqual([inProgress])
    })

    it('filters by priority independently', () => {
      expect(filterRequests(requests, '', 'High')).toEqual([requests[0]])
      expect(filterRequests(requests, '', 'Low')).toEqual([requests[1]])
      const medium = { ...requests[0], priority: 'Medium' as const }
      expect(filterRequests([medium], '', 'Medium')).toEqual([medium])
    })

    it('requires both selections to match', () => {
      expect(filterRequests(requests, 'Open', 'High')).toEqual([requests[0]])
      expect(filterRequests(requests, 'Open', 'Low')).toEqual([])
    })

    it('handles empty queues and zero matches', () => {
      expect(filterRequests([], 'Open', 'High')).toEqual([])
      expect(filterRequests(requests, 'In progress')).toEqual([])
      expect(filterRequests(requests, '', 'Medium')).toEqual([])
    })

    it('retains missing and unexpected values only when their field is unfiltered', () => {
      const queue = [
        { status: 'Unknown', priority: 'High' },
        { status: 'Open', priority: 'Urgent' },
        { priority: 'High' },
        { status: 'Open' },
        { status: null, priority: null },
        {},
      ]
      expect(filterRequests(queue)).toEqual(queue)
      expect(filterRequests(queue, 'Open')).toEqual([queue[1], queue[3]])
      expect(filterRequests(queue, '', 'High')).toEqual([queue[0], queue[2]])
      expect(filterRequests(queue, 'Open', 'High')).toEqual([])
    })

    it('preserves matching order in large queues', () => {
      const queue = Array.from({ length: 10000 }, (_, id) => ({
        id,
        status: id % 2 === 0 ? 'Open' : 'Resolved',
        priority: id % 3 === 0 ? 'High' : 'Low',
      }))
      const filtered = filterRequests(queue, 'Open', 'High')
      expect(filtered).toHaveLength(1667)
      expect(filtered.map((request) => request.id)).toEqual(
        Array.from({ length: 1667 }, (_, index) => index * 6),
      )
    })
  })

  it('creates an open request with the next id', () => {
    const request = createRequest(
      {
        title: 'New request',
        description: 'Needs attention',
        category: 'Other',
        priority: 'Medium',
      },
      requests,
    )

    expect(request).toMatchObject({
      id: 1003,
      title: 'New request',
      status: 'Open',
      priority: 'Medium',
    })
  })
})
