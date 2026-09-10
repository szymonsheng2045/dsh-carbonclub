import type { Language } from './i18n.js'
import { NETWORK_HALL_RULES } from '../network/hall-rules.js'

export const SEAT_WARNING_MS = 30_000
const idleSeconds = NETWORK_HALL_RULES.idleMs / 1_000
const warningSeconds = SEAT_WARNING_MS / 1_000
const leaseMinutes = NETWORK_HALL_RULES.maxLeaseMs / 60_000

export type RoomId = 'hall' | 'project' | 'night' | 'tide' | 'dimension'

export interface RoomDefinition {
  readonly id: RoomId
  readonly shortName: string
  readonly name: string
  readonly description: string
  readonly status: string
  readonly rules: readonly string[]
}

interface LocalizedRoom {
  readonly id: RoomId
  readonly zh: Omit<RoomDefinition, 'id'>
  readonly en: Omit<RoomDefinition, 'id'>
}

const CATALOG: readonly LocalizedRoom[] = [
  {
    id: 'hall',
    zh: { shortName: '大厅', name: '碳基会所', description: '蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。', status: `${NETWORK_HALL_RULES.capacity} 人上限 · ${NETWORK_HALL_RULES.seatCount} 席`, rules: [`${idleSeconds - warningSeconds} 秒不发言会提醒`, `再过 ${warningSeconds} 秒自动递补`, `单次坐席最多 ${leaseMinutes} 分钟`] },
    en: { shortName: 'Lobby', name: 'Carbon Club', description: 'Kick back while DSH works. Eight people talk; everyone else watches and queues.', status: `${NETWORK_HALL_RULES.capacity}-person limit · ${NETWORK_HALL_RULES.seatCount} seats`, rules: [`Reminder after ${idleSeconds - warningSeconds} idle seconds`, `Rotation ${warningSeconds} seconds later`, `Maximum seat time: ${leaseMinutes} minutes`] },
  },
  {
    id: 'project',
    zh: { shortName: '搭子', name: '项目搭子间', description: '按项目临时结伴，只聊正在推进的一件事。', status: '6 席 · 项目制', rules: ['一个房间只挂一个项目', '先报目标再发言', '默认不上传仓库内容'] },
    en: { shortName: 'Crew', name: 'Project Crew', description: 'Team up around one project and keep the room focused on the task at hand.', status: '6 seats · Project room', rules: ['One project per room', 'State the goal before speaking', 'Repository content stays local by default'] },
  },
  {
    id: 'night',
    zh: { shortName: '夜航', name: '夜猫子候车室', description: '计划按指定时区 22:00–04:00 开灯，适合低频陪伴。', status: '房型规划中', rules: ['计划 10 席低频慢聊', '计划 60 秒慢速模式', '天亮结束场次，不承诺永久历史'] },
    en: { shortName: 'Night', name: 'Night Owl Lounge', description: 'Planned for 22:00–04:00 in a stated room timezone, for low-key company.', status: 'Planned', rules: ['Planned: 10 low-frequency seats', 'Planned: 60-second slow mode', 'Sessions end at dawn; no permanent history promised'] },
  },
  {
    id: 'tide',
    zh: { shortName: '潮汐', name: '算力潮汐站', description: '根据模型忙闲与价格信号聚散，忙时吐槽，闲时散场。', status: '数据源待接入', rules: ['只展示公开价格信号', '不读取对话或账单', '状态由多节点签名确认'] },
    en: { shortName: 'Tide', name: 'Compute Tide Station', description: 'Gather when models are busy or costly; drift away when capacity returns.', status: 'Data source pending', rules: ['Public pricing signals only', 'Never reads chats or bills', 'Status confirmed by multiple nodes'] },
  },
  {
    id: 'dimension',
    zh: { shortName: '次元', name: '多次元安全舱', description: '低龄房型概念预告；完成儿童安全与合规审查前不会开放。', status: '尚待独立审查', rules: ['预设主题和有限反应', '禁止私聊与外链', '需独立儿童安全审核'] },
    en: { shortName: 'Worlds', name: 'Multiverse Safe Pod', description: 'Concept preview only; it will stay closed pending child-safety and compliance review.', status: 'Independent review not yet arranged', rules: ['Preset topics and limited reactions', 'No DMs or external links', 'Independent child-safety review required'] },
  },
]

export function roomsFor(language: Language): readonly RoomDefinition[] {
  return CATALOG.map(room => ({ id: room.id, ...room[language] }))
}

export const ROOMS = roomsFor('zh')
