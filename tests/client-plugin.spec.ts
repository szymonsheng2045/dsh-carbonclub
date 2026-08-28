import { describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.js'
import { ROOMS, roomsFor } from '../src/client/room-catalog.js'

describe('client plugin integration shape', () => {
  it('contributes additive entries without taking over the DSH header or details column', async () => {
    const registered: Array<{ name: string; id: string }> = []
    const ctx = {
      effect: vi.fn(),
      get: vi.fn(() => ({
        status: vi.fn(async () => ({ ok: true, value: { phase: 'online', addresses: [], connectedPeers: 0, discoveredPeers: 0 } })),
        roomSnapshot: vi.fn(async () => ({ ok: true, value: { roomId: 'hall', seats: Array.from({ length: 8 }, () => null), queue: [], messages: [], updatedAt: 0 } })),
        createInvite: vi.fn(), connect: vi.fn(), joinHall: vi.fn(), leaveHall: vi.fn(), postRoomMessage: vi.fn(),
      })),
      remote: {
        $mount: vi.fn(async () => async () => {}),
        carbonClub: {},
      },
      slots: {
        inject: vi.fn((_name: string, factory: () => unknown) => factory()),
        register: vi.fn((entry: { name: string; id: string }) => {
          registered.push(entry)
          return () => {}
        }),
      },
    }

    const dispose = await apply(ctx as unknown as Parameters<typeof apply>[0])

    expect(inject).toEqual(['slots', 'remote'])
    expect(registered).toEqual([
      { name: 'conversation.session.header.utilities', id: 'human-buffer-trigger', order: 80 },
      { name: 'shell.overlay', id: 'human-buffer-panel', order: 40 },
    ])
    expect(registered.some(entry => entry.name === 'details')).toBe(false)
    await dispose()
  })

  it('ships distinct, rule-bearing room definitions', () => {
    expect(new Set(ROOMS.map(room => room.id)).size).toBe(ROOMS.length)
    expect(ROOMS.every(room => room.rules.length >= 3)).toBe(true)
    expect(ROOMS.find(room => room.id === 'dimension')?.rules.join('')).toContain('禁止私聊')
    expect(ROOMS.find(room => room.id === 'hall')?.name).toBe('碳基会所')
    expect(ROOMS.find(room => room.id === 'hall')?.description).toBe('蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。')
    expect(ROOMS.find(room => room.id === 'hall')?.rules).toContain('单次坐席最多 5 分钟')
    expect(roomsFor('en').find(room => room.id === 'hall')).toEqual(expect.objectContaining({ name: 'Carbon Club', shortName: 'Lobby' }))
    expect(roomsFor('en').every(room => room.rules.length >= 3)).toBe(true)
  })
})
