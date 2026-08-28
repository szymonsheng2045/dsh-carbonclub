import { multiaddr } from '@multiformats/multiaddr'
import { peerIdFromString } from '@libp2p/peer-id'
import { publicKeyFromProtobuf, publicKeyToProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPublicKey } from '@libp2p/peer-id'
import type { InvitePayload } from './types.js'
import type { CarbonPrivateKey } from './identity.js'

const PREFIX = 'carbon1.'
const MAX_CODE_LENGTH = 16_384
const MAX_ADDRESSES = 4
const encoder = new TextEncoder()

type UnsignedInvitePayload = Omit<InvitePayload, 'publicKey' | 'signature'>

function canonicalInviteBytes(payload: UnsignedInvitePayload): Uint8Array {
  return encoder.encode(JSON.stringify({
    version: payload.version, roomId: payload.roomId, peerId: payload.peerId,
    addresses: payload.addresses, issuedAt: payload.issuedAt, expiresAt: payload.expiresAt,
  }))
}

export function assertDialAddress(address: string, expectedPeerId: string): void {
  if (address.length > 512) throw new Error('Invalid invite address')
  try {
    peerIdFromString(expectedPeerId)
  } catch (cause) {
    throw new Error('Invalid invite peer identity', { cause })
  }
  const parsed = multiaddr(address)
  const components = parsed.getComponents()
  const names = components.map(component => component.name)
  const isWebSocketBase = ['ip4', 'ip6', 'dns4', 'dns6'].includes(names[0]!)
    && names[1] === 'tcp' && ['ws', 'wss'].includes(names[2]!) && names[3] === 'p2p'
  const direct = names.length === 4 && isWebSocketBase
  const relayed = names.length === 6 && isWebSocketBase && names[4] === 'p2p-circuit' && names[5] === 'p2p'
  const identityComponent = relayed ? components[5] : components[3]
  if ((!direct && !relayed) || identityComponent?.value !== expectedPeerId) throw new Error('Invite address must be a direct or relayed WebSocket libp2p endpoint bound to its peer identity')
  const port = Number(components[1]?.value)
  if (!Number.isInteger(port) || port < 1_024 || port > 65_535) throw new Error('Invite address uses a disallowed port')
  const host = components[0]?.value?.toLowerCase()
  if (host === undefined || host === '0.0.0.0' || host === '::' || host === '255.255.255.255' || host === 'localhost' || host.endsWith('.localhost')) throw new Error('Invite address is not dialable')
  if (names[0] === 'ip4') {
    const first = Number(host.split('.')[0])
    if ((first >= 224 && first <= 239) || host.startsWith('169.254.')) throw new Error('Invite address uses multicast or link-local IP space')
  }
  if (names[0] === 'ip6' && (host.startsWith('ff') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb'))) throw new Error('Invite address uses multicast or link-local IP space')
}

function assertPayload(value: unknown, now: number): asserts value is InvitePayload {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid Carbon Club invite')
  const candidate = value as Partial<InvitePayload>
  if (candidate.version !== 1 || candidate.roomId !== 'hall') throw new Error('Unsupported Carbon Club invite')
  if (typeof candidate.peerId !== 'string' || candidate.peerId.length < 16 || candidate.peerId.length > 160) throw new Error('Invalid invite peer identity')
  if (!Array.isArray(candidate.addresses) || candidate.addresses.length === 0 || candidate.addresses.length > MAX_ADDRESSES) throw new Error('Invite has no usable addresses')
  if (typeof candidate.issuedAt !== 'number' || typeof candidate.expiresAt !== 'number' || candidate.expiresAt <= candidate.issuedAt) throw new Error('Invalid invite lifetime')
  if (typeof candidate.publicKey !== 'string' || candidate.publicKey.length > 512 || typeof candidate.signature !== 'string' || candidate.signature.length > 512) throw new Error('Invalid invite signature')
  if (candidate.expiresAt < now) throw new Error('Carbon Club invite has expired')
  if (candidate.expiresAt - candidate.issuedAt > 24 * 60 * 60 * 1_000) throw new Error('Invite lifetime is too long')
  for (const address of candidate.addresses) {
    if (typeof address !== 'string') throw new Error('Invalid invite address')
    assertDialAddress(address, candidate.peerId)
  }
}

export function encodeInvite(payload: InvitePayload): string {
  return `${PREFIX}${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

export async function signInvite(privateKey: CarbonPrivateKey, payload: UnsignedInvitePayload): Promise<InvitePayload> {
  const publicKey = Buffer.from(publicKeyToProtobuf(privateKey.publicKey)).toString('base64')
  if (peerIdFromPublicKey(privateKey.publicKey).toString() !== payload.peerId) throw new Error('Invite identity does not match signing key')
  const signature = Buffer.from(await privateKey.sign(canonicalInviteBytes(payload))).toString('base64')
  return { ...payload, publicKey, signature }
}

export async function decodeInvite(code: string, now = Date.now()): Promise<InvitePayload> {
  const normalized = code.trim()
  if (!normalized.startsWith(PREFIX) || normalized.length > MAX_CODE_LENGTH) throw new Error('Invalid Carbon Club invite')
  let value: unknown
  try {
    value = JSON.parse(Buffer.from(normalized.slice(PREFIX.length), 'base64url').toString('utf8'))
  } catch {
    throw new Error('Invalid Carbon Club invite')
  }
  assertPayload(value, now)
  let publicKey
  try { publicKey = publicKeyFromProtobuf(Buffer.from(value.publicKey, 'base64')) } catch (cause) { throw new Error('Invalid invite public key', { cause }) }
  if (peerIdFromPublicKey(publicKey).toString() !== value.peerId) throw new Error('Invite public key does not match its peer identity')
  const { publicKey: _publicKey, signature: _signature, ...unsigned } = value
  if (!await publicKey.verify(canonicalInviteBytes(unsigned), Buffer.from(value.signature, 'base64'))) throw new Error('Invite signature verification failed')
  return value
}
