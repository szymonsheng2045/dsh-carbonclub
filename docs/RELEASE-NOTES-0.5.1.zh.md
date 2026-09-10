# v0.5.1-beta.1 发布说明

碳基会所 0.5.1 公开测试版。

## 相对 0.5.0 的变化

- 修正同时过期候位者的席位推导（并发边界修复）。
- 大厅使用独立的 0.5.1 topic/sync 通道（`/dsh-human-buffer/room/hall/0.5.1`、`/dsh-human-buffer/sync/hall/0.5.1`），与 0.5.0 不互通、不桥接历史。
- 社区中继新增可选的只读审查诊断端点（`127.0.0.1` 硬绑定、token 鉴权、仅聚合健康指标，不返回消息原文/对端地址/密钥，无远程控制），以及更严的资源硬上限（预约 600、连接 1200、同步 8MiB/次且 60 次/分钟、大厅 500）。
- 新增部署验收工具：`scripts/probe-public-relay.mjs`（传输+协议探针）与 `scripts/p2p-relay-acceptance.mjs`（双客户端逐跳验收），均从完整仓库检出运行。

## 安装

```sh
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/dsh-human-buffer-0.5.1-beta.1.tgz
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/SHA256SUMS
shasum -a 256 -c SHA256SUMS
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.1-beta.1.tgz
```

## 联网

0.5.1 公共 bootstrap（志愿 Mac 中继，不承诺可用性）：

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club
```

0.5.0 旧入口 `relay.laozi.art` 在过渡窗口内（不少于两周）继续服务旧版客户端。0.5.0 用户迁移只需两步：安装 0.5.1 包 + 改用上述 bootstrap。回退路径见 docs/MIGRATION-0.5.1.zh.md。

## 注意

- 这是公开测试版，不是经过审计的匿名或儿童安全系统；低龄房间保持关闭。
- 公共大厅文字对参与者公开，不要在公共大厅发布私密信息。
- 漏洞报告：GitHub 私密漏洞报告或 szymonsheng2045@gmail.com。

---

# v0.5.1-beta.1 Release Notes

Carbon Club 0.5.1 public beta.

## Changes vs 0.5.0

- Fixed seat derivation for simultaneously expiring queue members (concurrency edge case).
- The lobby now uses dedicated 0.5.1 topic/sync channels (`/dsh-human-buffer/room/hall/0.5.1`, `/dsh-human-buffer/sync/hall/0.5.1`); no interop or history bridging with 0.5.0.
- The community relay gains an optional read-only review-diagnostics endpoint (hard-bound to `127.0.0.1`, token-authenticated, aggregate health only — never message bodies, peer addresses, or keys; no remote control) and stricter resource ceilings (600 reservations, 1,200 connections, 8 MiB per sync at 60/min, 500-person hall).
- New deployment acceptance tools: `scripts/probe-public-relay.mjs` (transport + protocol probe) and `scripts/p2p-relay-acceptance.mjs` (two-client hop-confirmed acceptance), both run from a full repository checkout.

## Install

```sh
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/dsh-human-buffer-0.5.1-beta.1.tgz
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/SHA256SUMS
shasum -a 256 -c SHA256SUMS
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.1-beta.1.tgz
```

## Connectivity

0.5.1 public bootstrap (volunteer Mac relay, no availability guarantee):

```sh
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club
```

The legacy 0.5.0 entry `relay.laozi.art` keeps serving older clients through the transition window (at least two weeks). Migrating from 0.5.0 takes two steps: install the 0.5.1 archive and switch to the bootstrap above. Rollback paths are documented in docs/MIGRATION-0.5.1.zh.md.

## Notes

- This is a public beta, not an audited anonymity or child-safety system; the low-age room stays closed.
- Public-lobby text is visible to participants; do not post private information there.
- Vulnerability reports: GitHub private vulnerability reporting or szymonsheng2045@gmail.com.
