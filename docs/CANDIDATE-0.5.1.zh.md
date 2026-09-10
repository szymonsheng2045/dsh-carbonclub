# 0.5.1-beta.1 候选版与迁移说明

0.5.1-beta.1 已发布；本文保留候选期的协议变更说明与验收背景。候选压缩包与 SHA-256 清单位于构建目录 `artifacts/candidate-0.5.1-beta.1/`（不进安装包）。内部验收记录不随安装包分发；对外以正式 Release 的版本和验收摘要为准。升级与回退操作见[升级与回退指引](./UPGRADING-0.5.1.zh.md)。

## 为什么升级协议

旧状态机在多人同刻离线时，可能把已经过期的候位者递补入席，再施加本不该有的席位冷却。修复会改变同一事件集的结果，不能在原 topic 内悄悄替换。

候选大厅使用 `/dsh-human-buffer/room/hall/0.5.1`，同步使用 `/dsh-human-buffer/sync/hall/0.5.1`。公开 0.5.0 用户不会自动迁入。新邀请使用 carbon2 格式，签名包含大厅协议版本；旧 carbon1 邀请及不同大厅版本在拨号前直接拒绝，并显示中英文版本不兼容提示。双方升级后必须重新生成邀请。协议声明不是对端行为的安全认证；手动配置 bootstrap 仍须由运营者核验其协议。

## 本地安装

先核对压缩包与同目录 SHA-256 清单。不要下载 README 旧版 Release 链接来验收新功能。

```sh
dsh plugin --profile carbon-club-candidate add /绝对路径/dsh-human-buffer-0.5.1-beta.1.tgz --ignore-scripts
# 自定义 profile 默认只含 dsh-base，需补入 Web 应用层，否则启动空转（幂等一行命令）：
node -e "const fs=require('fs'),os=require('os'),p=(process.env.DSH_HOME??os.homedir()+'/.dsh')+'/profiles/carbon-club-candidate/package.json',m=JSON.parse(fs.readFileSync(p,'utf8')),b=m.dsh.profile.bundles;if(!b.includes('@deepseek-ai/dsh-web-app'))b.splice(1,0,'@deepseek-ai/dsh-web-app');fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n')"
DSH_CARBON_CLUB_LOCAL_ONLY=1 DSH_CARBON_CLUB_BOOTSTRAP='' DSH_TELEMETRY_DISABLED=1 dsh --profile carbon-club-candidate --host 127.0.0.1 --no-open
```

注意：`dsh --profile <名称> web` 会被启动器拒绝；应用参数直接跟在 profile 名之后。该启动流程已在 dsh 0.1.1-rc.2 上实测通过。

`DSH_CARBON_CLUB_LOCAL_ONLY=1` 只改变监听地址为回环并关闭 mDNS；不是出站防火墙。若配置了公网 bootstrap、已记住公网节点，或主动粘贴公网邀请，仍可能出站。因此严格隔离测试使用全新 `DSH_HOME`、空 bootstrap 和本机邀请。不要在日常 profile 上做断线/清理试验。

候选安装不需要填写模型 Key 来测试聊天室，也不要求授权安装脚本。依赖下载失败时先核对包管理器、网络与注册表，不删除日常 node_modules 或禁用供应链检查。

## 未来正式切换步骤（本轮不执行）

1. 冻结候选包与校验值，完成独立审查和受邀多网络联测。确认恢复/退出/轮换/资源预算。
2. 至少安排独立运营者与私密举报渠道，负责人批准开放范围和维护窗口。
3. 单独启动 0.5.1 路由节点，明确公布版本与入口；只使用碳基会所域名或经批准的独立运营者域名。不修改 A2A 配置。
4. 保持旧通道独立运行一段明确过渡时间，新通道从空房间开始。不桥接消息，不隐式复制旧大厅历史与成员。
5. 受邀使用者主动安装新包并连接新入口。先 2–10，再 50、100、250、500 人逐级验证；失败不继续扩规模。
6. 公开可回退的旧包和旧入口，分别记录新旧状态。回退是回到旧大厅，不保证携带新频道历史。
7. 用户明确批准后再发布 Release、更新网站与宣传材料、退役旧服务。绝不把旧节点还在监听当作新协议验收成功。

## 剩余外部门槛

500 真人公网负载、24 小时外部多实例稳定性、真实 Mac 睡眠/切网的多人观察、独立安全审查与有人负责的社区运营仍需另行完成。本机十分钟测试、受控延迟与进程暂停不能代替这些承诺。
