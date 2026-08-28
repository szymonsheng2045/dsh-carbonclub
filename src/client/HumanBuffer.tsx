import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { HALL_RULES } from './hall-machine.js'
import { COPY, type Language } from './i18n.js'
import { setLanguage, useLanguage } from './language-store.js'
import { roomsFor, type RoomId } from './room-catalog.js'
import { setPanelOpen, setPanelWidth, togglePanel, usePanelSnapshot } from './panel-store.js'
import { connectWithInvite, joinNetworkHall, leaveNetworkHall, postNetworkMessage, requestEvidence, requestInvite, useNetworkSnapshot } from './network-store.js'
import type { HallSeat, RoomMessage, RoomProfile } from '../network/types.js'

type HeaderProps = PropsRuntime<'conversation.session.header.utilities'>
type OverlayProps = PropsRuntime<'shell.overlay'>

function timeLabel(at: number, language: Language): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at)
}

const LOCAL_AVATAR_KEY = 'dsh-carbon-club.local-avatar.v1'
const BLOCKED_PEERS_KEY = 'dsh-carbon-club.blocked-peers.v1'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const MAX_NETWORK_AVATAR_LENGTH = 12_288

function loadLocalAvatar(): string | undefined {
  try {
    return window.localStorage.getItem(LOCAL_AVATAR_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function storeLocalAvatar(value: string): void {
  try {
    window.localStorage.setItem(LOCAL_AVATAR_KEY, value)
  } catch {
    // A private browsing policy may reject storage; the in-memory preview still works.
  }
}

async function avatarDataUrl(file: File, language: Language): Promise<string> {
  const errors = COPY[language].avatarErrors
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(errors.type)
  if (file.size > MAX_AVATAR_BYTES) throw new Error(errors.size)

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => { reject(new Error(errors.read)) }
    reader.onload = () => { typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(errors.read)) }
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onerror = () => { reject(new Error(errors.decode)) }
    element.onload = () => { resolve(element) }
    element.src = source
  })
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (context === null) throw new Error(errors.canvas)
  const edge = Math.min(image.naturalWidth, image.naturalHeight)
  context.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, 96, 96)
  const result = canvas.toDataURL('image/webp', 0.72)
  if (result.length > MAX_NETWORK_AVATAR_LENGTH) throw new Error(errors.compressed)
  return result
}

function loadBlockedPeers(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BLOCKED_PEERS_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, 256) : [])
  } catch { return new Set() }
}

function saveBlockedPeers(peers: ReadonlySet<string>): void {
  try { window.localStorage.setItem(BLOCKED_PEERS_KEY, JSON.stringify([...peers].slice(0, 256))) } catch { /* local privacy controls remain in memory */ }
}

function HallSeatGrid({ seats, avatars, localPeerId, language }: { readonly seats: readonly (HallSeat | null)[]; readonly avatars: Readonly<Record<string, string>>; readonly localPeerId: string | undefined; readonly language: Language }) {
  const copy = COPY[language]
  return <div className="hb-seats">
    {seats.map((seat, index) => {
      const participant = seat?.participant
      const warning = seat !== null && seat !== undefined && seat.idleExpiresAt - Date.now() <= 30_000
      return <div className="hb-seat" data-warning={warning || undefined} data-local={participant?.peerId === localPeerId || undefined} key={index}>
        <span className="hb-seat-avatar" style={{ '--seat-color': participant === undefined ? '#d6d9dd' : peerColor(participant.peerId) } as React.CSSProperties}>{participant?.profile.avatarCid !== undefined && avatars[participant.profile.avatarCid] !== undefined && <img src={avatars[participant.profile.avatarCid]} alt="" />}</span>
        <div className="hb-seat-copy">
          <div className="hb-seat-name">
            <span>{participant?.profile.name ?? copy.seatOpen(index + 1)}</span>
            {participant?.profile.lastCompletedSession !== undefined && <span className="hb-member-note" title={copy.lastTaskTitle(participant.profile.lastCompletedSession)}> · {copy.lastSession}{language === 'zh' ? '：' : ': '}{participant.profile.lastCompletedSession}</span>}
          </div>
          <div className="hb-seat-state">{warning ? copy.seatWarning : participant === undefined ? copy.seatWaiting : `${copy.seatActive(index + 1)} · ${participant.peerId.slice(0, 6)}…`}</div>
        </div>
      </div>
    })}
  </div>
}

function peerColor(peerId: string): string {
  let hash = 0
  for (const char of peerId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 32% 54%)`
}

function networkErrorLabel(error: string | undefined, language: Language): string | undefined {
  if (error === undefined) return undefined
  const messages = COPY[language].networkErrors as Readonly<Record<string, string>>
  return messages[error] ?? error
}

function MeshMessages({ messages, profiles, avatars, blockedPeers, language, onBlock, onEvidence }: { readonly messages: readonly RoomMessage[]; readonly profiles: Readonly<Record<string, RoomProfile>>; readonly avatars: Readonly<Record<string, string>>; readonly blockedPeers: ReadonlySet<string>; readonly language: Language; readonly onBlock: (peerId: string) => void; readonly onEvidence: (eventId: string) => void }) {
  const copy = COPY[language]
  const visible = messages.filter(message => !blockedPeers.has(message.origin))
  if (visible.length === 0) return <div className="hb-mesh-empty">{copy.meshEmpty}</div>
  return <div className="hb-messages hb-mesh-messages">{visible.slice(-30).map(message => {
    const profile = profiles[message.origin] ?? { name: `${message.origin.slice(0, 8)}…` }
    return <div className="hb-message" key={message.id}>
    <span className="hb-message-avatar" style={{ '--member-color': peerColor(message.origin) } as React.CSSProperties}>{profile.avatarCid !== undefined && avatars[profile.avatarCid] !== undefined && <img src={avatars[profile.avatarCid]} alt="" />}</span>
    <div>
      <div className="hb-message-meta"><span className="hb-message-name">{profile.name}{profile.lastCompletedSession !== undefined && <span className="hb-member-note"> · {copy.lastSession}{language === 'zh' ? '：' : ': '}{profile.lastCompletedSession}</span>}</span><span className="hb-message-time">{timeLabel(message.sentAt, language)}</span></div>
      <div className="hb-message-body">{message.body}</div>
      <div className="hb-message-proof" title={message.origin}>{copy.signedBy} {message.origin.slice(0, 8)}… · {copy.profileSelfReported}<span className="hb-message-tools"><button type="button" onClick={() => { onEvidence(message.id) }}>{copy.copyEvidence}</button><button type="button" onClick={() => { onBlock(message.origin) }}>{copy.blockPeer}</button></span></div>
    </div>
  </div>})}</div>
}

function NetworkCard({ language }: { readonly language: Language }) {
  const copy = COPY[language]
  const network = useNetworkSnapshot()
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const peerLabel = network.peerId === undefined ? copy.peerPending : `${network.peerId.slice(0, 8)}…${network.peerId.slice(-6)}`
  const statusLabel = network.phase === 'online' ? copy.nodeOnline(network.connectedPeers) : network.phase === 'error' ? copy.nodeError : copy.nodeStarting
  const displayedError = networkErrorLabel(network.actionError ?? network.error, language)

  async function copyInvite(): Promise<void> {
    if (network.invite === undefined) return
    await navigator.clipboard.writeText(network.invite.code)
    setCopied(true)
    window.setTimeout(() => { setCopied(false) }, 1_500)
  }

  return <section className="hb-network" data-phase={network.phase}>
    <div className="hb-network-head">
      <div><div className="hb-network-title"><span className="hb-network-dot" />{statusLabel}</div><div className="hb-peer" title={network.peerId}>{copy.peerId}: {peerLabel}</div></div>
      <button type="button" disabled={network.phase !== 'online' || network.busy !== undefined} onClick={() => { void requestInvite() }}>{network.busy === 'invite' ? copy.creatingInvite : copy.createInvite}</button>
    </div>
    {network.invite !== undefined && <div className="hb-invite-output"><input readOnly value={network.invite.code} aria-label={copy.inviteCode} /><button type="button" onClick={() => { void copyInvite() }}>{copied ? copy.copied : copy.copy}</button></div>}
    <div className="hb-join"><input value={joinCode} placeholder={copy.pasteInvite} aria-label={copy.pasteInvite} onChange={event => { setJoinCode(event.target.value) }} /><button type="button" disabled={joinCode.trim() === '' || network.busy !== undefined} onClick={() => { void connectWithInvite(joinCode).then(connected => { if (connected) setJoinCode('') }) }}>{network.busy === 'connect' ? copy.connecting : copy.connectPeer}</button></div>
    {displayedError !== undefined && <div className="hb-network-error" role="alert">{displayedError}</div>}
    <div className="hb-network-note">{copy.networkNote(network.discoveredPeers, network.bootstrapConfigured, network.relayAddresses)}</div>
  </section>
}

export function HumanBufferHeaderAction({ useSessions }: HeaderProps) {
  const language = useLanguage()
  const copy = COPY[language]
  const running = useSessions(state => {
    const current = state.current
    return current !== undefined && state.byId[current]?.running === true
  })
  const panel = usePanelSnapshot()
  return <button
    className="hb-trigger"
    type="button"
    aria-label={panel.open ? copy.collapseClub : copy.openClub}
    aria-expanded={panel.open}
    onClick={togglePanel}
  >
    <span className="hb-trigger-dot" data-running={running || undefined} />
    <span>{copy.clubName}</span>
  </button>
}

export function HumanBufferOverlay({ useSessions }: OverlayProps) {
  const language = useLanguage()
  const copy = COPY[language]
  const panel = usePanelSnapshot()
  const network = useNetworkSnapshot()
  const hasSession = useSessions(state => state.current !== undefined)
  const running = useSessions(state => {
    const current = state.current
    return current !== undefined && state.byId[current]?.running === true
  })
  const [roomId, setRoomId] = useState<RoomId>('hall')
  const [draft, setDraft] = useState('')
  const [localAvatar, setLocalAvatar] = useState<string | undefined>(loadLocalAvatar)
  const [avatarError, setAvatarError] = useState<string>()
  const [shareLastSession, setShareLastSession] = useState(false)
  const [blockedPeers, setBlockedPeers] = useState<Set<string>>(loadBlockedPeers)
  const [evidenceCopied, setEvidenceCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rooms = useMemo(() => roomsFor(language), [language])
  const room = rooms.find(candidate => candidate.id === roomId) ?? rooms[0]!
  const localLastCompletedSession = useSessions(state => {
    let latest: { readonly title: string; readonly updatedAt: number } | undefined
    for (const id of state.ids) {
      const session = state.byId[id]
      if (session?.completed !== true) continue
      if (latest === undefined || session.updatedAt > latest.updatedAt) latest = { title: session.displayTitle, updatedAt: session.updatedAt }
    }
    return latest?.title
  })

  useEffect(() => {
    if (!panel.open || roomId !== 'hall') return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [panel.open, roomId, network.room?.messages.length])

  const localProfile = useMemo<RoomProfile>(() => ({
    name: language === 'zh' ? '你 · 本机人类' : 'You · Local human',
    ...(localAvatar === undefined ? {} : { avatarUrl: localAvatar }),
    ...(!shareLastSession || localLastCompletedSession === undefined ? {} : { lastCompletedSession: localLastCompletedSession }),
  }), [language, localAvatar, localLastCompletedSession, shareLastSession])
  const seats = network.room?.seats ?? Array.from({ length: HALL_RULES.seatCount }, () => null)
  const localSeated = network.peerId !== undefined && seats.some(seat => seat?.participant.peerId === network.peerId)
  const localQueuePosition = network.room?.localQueuePosition
  const queued = localQueuePosition !== undefined
  const participating = localSeated || queued
  const occupiedCount = seats.filter(Boolean).length

  useEffect(() => {
    if (!participating) return
    void joinNetworkHall(localProfile)
  }, [localProfile, participating])

  const queueCopy = useMemo(() => {
    if (localSeated) return [copy.seatedSelf, copy.seatedSelfHint] as const
    if (localQueuePosition !== undefined) return [copy.queuePosition(localQueuePosition), copy.queuePositionHint] as const
    return [copy.audienceCount(network.room?.queueCount ?? 0), copy.audienceHint] as const
  }, [copy, localQueuePosition, localSeated, network.room?.queueCount])

  function beginResize(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = panel.width
    const move = (next: PointerEvent) => { setPanelWidth(startWidth + startX - next.clientX) }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  async function send(): Promise<void> {
    if (draft.trim() === '') return
    const body = draft.trim()
    if (localSeated && network.phase === 'online' && await postNetworkMessage({ body })) setDraft('')
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (file === undefined) return
    setAvatarError(undefined)
    try {
      const nextAvatar = await avatarDataUrl(file, language)
      setLocalAvatar(nextAvatar)
      storeLocalAvatar(nextAvatar)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : copy.avatarErrors.unknown)
    } finally {
      input.value = ''
    }
  }

  function blockPeer(peerId: string): void {
    if (peerId === network.peerId) return
    const next = new Set(blockedPeers)
    next.add(peerId)
    setBlockedPeers(next)
    saveBlockedPeers(next)
  }

  async function copyEvidence(eventId: string): Promise<void> {
    const evidence = await requestEvidence(eventId)
    if (evidence === undefined) return
    await navigator.clipboard.writeText(JSON.stringify(evidence, null, 2))
    setEvidenceCopied(true)
    window.setTimeout(() => { setEvidenceCopied(false) }, 1_500)
  }

  return <div className="hb-layer" data-open={panel.open || undefined}>
    {!hasSession && !panel.open && <button className="hb-floating" type="button" onClick={togglePanel}>
      <span className="hb-trigger-dot" />{copy.clubName}
    </button>}
    <div className="hb-scrim" onClick={() => { setPanelOpen(false) }} />
    <aside className="hb-panel" lang={language === 'zh' ? 'zh-CN' : 'en'} style={{ '--hb-width': `${panel.width}px` } as React.CSSProperties} aria-label={copy.clubName} aria-hidden={!panel.open}>
      <div className="hb-resize" aria-hidden onPointerDown={beginResize} />
      <header className="hb-head">
        <div className="hb-head-main">
          <div className="hb-eyebrow"><span className="hb-agent-dot" data-running={running || undefined} />{running ? copy.agentRunning : copy.agentIdle}</div>
          <h2 className="hb-title">{copy.clubName}</h2>
        </div>
        <div className="hb-head-actions">
          <button className="hb-language" type="button" aria-label={copy.switchLanguage} title={copy.switchLanguage} onClick={() => { setLanguage(language === 'zh' ? 'en' : 'zh') }}>{language === 'zh' ? 'EN' : '中'}</button>
          <button className="hb-collapse" type="button" aria-label={copy.collapseClub} onClick={() => { setPanelOpen(false) }}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>
        </div>
      </header>

      <nav className="hb-rooms" aria-label={copy.roomsLabel}>
        {rooms.map(candidate => <button
          className="hb-room-tab"
          data-active={candidate.id === roomId || undefined}
          type="button"
          key={candidate.id}
          onClick={() => { setRoomId(candidate.id) }}
        >{candidate.shortName}</button>)}
      </nav>

      <div className="hb-scroll" ref={scrollRef}>
        <section className="hb-room-card">
          <div className="hb-room-row"><span className="hb-room-name">{room.name}</span><span className="hb-room-status">{room.status}</span></div>
          <p className="hb-room-desc">{room.description}</p>
          <div className="hb-rule-list">{room.rules.map(rule => <span className="hb-rule" key={rule}>{rule}</span>)}</div>
        </section>

        <div className="hb-identity">
          <label className="hb-local hb-avatar-upload" title={copy.uploadAvatarTitle}>
            <span className="hb-avatar">{localAvatar === undefined ? (language === 'zh' ? '你' : 'You') : <img src={localAvatar} alt={copy.yourAvatar} />}</span>
            <span className="hb-local-copy"><span>{copy.localIdentity}</span><span className="hb-local-session" title={localLastCompletedSession ?? copy.noCompletedSession}> · {copy.lastSession}{language === 'zh' ? '：' : ': '}{localLastCompletedSession ?? copy.noCompletedSession}</span></span>
            <span className="hb-avatar-action">{localAvatar === undefined ? copy.uploadAvatar : copy.changeAvatar}</span>
            <input className="hb-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { void uploadAvatar(event) }} />
          </label>
          <span className="hb-net">{copy.roomLive}</span>
        </div>
        <label className="hb-share-session"><input type="checkbox" checked={shareLastSession} onChange={event => { setShareLastSession(event.target.checked) }} />{copy.shareLastSession}</label>
        {blockedPeers.size > 0 && <div className="hb-blocked-summary"><span>{copy.blockedCount(blockedPeers.size)}</span><button type="button" onClick={() => { const next = new Set<string>(); setBlockedPeers(next); saveBlockedPeers(next) }}>{copy.clearBlocked}</button></div>}
        {avatarError !== undefined && <div className="hb-avatar-error" role="alert">{avatarError}</div>}
        <NetworkCard language={language} />

        {roomId === 'hall' ? <>
          <div className="hb-section-head"><span className="hb-section-title">{copy.speakers}</span><span className="hb-section-note">{occupiedCount}/{HALL_RULES.seatCount} {copy.seatUnit}</span></div>
          <HallSeatGrid seats={seats} avatars={network.room?.avatars ?? {}} localPeerId={network.peerId} language={language} />
          <div className="hb-queue">
            <div className="hb-queue-copy">
              <div className="hb-queue-kicker">{copy.queueTitle}</div>
              <div className="hb-queue-main">{queueCopy[0]}<span className="hb-queue-detail"> · {queueCopy[1]}</span></div>
            </div>
            <button className="hb-queue-button" data-queued={participating || undefined} disabled={network.phase !== 'online' || network.busy !== undefined} type="button" onClick={() => {
              void (participating ? leaveNetworkHall() : joinNetworkHall(localProfile))
            }}>{participating ? copy.leaveQueue : copy.joinQueue}</button>
          </div>
          <div className="hb-section-head"><span className="hb-section-title">{copy.meshChat}</span><span className="hb-section-note">{copy.signedEvents(network.room?.messages.length ?? 0)}</span></div>
          {evidenceCopied && <div className="hb-evidence-copied" role="status">{copy.evidenceCopied}</div>}
          <MeshMessages messages={network.room?.messages ?? []} profiles={network.room?.profiles ?? {}} avatars={network.room?.avatars ?? {}} blockedPeers={blockedPeers} language={language} onBlock={blockPeer} onEvidence={eventId => { void copyEvidence(eventId) }} />
        </> : <div className="hb-empty-room">
          <div><div className="hb-empty-mark">◇</div>{copy.lockedRoom}<br />{copy.p2pComing}</div>
        </div>}
      </div>

      {roomId === 'hall' && <footer className="hb-compose">
        <div className="hb-compose-box">
          <textarea value={draft} maxLength={HALL_RULES.maxMessageLength} disabled={!localSeated} placeholder={localSeated ? copy.seatedPlaceholder : copy.audiencePlaceholder} onChange={event => { setDraft(event.target.value) }} onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() }
          }} />
          <button className="hb-send" type="button" disabled={!localSeated || draft.trim() === ''} onClick={() => { void send() }}>{copy.send}</button>
        </div>
        <div className="hb-compose-hint"><span>{copy.zeroModel}</span><span>{draft.length}/{HALL_RULES.maxMessageLength}</span></div>
      </footer>}
    </aside>
  </div>
}
