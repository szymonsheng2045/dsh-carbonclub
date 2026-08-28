import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-credentials'
import { loadOrCreatePrivateKey, loadRememberedPeers, saveRememberedPeers } from './network/identity.js'
import { CarbonClubNode } from './network/node.js'
import type { ConnectResult, EvidenceBundle, InviteInfo, NetworkStatus, PostRoomMessageInput, RoomDelta, RoomMessage, RoomProfile, RoomSnapshot } from './network/types.js'

export const name = 'dsh-human-buffer'
export const inject = ['credentials']

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function markRemote(service: CarbonClubService, method: 'status' | 'createInvite' | 'connect' | 'roomSnapshot' | 'roomDelta' | 'evidence' | 'joinHall' | 'leaveHall' | 'postRoomMessage'): void {
  const decorator = Remote(method)
  decorator(service[method] as never, {
    kind: 'method', name: method, static: false, private: false,
    access: { has: object => method in object, get: object => object[method] },
    addInitializer: initializer => { initializer.call(service) },
  } as ClassMethodDecoratorContext<CarbonClubService, never>)
}

export class CarbonClubService extends TypertRemoteService {
  static inject = ['credentials']
  private node?: CarbonClubNode
  private initError?: string
  private readonly ready: Promise<void>

  constructor(ctx: Context) {
    super(ctx, 'carbonClub')
    markRemote(this, 'status')
    markRemote(this, 'createInvite')
    markRemote(this, 'connect')
    markRemote(this, 'roomSnapshot')
    markRemote(this, 'roomDelta')
    markRemote(this, 'evidence')
    markRemote(this, 'joinHall')
    markRemote(this, 'leaveHall')
    markRemote(this, 'postRoomMessage')
    this.ready = this.initialize()
    ctx.effect(() => () => this.node?.stop(), 'carbon-club: stop libp2p node')
  }

  async status(): Promise<NetworkStatus> {
    await this.ready
    if (this.node === undefined) return {
      phase: 'error', addresses: [], connectedPeers: 0, discoveredPeers: 0, bootstrapConfigured: 0, relayAddresses: 0,
      error: this.initError ?? 'Carbon Club node failed to start',
    }
    return this.node.status()
  }

  async createInvite(): Promise<InviteInfo> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.createInvite()
  }

  async connect(code: string): Promise<ConnectResult> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.connect(code)
  }

  async roomSnapshot(): Promise<RoomSnapshot> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.roomSnapshot()
  }

  async roomDelta(cursor: number): Promise<RoomDelta> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.roomDelta(cursor)
  }

  async evidence(eventId: string): Promise<EvidenceBundle> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.evidence(eventId)
  }

  async joinHall(profile: RoomProfile): Promise<RoomSnapshot> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.joinHall(profile)
  }

  async leaveHall(): Promise<RoomSnapshot> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.leaveHall()
  }

  async postRoomMessage(input: PostRoomMessageInput): Promise<RoomMessage> {
    await this.ready
    if (this.node === undefined) throw new Error(this.initError ?? 'Carbon Club node failed to start')
    return this.node.publishHallMessage(input)
  }

  private async initialize(): Promise<void> {
    try {
      const privateKey = await loadOrCreatePrivateKey(this.ctx.credentials)
      const rememberedPeers = await loadRememberedPeers(this.ctx.credentials)
      const node = new CarbonClubNode(privateKey, {
        rememberedPeers,
        persistRememberedPeers: peers => saveRememberedPeers(this.ctx.credentials, peers),
        bootstrapAddresses: (process.env.DSH_CARBON_CLUB_BOOTSTRAP ?? '').split(',').map(value => value.trim()).filter(value => value.length > 0).slice(0, 8),
      })
      this.node = node
      await node.start()
    } catch (error) {
      this.initError = errorMessage(error)
    }
  }
}

export function apply(ctx: Context): void {
  new CarbonClubService(ctx)
}

export { RoomEventLedger, signPresenceEvent, signRoomEvent, signSyncRequest, verifyRoomEvent } from './network/room-events.js'
export { createProjectInvite, decodeProjectInvite, decryptProjectPayload, encodeProjectInvite, encryptProjectPayload, rotateProjectInvite } from './network/project-crypto.js'
export { HALL_SYNC_PROTOCOL, HALL_TOPIC } from './network/node.js'
export { CarbonClubNode } from './network/node.js'
