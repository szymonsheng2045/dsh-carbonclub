import type { Language } from './i18n.js'

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
    zh: { shortName: '大厅', name: '碳基会所', description: '蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。', status: '500 人 · 8 席', rules: ['2 分钟不发言会提醒', '30 秒后自动递补', '单次坐席最多 5 分钟'] },
    en: { shortName: 'Lobby', name: 'Carbon Club', description: 'Kick back while DSH works. Eight people talk; everyone else watches and queues.', status: '500 people · 8 seats', rules: ['Reminder after 2 idle minutes', 'Automatic rotation after 30 seconds', 'Maximum seat time: 5 minutes'] },
  },
  {
    id: 'project',
    zh: { shortName: '搭子', name: '项目搭子间', description: '按项目临时结伴，只聊正在推进的一件事。', status: '6 席 · 项目制', rules: ['一个房间只挂一个项目', '先报目标再发言', '默认不上传仓库内容'] },
    en: { shortName: 'Crew', name: 'Project Crew', description: 'Team up around one project and keep the room focused on the task at hand.', status: '6 seats · Project room', rules: ['One project per room', 'State the goal before speaking', 'Repository content stays local by default'] },
  },
  {
    id: 'night',
    zh: { shortName: '夜航', name: '夜猫子候车室', description: '本地时间 22:00–04:00 开灯，适合低频陪伴。', status: '夜间开放', rules: ['10 席低频慢聊', '60 秒慢速模式', '天亮自动封存当夜记录'] },
    en: { shortName: 'Night', name: 'Night Owl Lounge', description: 'Open from 22:00–04:00 local time for low-key late-night company.', status: 'Open at night', rules: ['10 seats for low-frequency chat', '60-second slow mode', 'Nightly log seals at dawn'] },
  },
  {
    id: 'tide',
    zh: { shortName: '潮汐', name: '算力潮汐站', description: '根据模型忙闲与价格信号聚散，忙时吐槽，闲时散场。', status: '数据源待接入', rules: ['只展示公开价格信号', '不读取对话或账单', '状态由多节点签名确认'] },
    en: { shortName: 'Tide', name: 'Compute Tide Station', description: 'Gather when models are busy or costly; drift away when capacity returns.', status: 'Data source pending', rules: ['Public pricing signals only', 'Never reads chats or bills', 'Status confirmed by multiple nodes'] },
  },
  {
    id: 'dimension',
    zh: { shortName: '次元', name: '多次元安全舱', description: '低龄房型概念预告；完成儿童安全与合规审查前不会开放。', status: '合规审查中', rules: ['预设主题和有限反应', '禁止私聊与外链', '需独立儿童安全审核'] },
    en: { shortName: 'Worlds', name: 'Multiverse Safe Pod', description: 'Concept preview only; it will stay closed pending child-safety and compliance review.', status: 'Compliance review', rules: ['Preset topics and limited reactions', 'No DMs or external links', 'Independent child-safety review required'] },
  },
]

export function roomsFor(language: Language): readonly RoomDefinition[] {
  return CATALOG.map(room => ({ id: room.id, ...room[language] }))
}

export const ROOMS = roomsFor('zh')
