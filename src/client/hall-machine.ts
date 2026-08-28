export const HALL_RULES = {
  seatCount: 8,
  idleMs: 2 * 60_000,
  warningMs: 30_000,
  offerMs: 30_000,
  maxLeaseMs: 5 * 60_000,
  cooldownMs: 10 * 60_000,
  slowModeMs: 8_000,
  maxMessageLength: 400,
  maxConsecutiveMessages: 2,
} as const

export interface HallMember {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly avatarUrl?: string
  readonly lastCompletedSession?: string
}

export interface SeatLease {
  readonly memberId: string
  readonly seatedAt: number
  readonly lastSpokeAt: number
  readonly warnedAt?: number
}

export interface SeatOffer {
  readonly memberId: string
  readonly seatIndex: number
  readonly offeredAt: number
  readonly expiresAt: number
}

export interface HallMessage {
  readonly id: string
  readonly memberId: string
  readonly body: string
  readonly sentAt: number
  readonly kind: 'message' | 'system'
  readonly translations?: Readonly<{ zh: string; en: string }>
}

export interface HallState {
  readonly now: number
  readonly members: Readonly<Record<string, HallMember>>
  readonly seats: readonly (SeatLease | null)[]
  readonly queue: readonly string[]
  readonly offers: readonly SeatOffer[]
  readonly audience: readonly string[]
  readonly cooldownUntil: Readonly<Record<string, number>>
  readonly messages: readonly HallMessage[]
}

export type PostError = 'not-seated' | 'empty' | 'too-long' | 'slow-mode' | 'consecutive-limit'

export interface PostResult {
  readonly state: HallState
  readonly error?: PostError
}

export function publicHallMessages(messages: readonly HallMessage[]): readonly HallMessage[] {
  return messages.filter(message => message.kind === 'message')
}

export function latestHallNotice(messages: readonly HallMessage[]): HallMessage | undefined {
  return messages.findLast(message => message.kind === 'system')
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function systemMessage(state: HallState, translations: Readonly<{ zh: string; en: string }>, at: number): HallMessage {
  return {
    id: `system-${at}-${state.messages.length}`,
    memberId: 'system',
    body: translations.zh,
    sentAt: at,
    kind: 'system',
    translations,
  }
}

function seatMemberIds(state: HallState): Set<string> {
  return new Set(state.seats.flatMap(seat => seat === null ? [] : [seat.memberId]))
}

function fillOffers(state: HallState, now: number): HallState {
  const reserved = new Set(state.offers.map(offer => offer.seatIndex))
  const emptySeats = state.seats
    .map((seat, index) => seat === null && !reserved.has(index) ? index : -1)
    .filter(index => index >= 0)
  if (emptySeats.length === 0 || state.queue.length === 0) return state

  const take = Math.min(emptySeats.length, state.queue.length)
  const promoted = state.queue.slice(0, take)
  const offers = promoted.map((memberId, index): SeatOffer => ({
    memberId,
    seatIndex: emptySeats[index]!,
    offeredAt: now,
    expiresAt: now + HALL_RULES.offerMs,
  }))
  return {
    ...state,
    queue: state.queue.slice(take),
    offers: [...state.offers, ...offers],
  }
}

export function createHallState(input: {
  readonly now: number
  readonly members: readonly HallMember[]
  readonly seated?: readonly string[]
  readonly queue?: readonly string[]
  readonly audience?: readonly string[]
  readonly messages?: readonly HallMessage[]
}): HallState {
  const memberMap = Object.fromEntries(input.members.map(member => [member.id, member]))
  const seated = unique(input.seated ?? []).slice(0, HALL_RULES.seatCount)
  const seats = Array.from({ length: HALL_RULES.seatCount }, (_, index): SeatLease | null => {
    const memberId = seated[index]
    return memberId === undefined ? null : {
      memberId,
      seatedAt: input.now,
      lastSpokeAt: input.now,
    }
  })
  const state: HallState = {
    now: input.now,
    members: memberMap,
    seats,
    queue: unique(input.queue ?? []).filter(id => !seated.includes(id)),
    offers: [],
    audience: unique([...(input.audience ?? []), ...(input.queue ?? [])]).filter(id => !seated.includes(id)),
    cooldownUntil: {},
    messages: input.messages ?? [],
  }
  return fillOffers(state, input.now)
}

export function enterQueue(state: HallState, memberId: string, now: number): HallState {
  if (seatMemberIds(state).has(memberId)) return state
  if (state.queue.includes(memberId) || state.offers.some(offer => offer.memberId === memberId)) return state
  if ((state.cooldownUntil[memberId] ?? 0) > now) return state
  return fillOffers({
    ...state,
    now,
    queue: [...state.queue, memberId],
    audience: unique([...state.audience, memberId]),
  }, now)
}

export function leaveQueue(state: HallState, memberId: string, now: number): HallState {
  const offered = state.offers.find(offer => offer.memberId === memberId)
  const next = {
    ...state,
    now,
    queue: state.queue.filter(id => id !== memberId),
    offers: state.offers.filter(offer => offer.memberId !== memberId),
  }
  return offered === undefined ? next : fillOffers(next, now)
}

export function acceptOffer(state: HallState, memberId: string, now: number): HallState {
  const offer = state.offers.find(candidate => candidate.memberId === memberId && candidate.expiresAt > now)
  if (offer === undefined || state.seats[offer.seatIndex] !== null) return state
  const seats = [...state.seats]
  seats[offer.seatIndex] = { memberId, seatedAt: now, lastSpokeAt: now }
  const member = state.members[memberId]
  const next: HallState = {
    ...state,
    now,
    seats,
    offers: state.offers.filter(candidate => candidate !== offer),
    audience: state.audience.filter(id => id !== memberId),
    messages: member === undefined
      ? state.messages
      : [...state.messages, systemMessage(state, {
        zh: `${member.name} 接过了第 ${offer.seatIndex + 1} 席。`,
        en: `${member.name} took seat ${offer.seatIndex + 1}.`,
      }, now)],
  }
  return fillOffers(next, now)
}

export function declineOffer(state: HallState, memberId: string, now: number): HallState {
  const offer = state.offers.find(candidate => candidate.memberId === memberId)
  if (offer === undefined) return state
  return fillOffers({
    ...state,
    now,
    offers: state.offers.filter(candidate => candidate !== offer),
    queue: [...state.queue, memberId],
  }, now)
}

export function tickHall(state: HallState, now: number): HallState {
  const expired = state.offers.filter(offer => offer.expiresAt <= now)
  let messages = state.messages
  let queue = [...state.queue, ...expired.map(offer => offer.memberId)]
  let offers = state.offers.filter(offer => offer.expiresAt > now)
  const cooldownUntil = { ...state.cooldownUntil }
  const audience = [...state.audience]

  const seats = state.seats.map((seat): SeatLease | null => {
    if (seat === null) return null
    const member = state.members[seat.memberId]
    const hardExpired = now - seat.seatedAt >= HALL_RULES.maxLeaseMs
    const idle = now - seat.lastSpokeAt >= HALL_RULES.idleMs
    if (!hardExpired && !idle) {
      if (seat.warnedAt === undefined) return seat
      const { warnedAt: _warnedAt, ...activeSeat } = seat
      return activeSeat
    }
    if (!hardExpired && seat.warnedAt === undefined) return { ...seat, warnedAt: now }
    if (!hardExpired && seat.warnedAt !== undefined && now - seat.warnedAt < HALL_RULES.warningMs) return seat

    cooldownUntil[seat.memberId] = now + HALL_RULES.cooldownMs
    audience.push(seat.memberId)
    if (member !== undefined) {
      const minutes = HALL_RULES.maxLeaseMs / 60_000
      messages = [...messages, systemMessage({ ...state, messages }, {
        zh: `${member.name} ${hardExpired ? `已满 ${minutes} 分钟` : '暂时离开话筒'}，空出一席。`,
        en: `${member.name} ${hardExpired ? `reached the ${minutes}-minute limit` : 'stepped away from the mic'}; one seat is now open.`,
      }, now)]
    }
    return null
  })

  if (expired.length > 0) {
    messages = [...messages, ...expired.map(offer => {
      const member = state.members[offer.memberId]
      return systemMessage({ ...state, messages }, {
        zh: `${member?.name ?? '候位者'} 未接席，顺延到队尾。`,
        en: `${member?.name ?? 'The queued member'} missed the seat and moved to the back of the queue.`,
      }, now)
    })]
  }

  const stillSeated = new Set(seats.flatMap(seat => seat === null ? [] : [seat.memberId]))
  queue = unique(queue).filter(id => !stillSeated.has(id))
  offers = offers.filter(offer => seats[offer.seatIndex] === null)
  return fillOffers({
    ...state,
    now,
    seats,
    queue,
    offers,
    audience: unique(audience).filter(id => !stillSeated.has(id)),
    cooldownUntil,
    messages,
  }, now)
}

export function postMessage(state: HallState, memberId: string, rawBody: string, now: number): PostResult {
  const body = rawBody.trim()
  const seatIndex = state.seats.findIndex(seat => seat?.memberId === memberId)
  if (seatIndex < 0) return { state, error: 'not-seated' }
  if (body.length === 0) return { state, error: 'empty' }
  if (body.length > HALL_RULES.maxMessageLength) return { state, error: 'too-long' }

  const ownMessages = state.messages.filter(message => message.kind === 'message' && message.memberId === memberId)
  const previous = ownMessages.at(-1)
  if (previous !== undefined && now - previous.sentAt < HALL_RULES.slowModeMs) {
    return { state, error: 'slow-mode' }
  }
  const recent = state.messages.filter(message => message.kind === 'message').slice(-HALL_RULES.maxConsecutiveMessages)
  if (recent.length === HALL_RULES.maxConsecutiveMessages && recent.every(message => message.memberId === memberId)) {
    return { state, error: 'consecutive-limit' }
  }

  const seats = [...state.seats]
  const lease = seats[seatIndex]!
  const { warnedAt: _warnedAt, ...activeLease } = lease
  seats[seatIndex] = { ...activeLease, lastSpokeAt: now }
  return {
    state: {
      ...state,
      now,
      seats,
      messages: [...state.messages, {
        id: `message-${memberId}-${now}`,
        memberId,
        body,
        sentAt: now,
        kind: 'message',
      }],
    },
  }
}
