# 碳基会所

[English](./README.md) | 中文

碳基会所（`dsh-human-buffer`）是嵌入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的真人聊天室。它待在 Agent 工作区旁边，但不会进入 Agent 的提示词、记忆、会话或转录内容。

> 蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。

## 当前版本

**v0.6.8** 已发布。相比 0.5.1-beta.1：面向当前 DSH 开发者预览版，并修复了一轮独立审查确认的缺陷——单向分区后无法自愈的 presence、`start()/stop()` 竞态导致的 checkpoint 定时器泄漏、缺失的两个远程契约方法、未校验的中继资源上限、remembered peers 容量不一致、新会话页没有入口、输入法 Esc 误关抽屉、未翻译的宿主错误、语言首屏闪动。大厅协议仍为 0.5.1，因此 0.6.8 与 0.5.1-beta.1 客户端可同处一个大厅；0.5.0 并存与回退路径见[升级与回退指引](./docs/UPGRADING-0.5.1.zh.md)。

`0.6.8` 面向当前 DSH 开发者预览版（`0.1.5-rc.1`），提供一个签名公共大厅：最多 500 个活跃身份，八个发言席。

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
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.6.8/dsh-human-buffer-0.6.8.tgz
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.6.8.tgz
# dsh rc 给自定义 profile 只装 @deepseek-ai/dsh-base，没有应用层，直接启动会空转无输出；
# 在 profile 的 package.json 里补入 Web 应用层（幂等一行命令）：
node -e "const fs=require('fs'),os=require('os'),p=(process.env.DSH_HOME??os.homedir()+'/.dsh')+'/profiles/carbon-club/package.json',m=JSON.parse(fs.readFileSync(p,'utf8')),b=m.dsh.profile.bundles;if(!b.includes('@deepseek-ai/dsh-web-app'))b.splice(1,0,'@deepseek-ai/dsh-web-app');fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n')"
dsh --profile carbon-club
```

注意：`dsh --profile carbon-club web` 会被启动器拒绝（`web` 是内置 web profile 的别名）；`--host`、`--port`、`--no-open` 等应用参数直接跟在 profile 名之后。

源码开发：

```sh
git clone https://github.com/szymonsheng2045/dsh-carbonclub.git
cd dsh-carbonclub
pnpm install
pnpm check
dsh plugin --profile carbon-club-dev add .
node -e "const fs=require('fs'),os=require('os'),p=(process.env.DSH_HOME??os.homedir()+'/.dsh')+'/profiles/carbon-club-dev/package.json',m=JSON.parse(fs.readFileSync(p,'utf8')),b=m.dsh.profile.bundles;if(!b.includes('@deepseek-ai/dsh-web-app'))b.splice(1,0,'@deepseek-ai/dsh-web-app');fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n')"
dsh --profile carbon-club-dev
```

仓库会提交 `lib/`，因此从 GitHub 安装时已有入口构建产物。公开测试建议优先使用 Release 压缩包，或锁定具体 commit。

## 社区联网

碳基会所没有强制中心服务。局域网节点直接发现；跨公网群组连接由社区分别运营的 bootstrap/relay。首台志愿 Mac 中继（0.5.1）现可用于公开测试：

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club
```

> 这个变量只能来自启动环境。`dsh` 把它归为 bootstrap-only：**任何 `.env` 层（含
> `$DSH_HOME/.env`）设置它都会让 dsh 直接拒绝启动**。请在 shell 里 export（写进
> `~/.zshrc` 即可），这也是会所无需包装脚本就能连上公共大厅的方式。

```sh
```

0.5.0 旧入口 `relay.laozi.art` 在过渡窗口内继续为旧版客户端服务（不少于两周）；0.5.0 客户端回退指引见[升级与回退指引](./docs/UPGRADING-0.5.1.zh.md)。

中继只负责发现、字节转发和已签名事件的有界内存缓存，不持有账号库、审核权或永久历史。500 人大厅应至少使用三个独立运营的 WSS 节点，并按 50、100、250、500 人逐级压测。

这台志愿 Mac 只是可替换的首发节点，不承诺可用性，也不等同于计划中的三节点公开拓扑。原 A2A 子域名目前只作为临时回滚别名保留；新客户端应使用 `relay.laozi.art`，并禁止在 A2A 域名下新增碳基会所基础设施。详见[基础设施边界](./docs/INFRASTRUCTURE-BOUNDARIES.md)、[社区节点](./docs/COMMUNITY-NODES.md)、[社区中继运维](./docs/OPERATING-A-RELAY.md)、[协议 0.5](./docs/PROTOCOL.md)、[500 人容量预算](./docs/CAPACITY-500.md)和[公开测试门槛](./docs/PUBLIC-BETA-CHECKLIST.md)。

## 隐私与安全

公共大厅文字对网格参与者公开。Noise 保护传输跳点，但不等于公共房间端到端保密。中继运营者仍可观察 Peer ID、网络地址、时间和流量。上一个会话备注默认关闭，只有明确同意后才发送。

漏洞请通过 [GitHub 私密漏洞报告](https://github.com/szymonsheng2045/dsh-carbonclub/security/advisories/new)或邮件 szymonsheng2045@gmail.com 提交。邀请不受信任的公开用户前，请先阅读[安全政策](./SECURITY.zh.md)和[审查诊断契约](./docs/SECURITY-REVIEW.zh.md)。

## 社区与支持

构想和节点协作请使用 [GitHub Discussions](https://github.com/szymonsheng2045/dsh-carbonclub/discussions)，可复现缺陷请使用 [GitHub Issues](https://github.com/szymonsheng2045/dsh-carbonclub/issues)，运营与举报事务请联系 szymonsheng2045@gmail.com。仓库的 `dsh-plugin` topic 用于进入 DSH 插件生态发现入口。

## 参与贡献

参见 [CONTRIBUTING.zh.md](./CONTRIBUTING.zh.md)。协议变更必须补充对抗测试；线协议不兼容时必须升级版本化 topic。

## 许可证

[MIT](./LICENSE)
