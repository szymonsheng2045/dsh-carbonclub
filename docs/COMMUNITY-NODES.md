# Community bootstrap/relay nodes · 社区引导与中继节点

These addresses are optional, replaceable rendezvous infrastructure. Clients choose their own comma-separated list through `DSH_CARBON_CLUB_BOOTSTRAP`; Carbon Club does not hard-code a mandatory server.

这些地址是可选、可替换的会合基础设施。客户端通过 `DSH_CARBON_CLUB_BOOTSTRAP` 自行选择逗号分隔的节点列表；碳基会所不会硬编码强制服务器。

## Verified starter node · 已验证首发节点

| Operator | Bootstrap multiaddress | Verified | Intended use |
| --- | --- | --- | --- |
| Project volunteer Mac · 项目志愿 Mac | `/dns4/relay.laozi.art/tcp/443/wss/p2p/12D3KooWLdvJF8g2gt5j7qhrJHtbharz1Tv8dguzUoTt8Saz8uHU` | 2026-09-01 CST: authoritative DNS, TLS, WSS, Noise/Yamux, exact Peer ID and Circuit Relay v2 reservation | Invitation testing and early cohorts · 邀请测试与早期小规模用户 |

The node keeps a persistent Ed25519 relay identity and starts automatically on login. It can disappear during Mac sleep, power loss, home-network failure or maintenance. Its published limits are 600 reservations and 1,200 process connections, but those are guardrails—not a demonstrated 500-person service guarantee.

该节点使用持久 Ed25519 中继身份，并在用户登录后自动启动。Mac 睡眠、断电、家庭网络故障或维护期间都可能离线。它公开配置了 600 个 reservation 和 1,200 个进程连接上限，但这些只是资源护栏，并不等于已经证明可稳定承载 500 人。

The former `/dns4/carbon-relay.a2a-crucible.xyz/...` address remains usable only as a temporary rollback alias. It is not the address for new configurations and will be removed only after the rollback window and a separate owner approval.

原 `/dns4/carbon-relay.a2a-crucible.xyz/...` 地址目前只作为临时回滚别名继续可用，不再用于新配置；只有在回滚观察期结束并再次获得所有者批准后才会移除。

Before an unrestricted 500-person lobby, add at least two independently operated WSS nodes on separate networks and failure domains, publish incident contacts, and complete the staged soak plan in [CAPACITY-500.md](./CAPACITY-500.md).

开放不受限的 500 人大厅前，至少再增加两个位于独立网络和故障域的 WSS 节点，公布事故联系方式，并完成 [CAPACITY-500.md](./CAPACITY-500.md) 中的分阶段浸泡测试。
