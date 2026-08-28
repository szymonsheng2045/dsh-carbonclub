import { createHallState, type HallMember, type HallMessage, type HallState } from './hall-machine.js'

export const LOCAL_MEMBER_ID = 'local-human'

const MEMBERS: readonly HallMember[] = [
  { id: 'lin', name: '林间缓存', color: '#7c9a73', lastCompletedSession: '修复登录态闪退' },
  { id: 'teapot', name: '茶壶冒泡', color: '#c78662', lastCompletedSession: '整理 API 文档' },
  { id: 'bug', name: '捉虫的人', color: '#748fb8', lastCompletedSession: '支付边界测试' },
  { id: 'moon', name: '月亮没提交', color: '#9a7faf', lastCompletedSession: '首页动效收尾' },
  { id: 'shell', name: '终端贝壳', color: '#5f9f91', lastCompletedSession: 'CLI 发布检查' },
  { id: 'noodle', name: '面条编译中', color: '#b99557', lastCompletedSession: '构建缓存提速' },
  { id: 'cat', name: '猫在审查', color: '#a66f79', lastCompletedSession: 'PR #42 复核' },
  { id: 'pixel', name: '像素旅客', color: '#7288a8', lastCompletedSession: '移动端适配' },
  { id: 'rain', name: '小雨排队', color: '#5f91ad', lastCompletedSession: '错误提示改版' },
  { id: 'coffee', name: '冷咖啡', color: '#8f765f', lastCompletedSession: '数据库迁移预演' },
  { id: 'paper', name: '纸飞机', color: '#958e6b', lastCompletedSession: '用户访谈摘要' },
  { id: LOCAL_MEMBER_ID, name: '你 · 本机人类', color: '#4f7cff' },
]

function message(id: string, memberId: string, body: string, sentAt: number): HallMessage {
  return { id, memberId, body, sentAt, kind: 'message' }
}

export function createDemoState(now: number): HallState {
  const state = createHallState({
    now,
    members: MEMBERS,
    seated: ['lin', 'teapot', 'bug', 'moon', 'shell', 'noodle', 'cat', 'pixel'],
    queue: ['rain', 'coffee', 'paper'],
    audience: [LOCAL_MEMBER_ID],
    messages: [
      message('m-1', 'teapot', '我的 Agent 已经查资料七分钟了，我决定先喝口水。', now - 64_000),
      message('m-2', 'bug', '同款等待。刚才它终于自己发现了那个边界条件。', now - 47_000),
      message('m-3', 'moon', '这里像机场贵宾厅，但大家的航班都是一次构建。', now - 29_000),
      message('m-4', 'shell', '建议广播：请勿催促正在思考的硅基同事。', now - 11_000),
    ],
  })
  const seats = state.seats.map((seat, index) => {
    if (seat === null) return null
    if (index === 7) return { ...seat, lastSpokeAt: now - 115_000 }
    return { ...seat, seatedAt: now - index * 20_000, lastSpokeAt: now - index * 9_000 }
  })
  return { ...state, seats }
}
