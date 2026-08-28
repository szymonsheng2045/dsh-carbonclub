import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto'

const INVITE_PREFIX = 'carbon-project1.'
const MAX_INVITE_LENGTH = 2_048
const MAX_PLAINTEXT_BYTES = 32_768

export interface ProjectRoomInvite {
  readonly version: 1
  readonly roomId: string
  readonly secret: string
  readonly epoch: number
  readonly issuedAt: number
}

export interface EncryptedProjectPayload {
  readonly version: 1
  readonly roomId: string
  readonly epoch: number
  readonly nonce: string
  readonly ciphertext: string
  readonly tag: string
}

function roomIdFor(secret: Uint8Array): string {
  return `project-${createHash('sha256').update(secret).digest('base64url').slice(0, 24)}`
}

function decodeSecret(invite: ProjectRoomInvite): Buffer {
  const secret = Buffer.from(invite.secret, 'base64url')
  if (secret.byteLength !== 32 || roomIdFor(secret) !== invite.roomId) throw new Error('Project-room invite secret is invalid')
  return secret
}

function epochKey(invite: ProjectRoomInvite, epoch: number): Buffer {
  if (!Number.isSafeInteger(epoch) || epoch < invite.epoch || epoch > invite.epoch + 1_000_000) throw new Error('Project-room epoch is invalid')
  return Buffer.from(hkdfSync('sha256', decodeSecret(invite), Buffer.from(invite.roomId), Buffer.from(`dsh-carbon-project:${epoch}`), 32))
}

function aad(roomId: string, epoch: number): Buffer {
  return Buffer.from(JSON.stringify({ protocol: 'dsh-carbon-project/1', roomId, epoch }))
}

export function createProjectInvite(now = Date.now()): ProjectRoomInvite {
  const secret = randomBytes(32)
  return { version: 1, roomId: roomIdFor(secret), secret: secret.toString('base64url'), epoch: 1, issuedAt: now }
}

export function encodeProjectInvite(invite: ProjectRoomInvite): string {
  decodeSecret(invite)
  return `${INVITE_PREFIX}${Buffer.from(JSON.stringify(invite)).toString('base64url')}`
}

export function decodeProjectInvite(code: string): ProjectRoomInvite {
  const normalized = code.trim()
  if (!normalized.startsWith(INVITE_PREFIX) || normalized.length > MAX_INVITE_LENGTH) throw new Error('Invalid project-room invite')
  let value: unknown
  try { value = JSON.parse(Buffer.from(normalized.slice(INVITE_PREFIX.length), 'base64url').toString('utf8')) } catch { throw new Error('Invalid project-room invite') }
  if (typeof value !== 'object' || value === null) throw new Error('Invalid project-room invite')
  const invite = value as Partial<ProjectRoomInvite>
  if (invite.version !== 1 || typeof invite.roomId !== 'string' || typeof invite.secret !== 'string' || !Number.isSafeInteger(invite.epoch) || (invite.epoch ?? 0) < 1 || !Number.isSafeInteger(invite.issuedAt) || (invite.issuedAt ?? 0) < 1) throw new Error('Invalid project-room invite')
  decodeSecret(invite as ProjectRoomInvite)
  return invite as ProjectRoomInvite
}

export function encryptProjectPayload(invite: ProjectRoomInvite, plaintext: string | Uint8Array, epoch = invite.epoch): EncryptedProjectPayload {
  const bytes = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : Buffer.from(plaintext)
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PLAINTEXT_BYTES) throw new Error('Project-room payload is empty or too large')
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', epochKey(invite, epoch), nonce)
  cipher.setAAD(aad(invite.roomId, epoch))
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()])
  return {
    version: 1, roomId: invite.roomId, epoch,
    nonce: nonce.toString('base64url'), ciphertext: ciphertext.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'),
  }
}

export function decryptProjectPayload(invite: ProjectRoomInvite, payload: EncryptedProjectPayload): Uint8Array {
  if (payload.version !== 1 || payload.roomId !== invite.roomId) throw new Error('Encrypted payload belongs to another project room')
  const nonce = Buffer.from(payload.nonce, 'base64url')
  const tag = Buffer.from(payload.tag, 'base64url')
  const ciphertext = Buffer.from(payload.ciphertext, 'base64url')
  if (nonce.byteLength !== 12 || tag.byteLength !== 16 || ciphertext.byteLength === 0 || ciphertext.byteLength > MAX_PLAINTEXT_BYTES + 32) throw new Error('Encrypted project-room payload is malformed')
  try {
    const decipher = createDecipheriv('aes-256-gcm', epochKey(invite, payload.epoch), nonce)
    decipher.setAAD(aad(payload.roomId, payload.epoch))
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch (cause) {
    throw new Error('Encrypted project-room payload failed authentication', { cause })
  }
}

export function rotateProjectInvite(previous: ProjectRoomInvite, now = Date.now()): ProjectRoomInvite {
  decodeSecret(previous)
  const next = createProjectInvite(now)
  return { ...next, epoch: previous.epoch + 1 }
}
