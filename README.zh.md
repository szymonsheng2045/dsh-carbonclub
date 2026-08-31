# 碳基会所

[English](./README.md) | 中文

碳基会所（`dsh-human-buffer`）是嵌入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的真人聊天室。它待在 Agent 工作区旁边，但不会进入 Agent 的提示词、记忆、会话或转录内容。

> 蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。

## 开发者预览

`0.5.0-beta.2` 面向当前 DSH 开发者预览版（`0.1.1-rc.2`），首版提供一个签名公共大厅：最多 500 个活跃身份，八个发言席。

- 嵌入 DSH Web 界面的响应式、可调宽侧栏。
- 八席确定性排队；单次坐席五分钟，并有空闲让位、冷却、慢速和防连麦霸屏规则。
- 持久 Ed25519 DSH 身份、签名房间事件、防重放和确定性状态推导。
- 局域网发现、直连邀请、已知节点、社区 bootstrap、Circuit Relay v2、AutoNAT 与 DCUtR。
- 客户端维持小型 GossipSub 网格，志愿路由节点承担较高扇出，避免 500 人全互连。
- 内容寻址头像、紧凑队列预览、本地屏蔽和签名证据导出。
- 零模型调用：会所通信始终位于 AI 上下文边界之外。
- 中英文界面切换。

项目协作、夜猫子、算力潮汐和低龄房间目前只展示路线图。低龄房间在独立儿童安全与法律审查完成前保持关闭。

## 安装

将预构建 Release 包安装进 DSH profile，无需授权安装期构建脚本：

```sh
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.0-beta.2/dsh-human-buffer-0.5.0-beta.2.tgz
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.0-beta.2.tgz
dsh --profile carbon-club web
```

源码开发：

```sh
git clone https://github.com/szymonsheng2045/dsh-carbonclub.git
cd dsh-carbonclub
pnpm install
pnpm check
dsh plugin --profile carbon-club-dev add .
dsh --profile carbon-club-dev web
```

仓库会提交 `lib/`，因此从 GitHub 安装时已有入口构建产物。公开测试建议优先使用 Release 压缩包，或锁定具体 commit。

## 社区联网

碳基会所没有强制中心服务。局域网节点直接发现；跨公网群组连接由社区分别运营的 bootstrap/relay。首台志愿 Mac 中继现可用于邀请测试：

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay.laozi.art/tcp/443/wss/p2p/12D3KooWLdvJF8g2gt5j7qhrJHtbharz1Tv8dguzUoTt8Saz8uHU' dsh --profile carbon-club web
```

中继只负责发现、字节转发和已签名事件的有界内存缓存，不持有账号库、审核权或永久历史。500 人大厅应至少使用三个独立运营的 WSS 节点，并按 50、100、250、500 人逐级压测。

这台志愿 Mac 只是可替换的首发节点，不承诺可用性，也不等同于计划中的三节点公开拓扑。原 A2A 子域名目前只作为临时回滚别名保留；新客户端应使用 `relay.laozi.art`，并禁止在 A2A 域名下新增碳基会所基础设施。详见[基础设施边界](./docs/INFRASTRUCTURE-BOUNDARIES.md)、[社区节点](./docs/COMMUNITY-NODES.md)、[社区中继运维](./docs/OPERATING-A-RELAY.md)、[协议 0.5](./docs/PROTOCOL.md)、[500 人容量预算](./docs/CAPACITY-500.md)和[公开测试门槛](./docs/PUBLIC-BETA-CHECKLIST.md)。

## 隐私与安全

公共大厅文字对网格参与者公开。Noise 保护传输跳点，但不等于公共房间端到端保密。中继运营者仍可观察 Peer ID、网络地址、时间和流量。上一个会话备注默认关闭，只有明确同意后才发送。

漏洞请通过 [GitHub 私密漏洞报告](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new)提交。邀请不受信任的公开用户前，请先阅读[安全政策](./SECURITY.zh.md)和[审查诊断契约](./docs/SECURITY-REVIEW.zh.md)。

## 社区与支持

构想和节点协作请使用 [GitHub Discussions](https://github.com/szymonsheng2045/dsh-carbonclub/discussions)，可复现缺陷请使用 [GitHub Issues](https://github.com/szymonsheng2045/dsh-carbonclub/issues)。仓库的 `dsh-plugin` topic 用于进入 DSH 插件生态发现入口。

## 参与贡献

参见 [CONTRIBUTING.zh.md](./CONTRIBUTING.zh.md)。协议变更必须补充对抗测试；线协议不兼容时必须升级版本化 topic。

## 许可证

[MIT](./LICENSE)
