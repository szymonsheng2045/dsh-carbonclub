import { describe, expect, it } from 'vitest'
import {
  acceptOffer,
  createHallState,
  enterQueue,
  HALL_RULES,
  latestHallNotice,
  postMessage,
  publicHallMessages,
  tickHall,
  type HallMember,
} from '../src/client/hall-machine.js'

const members: HallMember[] = Array.from({ length: 12 }, (_, index) => ({
  id: `m${index}`,
  name: `member-${index}`,
  color: '#999',
}))

function fullHall(now = 1_000) {
  return createHallState({
    now,
    members,
    seated: members.slice(0, 8).map(member => member.id),
    queue: ['m8', 'm9'],
    audience: ['m10', 'm11'],
  })
}

describe('hall queue state machine', () => {
  it('caps every speaking lease at five minutes', () => {
    expect(HALL_RULES.maxLeaseMs).toBe(5 * 60_000)
  })

  it('warns an idle speaker, demotes after the grace period, and offers the seat to the queue head', () => {
    const initial = fullHall()
    const warningAt = initial.now + HALL_RULES.idleMs
    const warned = tickHall(initial, warningAt)
    expect(warned.seats[0]?.warnedAt).toBe(warningAt)

    const demoted = tickHall(warned, warningAt + HALL_RULES.warningMs)
    expect(demoted.seats[0]).toBeNull()
    expect(demoted.cooldownUntil.m0).toBe(warningAt + HALL_RULES.warningMs + HALL_RULES.cooldownMs)
    expect(demoted.offers).toContainEqual(expect.objectContaining({ memberId: 'm8', seatIndex: 0 }))
  })

  it('fills a reserved seat only when its valid offer is accepted', () => {
    const state = createHallState({ now: 1_000, members, seated: ['m0'], queue: ['m8'] })
    expect(state.offers[0]).toEqual(expect.objectContaining({ memberId: 'm8', seatIndex: 1 }))
    const accepted = acceptOffer(state, 'm8', 2_000)
    expect(accepted.seats[1]?.memberId).toBe('m8')
    expect(accepted.offers).toHaveLength(0)
  })

  it('rotates an expired offer to the queue tail and advances the next person', () => {
    const state = createHallState({
      now: 1_000,
      members,
      seated: members.slice(0, 7).map(member => member.id),
      queue: ['m8', 'm9'],
    })
    const advanced = tickHall(state, 1_000 + HALL_RULES.offerMs)
    expect(advanced.offers[0]?.memberId).toBe('m9')
    expect(advanced.queue).toEqual(['m8'])
    expect(publicHallMessages(advanced.messages)).toHaveLength(0)
    expect(latestHallNotice(advanced.messages)?.body).toContain('顺延到队尾')
    expect(latestHallNotice(advanced.messages)?.translations?.en).toContain('back of the queue')
  })

  it('does not allow duplicate queue entries or cooldown bypass', () => {
    const initial = fullHall()
    const queued = enterQueue(initial, 'm10', initial.now)
    expect(enterQueue(queued, 'm10', initial.now).queue.filter(id => id === 'm10')).toHaveLength(1)

    const warning = tickHall(initial, initial.now + HALL_RULES.idleMs)
    const demoted = tickHall(warning, warning.now + HALL_RULES.warningMs)
    expect(enterQueue(demoted, 'm0', demoted.now).queue).not.toContain('m0')
  })

  it('enforces slow mode, consecutive-message limit, and renews activity', () => {
    const initial = createHallState({ now: 1_000, members, seated: ['m0', 'm1'] })
    const first = postMessage(initial, 'm0', 'one', 10_000)
    expect(first.error).toBeUndefined()
    expect(first.state.seats[0]?.lastSpokeAt).toBe(10_000)
    expect(postMessage(first.state, 'm0', 'too soon', 12_000).error).toBe('slow-mode')

    const second = postMessage(first.state, 'm0', 'two', 20_000)
    expect(second.error).toBeUndefined()
    expect(postMessage(second.state, 'm0', 'three', 30_000).error).toBe('consecutive-limit')

    const interleaved = postMessage(second.state, 'm1', 'your turn', 30_000)
    expect(postMessage(interleaved.state, 'm0', 'thanks', 40_000).error).toBeUndefined()
  })

  it('ends a seat at the hard lease cap even when the speaker is active', () => {
    const initial = createHallState({ now: 1_000, members, seated: ['m0'], queue: ['m8'] })
    const active = postMessage(initial, 'm0', 'still here', 1_000 + HALL_RULES.maxLeaseMs - 1).state
    const ended = tickHall(active, 1_000 + HALL_RULES.maxLeaseMs)
    expect(ended.seats[0]).toBeNull()
    expect(ended.offers).toContainEqual(expect.objectContaining({ memberId: 'm8', seatIndex: 0 }))
  })
})
