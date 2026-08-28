import { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf } from '@libp2p/crypto/keys'
import { credentialRef, type CredentialProvider } from '@deepseek-ai/dsh-credentials'

export const IDENTITY_CREDENTIAL = credentialRef('DSH_CARBON_CLUB_PRIVATE_KEY')
export const KNOWN_PEERS_CREDENTIAL = credentialRef('DSH_CARBON_CLUB_KNOWN_PEERS')
export type CarbonPrivateKey = Awaited<ReturnType<typeof generateKeyPair>>

export interface RememberedPeer {
  readonly peerId: string
  readonly addresses: readonly string[]
  readonly rememberedAt: number
}

export async function loadOrCreatePrivateKey(credentials: CredentialProvider): Promise<CarbonPrivateKey> {
  const stored = await credentials.resolve(IDENTITY_CREDENTIAL)
  if (stored !== undefined) {
    try {
      return privateKeyFromProtobuf(Buffer.from(stored.value, 'base64'))
    } catch (cause) {
      throw new Error('Stored Carbon Club identity is invalid', { cause })
    }
  }

  const privateKey = await generateKeyPair('Ed25519')
  await credentials.set(IDENTITY_CREDENTIAL, Buffer.from(privateKeyToProtobuf(privateKey)).toString('base64'))
  return privateKey
}

export async function loadRememberedPeers(credentials: CredentialProvider): Promise<readonly RememberedPeer[]> {
  const stored = await credentials.resolve(KNOWN_PEERS_CREDENTIAL)
  if (stored === undefined) return []
  try {
    const value: unknown = JSON.parse(stored.value)
    if (!Array.isArray(value)) return []
    return value.flatMap(candidate => {
      if (typeof candidate !== 'object' || candidate === null) return []
      const peer = candidate as Partial<RememberedPeer>
      if (typeof peer.peerId !== 'string' || !Array.isArray(peer.addresses) || !Number.isSafeInteger(peer.rememberedAt)) return []
      const addresses = peer.addresses.filter((address): address is string => typeof address === 'string').slice(0, 4)
      return addresses.length === 0 ? [] : [{ peerId: peer.peerId, addresses, rememberedAt: peer.rememberedAt! }]
    }).sort((left, right) => right.rememberedAt - left.rememberedAt).slice(0, 32)
  } catch {
    return []
  }
}

export async function saveRememberedPeers(credentials: CredentialProvider, peers: readonly RememberedPeer[]): Promise<void> {
  await credentials.set(KNOWN_PEERS_CREDENTIAL, JSON.stringify([...peers]
    .sort((left, right) => right.rememberedAt - left.rememberedAt)
    .slice(0, 32)))
}
