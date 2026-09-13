import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-cordis-client-runner/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { TYPERT_REMOTE } from '../typert.remote-client.js'
import { HumanBufferHeaderAction, HumanBufferOverlay } from './HumanBuffer.js'
import { bindNetworkRemote, refreshNetwork, type CarbonClubRemote } from './network-store.js'
import { STYLE_ID, styles } from './styles.js'

/**
 * The client slot registry face this plugin calls. DSH 0.1.5 types it on the root context
 * through the cordis client runner, whose declaration is not reachable from this package's
 * dependency set, so the club declares the two members it uses. Type-only: the framework
 * passes the real registry at runtime.
 */
interface ClientSlots {
  inject(name: string, factory: () => unknown): unknown
  register(entry: { readonly name: string; readonly id: string; readonly order?: number }, component: unknown): () => unknown
}
type ClientContext = Context & { readonly slots: ClientSlots }

export const inject = ['slots', 'remote']

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const unmount = await ctx.remote.$mount(TYPERT_REMOTE)
  const carbonClub = ctx.get('remote.carbonClub') as CarbonClubRemote | undefined
  if (carbonClub === undefined) {
    await unmount()
    throw new Error('Carbon Club Remote namespace did not mount')
  }
  const unbind = bindNetworkRemote(carbonClub)
  const timer = globalThis.setInterval(() => { void refreshNetwork() }, 3_000)

  ctx.effect(() => {
    const existing = document.getElementById(STYLE_ID)
    if (existing !== null) return () => {}
    const tag = document.createElement('style')
    tag.id = STYLE_ID
    tag.dataset.plugin = 'dsh-human-buffer'
    tag.textContent = styles
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'human-buffer: styles')

  ctx.slots.inject(
    'conversation.session.header.utilities',
    () => ctx.slots.register({
      name: 'conversation.session.header.utilities',
      id: 'human-buffer-trigger',
      order: 80,
    }, HumanBufferHeaderAction),
  )

  ctx.slots.inject(
    'shell.overlay',
    () => ctx.slots.register({
      name: 'shell.overlay',
      id: 'human-buffer-panel',
      order: 40,
    }, HumanBufferOverlay),
  )

  return async () => {
    globalThis.clearInterval(timer)
    unbind()
    await unmount()
  }
}
