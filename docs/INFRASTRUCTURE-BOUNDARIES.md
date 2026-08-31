# Infrastructure and domain boundaries

This document is the operational source of truth for Carbon Club. It prevents
the Carbon Club and A2A projects from sharing public names, tunnels, credentials,
or deployment decisions by accident.

## Ownership map

| Resource | Owner | Purpose | Rule |
| --- | --- | --- | --- |
| `laozi.art` | Carbon Club / Laozi site | Public project page and Carbon Club namespace | Carbon Club public names must live here. |
| `relay.laozi.art` | Carbon Club | Volunteer Mac bootstrap/relay over WSS | Current production relay name. |
| `dsh-carbon-club-relay` | Carbon Club | Dedicated Cloudflare Tunnel | Route only to `127.0.0.1:9090`; never expose the review port. |
| `a2a-crucible.xyz` | A2A Crucible | A2A website and A2A services | Do not add new Carbon Club records or routes. |
| `a2a` | A2A Crucible | Dedicated Cloudflare Tunnel | Do not add Carbon Club origins or hostnames. |
| Vercel | Laozi site hosting | Serves the `laozi.art` website | This is a hosting provider, not another registered domain. Preserve its apex records during a DNS move. |
| Gname | Domain registrar | Registration for `laozi.art` | Registrar security settings remain user-managed. |
| Cloudflare | Authoritative DNS and tunnel edge | Active authoritative DNS for `laozi.art`; dedicated Carbon Club tunnel edge | Deletion, token, permission, billing, and future production cutover changes require owner approval. |

There are exactly two registered root domains in the current estate:
`laozi.art` and `a2a-crucible.xyz`. Subdomains, Vercel deployment hostnames,
Cloudflare tunnel IDs, and `cfargotunnel.com` targets are infrastructure names,
not additional owned domains.

## Current migration state (2026-09-01 CST)

- `a2a-crucible.xyz` is active in Cloudflare and remains exclusively A2A.
- The `.art` registry, Cloudflare and independent public resolvers now delegate
  `laozi.art` to `cash.ns.cloudflare.com` and `deborah.ns.cloudflare.com`.
- The Vercel apex remains available over valid HTTPS after the DNS cutover.
- The dedicated `dsh-carbon-club-relay` tunnel is healthy, uses four HA edge
  connections, and routes only `relay.laozi.art` to `127.0.0.1:9090`.
- The relay announces `relay.laozi.art`; its fixed Peer ID passed WSS, Noise,
  Yamux and Circuit Relay v2 reservation probes after the cutover.
- `carbon-relay.a2a-crucible.xyz` remains usable only as a temporary rollback
  alias. This is the only permitted cross-project exception and must not be
  copied into runtime source, deploy templates or package metadata.

## Cutover gate

The compatibility endpoint may be retired only after all of the following are
true:

1. The owner approves changing the authoritative nameservers for `laozi.art`.
2. Cloudflare reports `laozi.art` active and the existing Vercel website passes
   apex and TLS checks.
3. `relay.laozi.art` resolves publicly and completes TLS, WebSocket, Noise,
   Yamux, Peer ID, and Circuit Relay v2 reservation checks from an external
   network.
4. README files, community-node documentation, installed relay announcement,
   and release notes are switched to the new multiaddress.
5. A rollback window passes while both endpoints remain usable.
6. The owner gives action-time approval to delete the old A2A DNS record and
   remove the old A2A tunnel route.

The rollback window ends no earlier than 2026-09-08 02:00 CST and only after
seven consecutive daily probes show that both aliases still reach the same Peer
ID and that `relay.laozi.art` can obtain a Circuit Relay v2 reservation. Passing
the window does not authorize deletion; item 6 still requires a separate owner
approval at action time.

Do not delete the compatibility record first. DNS deletion and tunnel-route
removal are destructive cloud changes and are deliberately the final step.

## Actions that require owner approval

- Change registrar nameservers, DNSSEC, domain lock, registrant data, or domain
  transfer settings.
- Delete or replace production DNS records, Cloudflare routes, tunnels, Vercel
  projects, deployments, or domains.
- Create, rotate, reveal, upload, or broaden access to API tokens, tunnel tokens,
  OAuth credentials, or review credentials.
- Change account members, roles, permissions, security settings, billing plans,
  payment methods, or notifications.
- Switch production traffic or publish a previously private service.

Read-only audits, local tests, documentation, non-secret templates, and
reversible preparation that does not affect production traffic may proceed
without a separate approval.

---

# 基础设施与域名边界

本文档是碳基会所的运维事实源，用于防止碳基会所与 A2A 项目误用同一公开名称、
隧道、凭据或部署决策。

## 归属关系

- `laozi.art`：老子网站及碳基会所的公开命名空间。
- `relay.laozi.art`：碳基会所志愿 Mac 中继的当前正式地址。
- `dsh-carbon-club-relay`：碳基会所独立 Cloudflare Tunnel，只能转发到
  `127.0.0.1:9090`，不得公开安全审查端口。
- `a2a-crucible.xyz` 与 `a2a` 隧道：仅属于 A2A 项目，不再新增任何碳基会所
  记录、路由或服务。
- Vercel：`laozi.art` 网站的托管平台，不是新增域名；迁移 DNS 时必须保留其
  站点解析记录。
- Gname：`laozi.art` 的域名注册商。
- Cloudflare：`laozi.art` 当前权威 DNS，并承载独立碳基会所隧道。

当前只有两个注册根域名：`laozi.art` 和 `a2a-crucible.xyz`。子域名、Vercel
部署地址、Cloudflare 隧道 ID 和 `cfargotunnel.com` 目标都不算新增域名。

## 当前迁移状态（北京时间 2026-09-01）

- `a2a-crucible.xyz` 已在 Cloudflare 激活，并继续只服务 A2A。
- `.art` 注册局、Cloudflare 和独立公共解析器均已将 `laozi.art` 委派给
  `cash.ns.cloudflare.com` 与 `deborah.ns.cloudflare.com`。
- Vercel 主页在切换后继续通过有效 HTTPS 正常提供服务。
- `dsh-carbon-club-relay` 隧道保持四条 HA 连接，只把 `relay.laozi.art`
  转发到 `127.0.0.1:9090`。
- 中继已经公告 `relay.laozi.art`；固定 Peer ID 在切换后通过了 WSS、Noise、
  Yamux 与 Circuit Relay v2 reservation 实测。
- `carbon-relay.a2a-crucible.xyz` 只作为临时回滚别名继续可用，不得进入运行时
  源码、部署模板或包元数据。

## 切换门槛

只有在以下条件全部满足后，才可淘汰临时地址：

1. 你批准修改 `laozi.art` 的权威名称服务器。
2. Cloudflare 显示域名已激活，Vercel 主页及 HTTPS 均验证正常。
3. `relay.laozi.art` 从外部网络通过 DNS、TLS、WebSocket、Noise、Yamux、
   Peer ID 和 Circuit Relay v2 预约检查。
4. README、社区节点文档、Mac 中继公告地址和发行说明全部切换。
5. 新旧地址并行一段回滚观察期。
6. 你在实际删除前再次批准移除 A2A 下的旧 DNS 记录和旧隧道路由。

回滚观察期最早于北京时间 2026-09-08 02:00 结束，并且此前必须连续七天完成
每日探测，确认新旧别名仍指向同一 Peer ID，且 `relay.laozi.art` 能成功取得
Circuit Relay v2 reservation。观察期结束不等于授权删除；第 6 项仍须在实际
操作时再次获得你的明确批准。

不得先删旧地址。DNS 删除和隧道路由删除属于破坏性云端操作，必须放在最后。

## 必须请示的敏感操作

- 修改注册商名称服务器、DNSSEC、域名锁、注册人资料或域名转移设置；
- 删除或替换生产 DNS、Cloudflare 路由/隧道、Vercel 项目/部署/域名；
- 创建、轮换、展示、上传或扩大 API、Tunnel、OAuth、审查凭据权限；
- 修改账号成员、角色、权限、安全设置、付费方案、支付方式或通知；
- 切换生产流量，或把原本私有的服务公开。

只读审计、本地测试、文档、无秘密模板，以及不改变生产流量的可逆准备工作，
可以直接推进。
