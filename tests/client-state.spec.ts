import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CarbonClubRemote } from '../src/client/network-store.js'
import type { RoomDelta, RoomSnapshot } from '../src/network/types.js'
import { draftAfterSend, shouldSubmit } from '../src/client/composer.js'
import { defaultName, normalizeName } from '../src/client/profile.js'

function room(cursor = 1): RoomSnapshot {
  return { roomId: 'hall', seats: Array.from({ length: 8 }, () => null), queue: [], queueCount: 0, participantCount: 0, capacity: 500, messages: [], profiles: {}, avatars: {}, cursor, updatedAt: cursor }
}
const ok = <T>(value: T) => ({ ok: true as const, value })
function api(): CarbonClubRemote {
  return {
    status: vi.fn(async () => ok({ phase: 'online' as const, peerId: 'local', addresses: [], connectedPeers: 1, discoveredPeers: 1, bootstrapConfigured: 0, relayAddresses: 0 })),
    roomDelta: vi.fn(async () => ok({ ...room(), reset: true })),
    roomSnapshot: vi.fn(async () => ok(room())),
    joinHall: vi.fn(async () => ok({ ...room(2), localQueuePosition: 33 })),
    leaveHall: vi.fn(async () => ok(room(3))),
    postRoomMessage: vi.fn(async () => ok({ id: 'sent', origin: 'local', body: 'hello', sentAt: 4, sequence: 1 })),
    evidence: vi.fn(async () => { throw new Error('Host disconnected') }),
    createInvite: vi.fn(async () => ok({ code: 'carbon1:test', peerId: 'local', addresses: [], expiresAt: 100 })),
    connect: vi.fn(async () => ok({ connected: true, peerId: 'other' })),
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

describe('browser network state', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.useRealTimers())

  it('releases a hung send, ignores its late result, and recovers on polling without resending', async () => {
    vi.useFakeTimers()
    const store = await import('../src/client/network-store.js')
    const remote = api()
    const dispose = store.bindNetworkRemote(remote)
    await store.refreshNetwork()
    const delayed = deferred<Awaited<ReturnType<CarbonClubRemote['postRoomMessage']>>>()
    vi.mocked(remote.postRoomMessage).mockReturnValueOnce(delayed.promise)
    const sending = store.postNetworkMessage({ body: 'hello' })
    await vi.advanceTimersByTimeAsync(20_001)
    expect(await sending).toBe(false)
    expect(store.getNetworkSnapshot().posting).toBe(false)
    expect(store.getNetworkSnapshot().actionError).toBe('HOST_REQUEST_TIMEOUT')
    const message = { id: 'late', origin: 'local', body: 'hello', sentAt: 5, sequence: 1 }
    delayed.resolve(ok(message))
    await Promise.resolve()
    expect(store.getNetworkSnapshot().room?.messages).toHaveLength(0)
    vi.mocked(remote.roomDelta).mockResolvedValue(ok({ ...room(5), messages: [message], reset: true }))
    await store.refreshNetwork()
    expect(store.getNetworkSnapshot().room?.messages[0]?.id).toBe('late')
    expect(remote.postRoomMessage).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('a hung poll times out and a subsequent poll restores online status', async () => {
    vi.useFakeTimers()
    const store = await import('../src/client/network-store.js')
    const remote = api()
    vi.mocked(remote.roomDelta).mockReturnValueOnce(new Promise(() => {}))
    const dispose = store.bindNetworkRemote(remote)
    const poll = store.refreshNetwork()
    await vi.advanceTimersByTimeAsync(20_001)
    await poll
    expect(store.getNetworkSnapshot().phase).toBe('error')
    await store.refreshNetwork()
    expect(store.getNetworkSnapshot().phase).toBe('online')
    dispose()
  })

  it('ignores a delayed snapshot from before leaving the queue', async () => {
    const store = await import('../src/client/network-store.js')
    const remote = api()
    const dispose = store.bindNetworkRemote(remote)
    await store.refreshNetwork()
    await store.joinNetworkHall({ name: 'reader' })
    const old = deferred<ReturnType<typeof ok<RoomDelta>>>()
    vi.mocked(remote.roomDelta).mockReturnValueOnce(old.promise)
    const refreshing = store.refreshNetwork()
    await store.leaveNetworkHall()
    old.resolve(ok({ ...room(2), reset: false, localQueuePosition: 33 }))
    await refreshing
    expect(store.getNetworkSnapshot().room?.localQueuePosition).toBeUndefined()
    expect(store.getNetworkSnapshot().room?.cursor).toBe(3)
    dispose()
  })

  it('does not apply an old Host response after rebinding, and coalesces polls', async () => {
    const store = await import('../src/client/network-store.js')
    const old = api()
    const delayed = deferred<ReturnType<typeof ok<RoomDelta>>>()
    vi.mocked(old.roomDelta).mockReturnValue(delayed.promise)
    const unbindOld = store.bindNetworkRemote(old)
    const polling = store.refreshNetwork()
    expect(store.refreshNetwork()).toBe(polling)
    expect(old.roomDelta).toHaveBeenCalledTimes(1)
    const fresh = api()
    vi.mocked(fresh.roomDelta).mockResolvedValue(ok({ ...room(7), reset: true }))
    const unbindFresh = store.bindNetworkRemote(fresh)
    await store.refreshNetwork()
    unbindOld()
    delayed.resolve(ok({ ...room(99), reset: true }))
    await polling
    expect(store.getNetworkSnapshot().room?.cursor).toBe(7)
    unbindFresh()
    expect(store.getNetworkSnapshot().room).toBeUndefined()
  })

  it('keeps profile updates ahead of a subsequent leave', async () => {
    const store = await import('../src/client/network-store.js')
    const remote = api()
    const dispose = store.bindNetworkRemote(remote)
    await store.refreshNetwork()
    const delayed = deferred<ReturnType<typeof ok<RoomSnapshot>>>()
    vi.mocked(remote.joinHall).mockReturnValueOnce(delayed.promise)
    const joining = store.joinNetworkHall({ name: 'new name' })
    const leaving = store.leaveNetworkHall()
    await Promise.resolve()
    expect(remote.leaveHall).not.toHaveBeenCalled()
    delayed.resolve(ok({ ...room(2), localQueuePosition: 33 }))
    await Promise.all([joining, leaving])
    expect(remote.leaveHall).toHaveBeenCalledTimes(1)
    expect(store.getNetworkSnapshot().room?.localQueuePosition).toBeUndefined()
    dispose()
  })

  it('prevents duplicate sends while preserving the successful result', async () => {
    const store = await import('../src/client/network-store.js')
    const remote = api()
    const dispose = store.bindNetworkRemote(remote)
    await store.refreshNetwork()
    const delayed = deferred<Awaited<ReturnType<CarbonClubRemote['postRoomMessage']>>>()
    vi.mocked(remote.postRoomMessage).mockReturnValue(delayed.promise)
    const first = store.postNetworkMessage({ body: 'hello' })
    expect(await store.postNetworkMessage({ body: 'hello' })).toBe(false)
    expect(remote.postRoomMessage).toHaveBeenCalledTimes(1)
    delayed.resolve(ok({ id: 'sent', origin: 'local', body: 'hello', sentAt: 4, sequence: 1 }))
    expect(await first).toBe(true)
    expect(store.getNetworkSnapshot().posting).toBe(false)
    expect(store.getNetworkSnapshot().room?.messages).toHaveLength(1)
    dispose()
  })

  it('catches evidence transport failures instead of rejecting the UI handler', async () => {
    const store = await import('../src/client/network-store.js')
    const dispose = store.bindNetworkRemote(api())
    await expect(store.requestEvidence('missing')).resolves.toBeUndefined()
    expect(store.getNetworkSnapshot().actionError).toBe('Host disconnected')
    dispose()
  })

  it('serializes a send between a profile change and leaving', async () => {
    const store = await import('../src/client/network-store.js')
    const remote = api()
    const dispose = store.bindNetworkRemote(remote)
    await store.refreshNetwork()
    const delayed = deferred<ReturnType<typeof ok<RoomSnapshot>>>()
    vi.mocked(remote.joinHall).mockReturnValueOnce(delayed.promise)
    const joining = store.joinNetworkHall({ name: 'new name' })
    const sending = store.postNetworkMessage({ body: 'hello' })
    const leaving = store.leaveNetworkHall()
    await Promise.resolve()
    expect(remote.postRoomMessage).not.toHaveBeenCalled()
    expect(remote.leaveHall).not.toHaveBeenCalled()
    delayed.resolve(ok(room(2)))
    await Promise.all([joining, sending, leaving])
    expect(remote.postRoomMessage).toHaveBeenCalledTimes(1)
    expect(vi.mocked(remote.postRoomMessage).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(remote.leaveHall).mock.invocationCallOrder[0]!)
    expect(store.getNetworkSnapshot().room?.cursor).toBe(3)
    expect(store.getNetworkSnapshot().posting).toBe(false)
    dispose()
  })

  it('bounds avatar/profile caches through many distinct visitors and avatar replacements', async () => {
    const { mergeRoom } = await import('../src/client/network-store.js')
    let current = room(0)
    for (let index = 1; index <= 400; index++) {
      const peer = `peer-${index}`
      current = mergeRoom(current, { ...room(index), reset: false,
        messages: [{ id: peer, origin: peer, body: 'hi', sentAt: index, sequence: 1 }],
        profiles: { [peer]: { name: peer, avatarCid: `avatar-${index}` } },
        avatars: { [`avatar-${index}`]: 'data:image/webp;base64,AAAA' },
      })
    }
    expect(current.messages).toHaveLength(50)
    expect(Object.keys(current.profiles)).toHaveLength(50)
    expect(Object.keys(current.avatars)).toHaveLength(50)
    current = mergeRoom(current, { ...room(401), reset: false, profiles: { 'peer-400': { name: 'new', avatarCid: 'new-avatar' } }, avatars: { 'new-avatar': 'data:image/webp;base64,BBBB' } })
    expect(current.avatars['avatar-400']).toBeUndefined()
    expect(current.avatars['new-avatar']).toBeDefined()
  })
})

describe('chat composer and identity', () => {
  it('reserves Enter for IME candidate confirmation and Shift+Enter for newlines', () => {
    const enter = { key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }
    expect(shouldSubmit(enter)).toBe(true)
    expect(shouldSubmit({ ...enter, isComposing: true })).toBe(false)
    expect(shouldSubmit({ ...enter, keyCode: 229 })).toBe(false)
    expect(shouldSubmit({ ...enter, shiftKey: true })).toBe(false)
  })
  it('does not erase text typed during an earlier send', () => {
    expect(draftAfterSend('next message', 'first message')).toBe('next message')
    expect(draftAfterSend('first message', 'first message')).toBe('')
  })
  it('uses distinct language-independent fallback names and normalizes user nicknames', () => {
    expect(defaultName('abc123456')).toBe('Carbon-123456')
    expect(defaultName('abc654321')).not.toBe(defaultName('abc123456'))
    expect(normalizeName('  茶壶\n冒泡  ')).toBe('茶壶冒泡')
    expect(normalizeName('a'.repeat(80))).toHaveLength(48)
    expect(normalizeName('a'.repeat(47) + '😀')).toBe('a'.repeat(47))
  })
})
