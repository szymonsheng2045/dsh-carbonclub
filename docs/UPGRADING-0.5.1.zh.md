# 0.5.1 升级与回退指引

面向 0.5.0 用户与新用户的公开操作指引。内部运维细节（机器、隧道、密钥管理）不在本文范围。

## 版本兼容性（先读）

0.5.1 大厅使用独立的 topic/sync 通道（`/dsh-human-buffer/room/hall/0.5.1`、`/dsh-human-buffer/sync/hall/0.5.1`），与 0.5.0 **不互通**：

- 0.5.1 与 0.5.0 客户端不能组成同一个大厅；新大厅从空房间开始，不桥接、不复制旧大厅历史。
- 0.5.1 邀请为 carbon2 格式且签名绑定大厅协议；跨版本邀请在拨号前直接拒绝（0.5.1 侧显示 `HALL_PROTOCOL_MISMATCH`，0.5.0 侧显示无效邀请）。双方升级后须重新生成邀请。

## 升级到 0.5.1（两步）

```sh
# 1. 安装 0.5.1 包（核对 SHA-256 清单）
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/dsh-human-buffer-0.5.1-beta.1.tgz
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.1-beta.1/SHA256SUMS
shasum -a 256 -c SHA256SUMS
dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.1-beta.1.tgz

# 2. 改用 0.5.1 公共入口启动
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club
```

自定义 profile 首次使用需补入 Web 应用层（幂等一行，见 README 安装节）。

## 回退到 0.5.0（两项缺一不可）

0.5.1 客户端即使连上旧中继也仍使用 0.5.1 通道，会被识别为协议不匹配。**只改入口或只重装旧版都无效**，必须两项都做：

```sh
# 1. 重装 0.5.0-beta.2 包（建议新建回退 profile，避免同路径同版本缓存）
curl -LO https://github.com/szymonsheng2045/dsh-carbonclub/releases/download/v0.5.0-beta.2/dsh-human-buffer-0.5.0-beta.2.tgz
dsh plugin --profile carbon-club-050 add ./dsh-human-buffer-0.5.0-beta.2.tgz

# 2. 恢复旧入口启动
DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay.laozi.art/tcp/443/wss/p2p/12D3KooWLdvJF8g2gt5j7qhrJHtbharz1Tv8dguzUoTt8Saz8uHU' dsh --profile carbon-club-050
```

回退后请核对实际安装版本为 0.5.0。新大厅的消息历史不会进入旧大厅。

## 过渡窗口

新旧入口并行不少于两周。窗口结束且 0.5.1 稳定后，旧入口将先公告再退役；公告会明确旧客户端届时无法继续连接。

---

# Upgrading to 0.5.1 and rolling back

Public guide for 0.5.0 users and new users. Internal operations (hosts, tunnels, keys) are out of scope.

## Compatibility (read first)

The 0.5.1 lobby uses dedicated topic/sync channels and **does not interoperate** with 0.5.0: no shared lobby, no message bridging, no history carry-over. 0.5.1 invitations use the carbon2 format bound to the hall protocol; cross-version invitations are rejected before dialing. Regenerate invitations after both sides upgrade.

## Upgrade (two steps)

1. Install the 0.5.1 archive (verify SHA256SUMS first):
   `dsh plugin --profile carbon-club add ./dsh-human-buffer-0.5.1-beta.1.tgz`
2. Start with the 0.5.1 public entry:
   `DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay-051.laozi.art/tcp/443/wss/p2p/12D3KooWABxQrMHAVgbeqiVctkAPBFPSPSqCJi1SC4YRZh1hsMrh' dsh --profile carbon-club`

## Rollback to 0.5.0 (both required)

A 0.5.1 client still speaks 0.5.1 topics even when connected to the legacy relay and is rejected as a protocol mismatch. Changing only the bootstrap or only reinstalling is not enough — do both:

1. Reinstall the 0.5.0-beta.2 archive (a fresh rollback profile is recommended to avoid same-path same-version caches):
   `dsh plugin --profile carbon-club-050 add ./dsh-human-buffer-0.5.0-beta.2.tgz`
2. Start with the legacy entry:
   `DSH_CARBON_CLUB_BOOTSTRAP='/dns4/relay.laozi.art/tcp/443/wss/p2p/12D3KooWLdvJF8g2gt5j7qhrJHtbharz1Tv8dguzUoTt8Saz8uHU' dsh --profile carbon-club-050`

After rollback, verify the installed version is actually 0.5.0. New-lobby history does not carry into the old lobby.

## Transition window

Both entries run in parallel for at least two weeks. Retirement of the legacy entry will be announced in advance; the announcement will state clearly that legacy clients can no longer connect afterwards.
