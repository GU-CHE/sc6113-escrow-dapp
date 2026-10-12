# 业务验收（成员 2）：要求覆盖清单与 Sepolia 业务测试

起草：2026-10-12。依据：老师任务书 `SC6113 Group Project.docx`、小组《要求与验收计划》、[ACCEPTANCE.md](ACCEPTANCE.md)、[HANDOVER_ZH.md](HANDOVER_ZH.md) 和当前代码（commit `2f6a01b`）。

> 合约已于 2026-10-12 部署到 Sepolia 并通过核验（地址见 2.2，部署记录见 `SEPOLIA_VERIFICATION.json`）。同日在线上版本用真实 MetaMask 完成了第 3 节全部用例，**B00–B05 全部通过**，32 笔交易和对账结果见第 6 节，测试截图在 [`acceptance-screenshots/`](acceptance-screenshots/)（索引见 6.6）。本地链测试不算公开测试网证据。

第 3 节的 B01–B05 与 `ACCEPTANCE.md` 中的同名用例一一对应，这里补充成可以照着操作的步骤和记录表。

## 1 要求覆盖清单

状态：✅ 已实现并有证据　⏳ 已实现，缺 Sepolia / 真实环境证据　⚠️ 部分完成　❌ 未开始

### 1.1 强制功能要求

| # | 老师要求 | 实现位置 | 状态 | 还缺的证据 | 相关成员 |
|---|---|---|---|---|---|
| F1 | 至少三种角色的身份认证与权限 | `RoleRegistry.sol`（Customer / Provider / Admin）；`app.py` 的 `/api/auth/*` 钱包签名登录 | ⏳ 注册和管理员裁决已有 Sepolia 证据（第 6 节） | 越权被拒记录 | 3、5 |
| F2 | MetaMask 集成与安全的交易签名 | `static/app.js` 的 `bindWallet()`、`transact()`（签名前有审核弹窗） | ⏳ | 拒签、切换账户 / 网络的记录 | 4 |
| F3 | 至少三个相互交互的合约 | `DisputeResolver` 调用 `EscrowOrders.markDisputed()` / `resolveDispute()`；两者都查询 `RoleRegistry` | ✅ 争议和裁决交易都同时有 EscrowOrders 与 DisputeResolver 的事件（第 6 节） | — | 1、3 |
| F4 | 至少十种区块链交易类型 | 12 种，见第 4 节 | ✅ 12 种都有 Sepolia 交易哈希（第 4 节） | — | **2** |
| F5 | REST API、持久化存储、异常处理 | `app.py`；Render PostgreSQL | ✅ 服务重启后数据保留已验证 | 错误输入的响应记录 | 5 |
| F6 | 响应式仪表盘、交易历史、事件日志、数据可视化 | `templates/index.html`：指标卡、状态分布条、Transaction history | ⚠️ 可视化只有一个状态分布图 | 真实手机检查；是否补充图表待讨论 | 4 |
| F7 | Gas 估算 | `transact()` 签名前调用 `estimateGas` 并显示费用上限 | ✅ 签名前审核弹窗显示估算 gas 和费用上限（[截图](acceptance-screenshots/F7-createOrder-gas-estimate.webp)）；估算与实测对比见 6.4 | — | **2**、5 |
| F8 | Gas 优化分析 | 只有本地测量 `docs/gas-samples.json` | ❌ | 优化方案及前后对比 | 3 / 5（未明确） |
| F9 | 智能合约测试 | `tests/contracts.test.cjs` 11 项，GitHub Actions 通过 | ✅ | — | 3 |
| F10 | 公共云部署 | https://sc6113-escrow-dapp.onrender.com | ✅ 线上完整业务流程已跑通（第 6 节） | — | 1、5 |

### 1.2 真实问题分析（15 分，成员 2 负责问题分析章节）

问题分析章节英文初稿已完成（Problem Analysis and Validation，共 9 节），下表“章节”一列指其中的小节。

| 任务书要求 | 状态 | 章节 |
|---|---|---|
| 具体、重要的真实金融或商业问题 | ✅ 初稿 | 1 |
| 目标用户、利益相关者、痛点、现有方案的不足 | ✅ 初稿 | 2、4 |
| 可信证据（行业报告、研究、访谈、观察、数据） | ⚠️ 有全球和美国数据并附出处；缺新加坡本地数据 | 3 |
| 为什么适合用区块链，中心化方案为何不足 | ✅ 初稿 | 5 |
| 功能、非功能、安全、易用性需求 | ✅ 初稿，16 条需求对应到实现 | 6 |
| 可衡量的成功指标 | ✅ 初稿，含基线、目标和测量方法 | 7 |
| 方案验证（反馈、用户测试、**情景评估**、数据） | ✅ B01–B05 已在 Sepolia 全部通过（本文第 6 节） | 8 |
| 实际约束、伦理、监管、采用障碍 | ✅ 初稿，含新加坡 PSA 与 PDPA | 9 |

### 1.3 提交物

| 提交物 | 状态 | 说明 |
|---|---|---|
| 10–15 页技术报告 | ⚠️ | 问题分析章节初稿已完成（成员 2）；其余章节由各成员撰写，成员 6 整合 |
| 架构、合约交互、数据模型、流程、UI 图 | ⚠️ | `ARCHITECTURE.md` 有架构图、状态图和数据模型表；缺合约调用时序图和 UI 图 |
| GitHub：源码、文档、运行说明、贡献历史 | ⚠️ | 源码与文档齐全；贡献历史需要每位成员提交自己负责的部分 |
| 部署 URL、合约部署详情、测试报告 | ⚠️ | URL、合约部署详情（`SEPOLIA_VERIFICATION.json`）和业务测试结果（本文第 6 节）已有；其他测试结果待各成员补充 |
| Slides、10 分钟视频或现场演示 | ❌ | 成员 6 |
| 用户手册 | ⚠️ | `USER_GUIDE.md` 较简略 |
| 个人贡献报告 | ❌ | `CONTRIBUTIONS.md` 只有模板 |

## 2 测试准备

### 2.1 前置条件

- 合约已部署到 Sepolia，Render 已用新的 `deployment.json` 重新部署，网站不再显示 “Contracts have not been deployed”。
- 三个**仅用于课程**的测试账户，绝不存放真实资产：

| 简称 | 角色 | 持有人 | Sepolia ETH（粗估，取决于当时 gas 价格） |
|---|---|---|---|
| A | Administrator（部署合约的钱包，之后固定） | 部署者 | 只需几次裁决的 gas |
| C | Customer | 成员 2 | 约 0.05 |
| P | Service provider | 成员 2 | 约 0.02 |

- B03、B04 的裁决步骤必须由 A 的持有人操作，需提前约好时间。
- 使用电脑浏览器 + MetaMask，网络选 Sepolia。同一个 MetaMask 切换账户后，网页会要求重新 `Connect wallet` 并签名登录，这是正常的。

### 2.2 记录内容

- **交易哈希和 gas**：每笔交易确认后，页面顶部状态栏显示 `Confirmed in block … · gas used … · 0x…`，复制哈希和 gas used。签名前的审核弹窗里有 `Estimated gas units`，一起记下，作为“估算 vs 实际”数据。
- **截图**：订单详情（标题显示 `Order #N · 状态`）；Etherscan 交易页用第 6 节的链接代替。文件名用“用例-步骤-内容”，例如 `B01-5-released-order4.jpg`，放在 `acceptance-screenshots/`。
- **测试环境**：

| 日期时间（SGT） | 浏览器及版本 | MetaMask 版本 | Render 上线 commit |
|---|---|---|---|
| 2026-10-12 15:21–17:18 | Microsoft Edge 154.0.4258.62 | 13.48.0 | Render 部署提交 `85a86ba`；仓库验收基线为 `99b4877`，后者只改了测试和文档，运行代码相同 |

合约地址（2026-10-12 部署，起始区块 11897155，已用公开节点核验）：

| 合约 | Sepolia 地址 |
|---|---|
| RoleRegistry | `0x301B9E840e8FCf727c4b31c9AF75477D64FD4810` |
| EscrowOrders | `0xf56A0BDED64dA25261FE4DAd31a72D521ED0680B` |
| DisputeResolver | `0xA0B660Bb047a7Bebc461630D4c7B3F3072EC25a8` |
| 管理员 A（部署账户） | `0xc738E8Ec4d828679e953A47D996f177bDe5C9D36` |

### 2.3 金额对账方法

- **订单级**：每个结束的订单只有一方获得 credit，金额等于订单金额（`Released` → P，`Refunded` → C）。
- **合约级**：在 Etherscan 查看 `EscrowOrders` 合约地址的余额，应等于页面 `Funds in escrow` + `Ready to withdraw`。
- **钱包级**（需扣除 gas）：入金时 C 钱包减少 = 订单金额 + 该笔手续费；提现时收款人钱包增加 = 应得金额 − 该笔手续费。手续费看 Etherscan 的 `Transaction Fee`，提现金额看该交易的 `Internal Txns`。
- `Funds in escrow` 和 `Ready to withdraw` 是全体用户的合计，其他组员同时测试会改变这两个数。记录前后差值，并尽量错开测试时间。

## 3 业务测试用例

每个用例开始前点 `Refresh`，记下 `Orders on chain`、`Funds in escrow`、`Ready to withdraw`。另一方操作后先点 `Refresh` 再检查。订单金额统一用 0.001 ETH。“结果”填 ✅ 或 ❌；❌ 时在 `DEFECT_LOG.csv` 登记，并在此写上缺陷编号。

**执行结果**：2026-10-12 已全部完成。每笔交易的哈希、gas 和结果统一记录在第 6 节，以第 6 节为准，下列各表不再逐格重复填写。

### B00 角色注册（前置）

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | P | `Connect wallet` → MetaMask 连接 → 签名登录消息 | 状态栏提示已登录；出现 `Choose your role` | — | — |  |
| 2 | P | `I'm a service provider` → `Confirm in wallet` → MetaMask 确认 | 身份显示 `Service provider · 0x…`；角色面板消失 |  |  |  |
| 3 | C | 切换到 C → `Connect wallet` → 签名 → `I'm a customer` → 确认 | 身份显示 `Customer · 0x…`；`＋ New order` 可点击 |  |  |  |
| 4 | A | 连接管理员钱包（只查看，不发交易） | 身份显示 `Administrator`；不出现角色面板 | — | — |  |

### B01 正常交付付款

**对应痛点**：客户担心付款后收不到成果，服务方担心交付后收不到钱。

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | C | `＋ New order`：填标题、范围、P 的地址、金额 0.001、截止时间用默认值 → `Review transaction` → `Confirm in wallet` | 新订单为 `Created`；`Orders on chain` +1；`Funds in escrow` 不变；详情的 Linked records 显示条款原文和 `Hash verified` |  |  |  |
| 2 | P | 该订单 `View` → `Accept order` | `Accepted`；没有 ETH 转移 |  |  |  |
| 3 | C | `Fund escrow`（审核弹窗显示 `Test ETH sent 0.001`） | `Funded`；`Funds in escrow` +0.001；Etherscan 上该交易 Value = 0.001 ETH（如果 MetaMask 用智能账户发送，To 和 Value 可能不同，以 Logs 中 EscrowOrders 的事件为准） |  |  |  |
| 4 | P | `Submit delivery`：填写交付说明或链接 | `Submitted`；Delivery hash 不为 0；Linked records 出现交付内容和 `Hash verified` |  |  |  |
| 5 | C | `Approve delivery` | `Released`；`Funds in escrow` −0.001；`Ready to withdraw` +0.001 |  |  |  |
| 6 | P | 查看 `Your available balance` → `Withdraw ETH ↗` | 提现前为 0.001，提现后归 0 且按钮变灰；`Ready to withdraw` −0.001；Internal Txns 显示合约向 P 转 0.001 ETH；Transaction history 出现 `Withdrawal` |  |  |  |

**额外检查**：`Released` 后 C 和 P 的详情里都不再出现 `Approve delivery` 和 `Open dispute`；做一次 2.3 的合约级对账。

### B02 未入金取消

**对应痛点**：资金锁定前，客户可以无损退出。

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | C | 新建订单（B02a） | `Created` |  |  |  |
| 2 | C | `Cancel order` | `Cancelled` |  |  |  |
| 3 | P | 打开 B02a | 没有 `Accept order` | — | — |  |
| 4 | C | 新建订单（B02b） | `Created` |  |  |  |
| 5 | P | `Accept order` | `Accepted` |  |  |  |
| 6 | C | `Cancel order` | `Cancelled`；没有 `Fund escrow`；`Funds in escrow` 全程不变 |  |  |  |

### B03 争议 → 退款给客户

**对应痛点**：服务方不交付或无法交付时，客户能拿回钱。

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | C | 新建订单 | `Created` |  |  |  |
| 2 | P | `Accept order` | `Accepted` |  |  |  |
| 3 | C | `Fund escrow` | `Funded` |  |  |  |
| 4 | C | `Open dispute`：填写争议原因 | `Disputed`；Linked records 出现 `DisputeOpened` |  |  |  |
| 5 | P | `Add evidence`：填写证据说明 | Linked records 出现 `EvidenceAdded` |  |  |  |
| 6 | A | 打开订单 → `Resolve dispute`：Ruling 选 `Refund the customer`，填写裁决说明 | `Refunded`；切回 C 查看可提余额 +0.001，P 不变 |  |  |  |
| 7 | C | `Withdraw ETH ↗` | C 收到 0.001（Internal Txns） |  |  |  |

**额外检查**：裁决后不再出现 `Add evidence` 和 `Resolve dispute`。在 Etherscan 打开第 4 步交易的 Logs，应同时看到 `EscrowOrders` 和 `DisputeResolver` 两个合约的事件，这就是三合约交互的链上证据。

### B04 争议 → 支付服务方

**对应痛点**：服务方已交付，客户却不验收、拖延付款。

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | C | 新建订单 | `Created` |  |  |  |
| 2 | P | `Accept order` | `Accepted` |  |  |  |
| 3 | C | `Fund escrow` | `Funded` |  |  |  |
| 4 | P | `Submit delivery` | `Submitted` |  |  |  |
| 5 | P | `Open dispute`：理由写“已交付，客户未验收” | `Disputed` |  |  |  |
| 6 | C | `Add evidence` | Linked records 出现 `EvidenceAdded` |  |  |  |
| 7 | A | `Resolve dispute`：Ruling 选 `Pay the provider` | `Released`；P 可提余额 +0.001，C 不变 |  |  |  |
| 8 | P | `Withdraw ETH ↗` | P 收到 0.001 |  |  |  |

### B05 超期未交付退款

**对应痛点**：服务方收款后失联，客户不需要仲裁即可按规则退款。

| 步 | 钱包 | 操作 | 预期结果 | 交易哈希 | Gas 估算 / 实际 | 结果 |
|---|---|---|---|---|---|---|
| 1 | C | 新建订单，截止时间改为**当前时间 + 15 分钟** | `Created` |  |  |  |
| 2 | P | `Accept order`（必须在截止前完成） | `Accepted` |  |  |  |
| 3 | C | `Fund escrow`（必须在截止前完成） | `Funded` |  |  |  |
| 4 | C | 截止前打开详情 | 没有 `Refund overdue order` | — | — |  |
| 5 | C、P | 截止后再等 2 分钟 → `Refresh` → 重新 `View` | C 看到 `Refund overdue order`；P 看不到 `Submit delivery` | — | — |  |
| 6 | C | `Refund overdue order` | `Refunded`；C 可提余额 +0.001 |  |  |  |
| 7 | C | `Withdraw ETH ↗` | C 收到 0.001 |  |  |  |

若第 6 步提示 `Not expired or delivered`，说明链上时间还没过截止时间，再等 1–2 分钟。

## 4 交易类型覆盖（F4 的证据）

12 种业务交易都已有 Sepolia 交易哈希（2026-10-12），报告中可直接引用。

| # | 交易类型 | 合约函数 | 来自用例 | Sepolia 交易哈希 |
|---|---|---|---|---|
| 1 | 注册角色 | `RoleRegistry.register` | B00 | [0xb39c4d4e…5a4e25](https://sepolia.etherscan.io/tx/0xb39c4d4eefb87d84e4d778bf957bc286c6709c1e7fdcd88386ed53ad0d5a4e25) |
| 2 | 创建订单 | `EscrowOrders.createOrder` | B01（#4） | [0xb273a9b8…3db4cd](https://sepolia.etherscan.io/tx/0xb273a9b86405808090a5aa35853b6a7d8c556b16db4daa8502511826a43db4cd) |
| 3 | 接单 | `EscrowOrders.acceptOrder` | B01（#4） | [0x92c5d10d…70faef](https://sepolia.etherscan.io/tx/0x92c5d10db2e1da3e9673b743d4120dd3eed52070fe97af907ef94bf96b70faef) |
| 4 | 入金 | `EscrowOrders.fundOrder` | B01（#4） | [0xfde72d29…4f5546](https://sepolia.etherscan.io/tx/0xfde72d2940bc5617aa51fd3688ae4de9951faaee9c3d761cb2396e93084f5546) |
| 5 | 提交成果 | `EscrowOrders.submitDelivery` | B01（#4） | [0x339cd0cb…7aa09b](https://sepolia.etherscan.io/tx/0x339cd0cba04bdcf06d5b8211a5c6b1d47d0235fb99ecad6fe54be4319c7aa09b) |
| 6 | 验收放款 | `EscrowOrders.approveDelivery` | B01（#4） | [0x0104a805…e4449b](https://sepolia.etherscan.io/tx/0x0104a805d2c8100f6f1c596b2873b014f279a31c402e3274a95324e5cee4449b) |
| 7 | 取消订单 | `EscrowOrders.cancelOrder` | B02a（#2） | [0xbd44ab71…117c9d](https://sepolia.etherscan.io/tx/0xbd44ab71aadd7ede3fb48cbfb0c741f3f6a42c09a194fa4b89136a9779117c9d) |
| 8 | 超期退款 | `EscrowOrders.refundExpired` | B05（#5） | [0x285b5cad…07b250](https://sepolia.etherscan.io/tx/0x285b5cadc9cadb36075a82ee8bac10cc0dfecdf8485c2b19faf24b0bee07b250) |
| 9 | 发起争议 | `DisputeResolver.openDispute` | B03（#1） | [0x565b5d26…80d7a9](https://sepolia.etherscan.io/tx/0x565b5d2672a089819985ed78b2c64078bb46777bb470657d005c18f6cd80d7a9) |
| 10 | 提交证据 | `DisputeResolver.addEvidence` | B03（#1） | [0xc62a45ac…ce97e9](https://sepolia.etherscan.io/tx/0xc62a45acacf5d004e2c311fd13bb53855c7fed37d8718114457d6feb84ce97e9) |
| 11 | 仲裁裁决 | `DisputeResolver.resolve` | B03（#1）退款；B04（#6）付款 | [0xb860fae2…6e2dd2](https://sepolia.etherscan.io/tx/0xb860fae2717150a1a631385c0a2ac503da1b082b7d4797ae22d0e1a1086e2dd2)；[0x9d7f817f…71b432](https://sepolia.etherscan.io/tx/0x9d7f817f6aadddf73b4767552bb0c4e9aea38f8504eb77f3b7ea0d15fc71b432) |
| 12 | 提现 | `EscrowOrders.withdraw` | B01 | [0x1a0809db…089178](https://sepolia.etherscan.io/tx/0x1a0809dbe741a4b8f36e593469957b64710898601e60edd11f002d3daa089178) |

部署时的 `setResolver` 属于管理配置，不计入 12 种。

## 5 执行时需要观察的问题

以下内容可用于报告的“局限与改进”，执行时请确认并记录实际表现：

- **事件窗口只有约 3 小时**：`/api/events` 只读取最近 1,000 个区块（Sepolia 约 12 秒一块，约 3.3 小时）。超过这个时间，Transaction history 会变空，订单详情中的争议原因、证据和裁决原文也不再显示（条款和交付原文不受影响）。如果演示前一天就准备好争议订单，演示时可能看不到这些记录，需要实测并告知成员 1 和成员 6。
- **客户既不验收也不争议**：服务方交付后，如果客户一直不操作，资金会一直锁定，服务方只能发起争议、等待管理员裁决。很多平台设有“超时自动放款”规则，可作为改进方向。
- **订单信息全部公开**：订单金额、双方地址和条款原文任何人都能看到，涉及商业保密和隐私，属于采用障碍。
- **单一管理员**：所有争议由一个固定钱包裁决，没有申诉机制，这是系统的信任假设。
- **Sepolia 实测 gas 远高于本地测试**：部署 4 笔交易共用 16,654,831 gas，按本地规则估算只有约 245 万；绑定裁决合约一笔用了 314,767 gas，本地约 5 万。业务交易的 gas 要以第 3 节的实测记录为准，报告中的成本数字也要据此更新。
- **MetaMask 智能账户**：管理员和两个测试账户都是 MetaMask 智能账户（EIP-7702）。账户代码是指向 MetaMask 委托合约的 `0xef0100…` 标记。除入金外，交易都先发给 MetaMask 的 `DelegationManager` 合约（`0xdb9b…47db3`）再转到我们的合约，所以 Etherscan 上的 To 不是我们的合约地址。核对证据时以 Logs 中合约发出的事件和 Internal Txns 为准。

## 6 执行结果（Sepolia，2026-10-12）

执行人：成员 2。环境：线上版本 https://sc6113-escrow-dapp.onrender.com，Microsoft Edge + MetaMask（版本见 2.2）。客户 C 为 `0xD496…1376`，服务方 P 为 `0x281D…C133`，管理员 A（组长）为 `0xc738…9D36`，负责两次裁决。下列数据于当天 17:20 前后用公开 Sepolia 节点逐笔核对，32 笔交易全部成功。

### 6.1 场景结果

| 用例 | 订单 | 结果 | 关键证据 | 说明 |
|---|---|---|---|---|
| B00 角色注册 | — | ✅ | C、P 各一笔 `register` | C 先于 P 注册，不影响后续用例 |
| B01 正常交付付款 | #4 | ✅ | `approveDelivery` 后只有 P 获得 0.001（[截图](acceptance-screenshots/B01-5-released-order4.jpg)），P 提现 0.001 | 完整流程共 2,059,551 gas |
| B02a 创建后取消 | #2 | ✅ | `cancelOrder`；P 看不到 Accept order（[截图](acceptance-screenshots/B02-3-no-accept-order2.jpg)） | — |
| B02b 接单后取消 | #3 | ✅ | `cancelOrder`；C 看不到 Fund escrow（[截图](acceptance-screenshots/B02-6-cancelled-order3.jpg)） | — |
| B03 争议 → 退款给客户 | #1 | ✅ | C 发起争议，P 补充证据，A 裁决退款；只有 C 获得 0.001（[详情截图](acceptance-screenshots/B03-6-refunded-order1.png)） | #1 原为 B05 的第一次尝试（截止时间误用默认的 24 小时），改作 B03，所以条款标题仍是 “B05 overdue test” |
| B04 争议 → 付款给服务方 | #6 | ✅ | P 交付后发起争议，C 补充证据，A 裁决付款；只有 P 获得 0.001（[详情截图](acceptance-screenshots/B04-7-released-order6.png)） | 条款标题写作 “B06” |
| B05 超期未交付退款 | #5 | ✅ | 截止后 C 出现退款按钮（[截图](acceptance-screenshots/B05-5-refund-button-order5.jpg)）、P 没有交付按钮（[截图](acceptance-screenshots/B05-5-no-submit-order5.jpg)）；`refundExpired` 后 C 获得 0.001 | #5 入金时距截止仅 36 秒，“截止前没有退款按钮”这一项用 #1 的[截图](acceptance-screenshots/B05-4-before-deadline-no-refund-order1.jpg)（Funded、截止前）作证据 |

订单 #7、#8 来自其他账户（`0x2548…95d1`、`0x1819…0db6`），不属于本记录。业务测试中未发现 P0 或 P1 缺陷。

### 6.2 资金核对

| 检查时点 | 合约余额 | 托管中 | 待提现 | 余额 = 托管中 + 待提现 |
|---|---|---|---|---|
| B01 验收后、提现前 | 0.003 | 0.002 | 0.001 | ✅ |
| 两次裁决后、提现前 | 0.004 | 0.002 | 0.002 | ✅ |
| 全部提现后 | 0.001 | 0.001 | 0 | ✅（剩余 0.001 是其他成员的订单 #8） |

- 每个结束的订单都只给一方记账，金额等于订单金额：B01、B04 给 P，B03、B05 给 C。
- 最终 C 和 P 的可提余额都是 0。P 共提现 0.002（B01、B04），C 共提现 0.002（B03、B05）。
- C 的一次提现同时领取了 B03 和 B05 两笔退款，证明“一次提现可以领取多笔订单的钱”（需求 F5）。

### 6.3 完整交易记录

“发出事件的合约”一列中，`openDispute` 和 `resolve` 同时有 DisputeResolver 和 EscrowOrders 的事件，这是三个合约相互调用的链上证据。

| 用例 | 时间（SGT） | 订单 | 操作 | 账户 | 说明 | 发出事件的合约 | Gas used | 交易哈希 |
|---|---|---|---|---|---|---|---|---|
| B00 | 15:21:12 | — | `register` | C | Customer | RoleRegistry | 306,843 | [0xb39c4d4e…5a4e25](https://sepolia.etherscan.io/tx/0xb39c4d4eefb87d84e4d778bf957bc286c6709c1e7fdcd88386ed53ad0d5a4e25) |
| B00 | 15:22:36 | — | `register` | P | Provider | RoleRegistry | 306,892 | [0x47604ad2…d5aa9f](https://sepolia.etherscan.io/tx/0x47604ad2aedf21261ceb97f295817230b25b4bb5cd4540a955069fa461d5aa9f) |
| B03 | 15:24:24 | #1 | `createOrder` | C | 0.001 ETH，截止 10-13 15:38 | EscrowOrders | 873,794 | [0x229b9db2…f4d58a](https://sepolia.etherscan.io/tx/0x229b9db2fa087e444f6579bcf7b95f0a91c8b17cf5903362322c66dd6cf4d58a) |
| B03 | 15:26:00 | #1 | `acceptOrder` | P | → Accepted | EscrowOrders | 223,368 | [0x42dc55b4…af781c](https://sepolia.etherscan.io/tx/0x42dc55b4e71240aa60de8a567e46943c47a5cc9593a2ea6d07130921a8af781c) |
| B03 | 15:27:00 | #1 | `fundOrder` | C | → Funded | EscrowOrders | 160,292 | [0x8ff29588…f521fb](https://sepolia.etherscan.io/tx/0x8ff295881ed870c375b7e09bbb320bcb81fe82fa7b90526a291fd71a10f521fb) |
| B02a | 15:28:24 | #2 | `createOrder` | C | 0.001 ETH，截止 10-13 15:33 | EscrowOrders | 775,886 | [0x3d2f3f25…857db7](https://sepolia.etherscan.io/tx/0x3d2f3f2536e341b8574b75bf87484e6c8c368f0ef7cdbbe794b4aec12f857db7) |
| B02b | 15:29:24 | #3 | `createOrder` | C | 0.001 ETH，截止 10-13 16:28 | EscrowOrders | 775,874 | [0x24f86c61…9729d9](https://sepolia.etherscan.io/tx/0x24f86c614cc5ffd679183ba7296b27055b7a04cc47bccbb5708c9c3f549729d9) |
| B02a | 15:30:00 | #2 | `cancelOrder` | C | → Cancelled | EscrowOrders | 223,271 | [0xbd44ab71…117c9d](https://sepolia.etherscan.io/tx/0xbd44ab71aadd7ede3fb48cbfb0c741f3f6a42c09a194fa4b89136a9779117c9d) |
| B02b | 15:31:36 | #3 | `acceptOrder` | P | → Accepted | EscrowOrders | 223,356 | [0x36fd8c70…4cfdb4](https://sepolia.etherscan.io/tx/0x36fd8c70d72d5c2ffda758612222302f5837019814575af63c1531dff54cfdb4) |
| B02b | 15:33:00 | #3 | `cancelOrder` | C | → Cancelled | EscrowOrders | 223,425 | [0x07aa09d4…a07a46](https://sepolia.etherscan.io/tx/0x07aa09d42f95f25b559667ff938474cb02275c5a230660098432a783f9a07a46) |
| B01 | 15:37:12 | #4 | `createOrder` | C | 0.001 ETH，截止 10-13 15:36 | EscrowOrders | 775,874 | [0xb273a9b8…3db4cd](https://sepolia.etherscan.io/tx/0xb273a9b86405808090a5aa35853b6a7d8c556b16db4daa8502511826a43db4cd) |
| B01 | 15:38:36 | #4 | `acceptOrder` | P | → Accepted | EscrowOrders | 223,368 | [0x92c5d10d…70faef](https://sepolia.etherscan.io/tx/0x92c5d10db2e1da3e9673b743d4120dd3eed52070fe97af907ef94bf96b70faef) |
| B01 | 15:39:48 | #4 | `fundOrder` | C | → Funded | EscrowOrders | 62,372 | [0xfde72d29…4f5546](https://sepolia.etherscan.io/tx/0xfde72d2940bc5617aa51fd3688ae4de9951faaee9c3d761cb2396e93084f5546) |
| B01 | 15:41:12 | #4 | `submitDelivery` | P | → Submitted | EscrowOrders | 331,817 | [0x339cd0cb…7aa09b](https://sepolia.etherscan.io/tx/0x339cd0cba04bdcf06d5b8211a5c6b1d47d0235fb99ecad6fe54be4319c7aa09b) |
| B01 | 15:42:12 | #4 | `approveDelivery` | C | → Released | EscrowOrders | 456,709 | [0x0104a805…e4449b](https://sepolia.etherscan.io/tx/0x0104a805d2c8100f6f1c596b2873b014f279a31c402e3274a95324e5cee4449b) |
| B05 | 15:45:00 | #5 | `createOrder` | C | 0.001 ETH，截止 10-12 15:47 | EscrowOrders | 775,874 | [0xb7376782…2a1f35](https://sepolia.etherscan.io/tx/0xb7376782164b0f6b64a91931a493a9ec32a400beaf152f09c2d138e7b02a1f35) |
| B05 | 15:45:36 | #5 | `acceptOrder` | P | → Accepted | EscrowOrders | 223,368 | [0x941ebc8a…6aaead](https://sepolia.etherscan.io/tx/0x941ebc8abb230a2df4657e7e007926464b6c32fa87bbe511c1dd28c97f6aaead) |
| B05 | 15:46:24 | #5 | `fundOrder` | C | → Funded | EscrowOrders | 62,372 | [0xe3ebec38…10e2cf](https://sepolia.etherscan.io/tx/0xe3ebec381cea6cb241ed2946d4b03f61ff3f77e19f916186dc7a99a1ad10e2cf) |
| B01 | 15:56:36 | — | `withdraw` | P | 0.001 ETH 到 P | EscrowOrders | 209,411 | [0x1a0809db…089178](https://sepolia.etherscan.io/tx/0x1a0809dbe741a4b8f36e593469957b64710898601e60edd11f002d3daa089178) |
| B04 | 15:59:00 | #6 | `createOrder` | C | 0.001 ETH，截止 10-13 15:58 | EscrowOrders | 775,874 | [0x3df7b500…71efe4](https://sepolia.etherscan.io/tx/0x3df7b500a2e1a51dddbdfd008feb1c8921e39dd4919e9dbc6b92ff6bba71efe4) |
| B04 | 16:00:00 | #6 | `acceptOrder` | P | → Accepted | EscrowOrders | 223,368 | [0x3f2aefb1…47f3ee](https://sepolia.etherscan.io/tx/0x3f2aefb1d4c4d402776e16b32c7bf48cabff7dbbb15a54dac35c9c04a047f3ee) |
| B04 | 16:00:48 | #6 | `fundOrder` | C | → Funded | EscrowOrders | 62,372 | [0xa01276cd…bc9651](https://sepolia.etherscan.io/tx/0xa01276cdf7f0c6e0fbb4fc84a498c153d47d65a262dfbdb62b4aa02c9bbc9651) |
| B04 | 16:02:00 | #6 | `submitDelivery` | P | → Submitted | EscrowOrders | 331,817 | [0xae6b221a…9458a2](https://sepolia.etherscan.io/tx/0xae6b221a4cc5e396444882c0c539246127a951011cbd67911482426bd19458a2) |
| B04 | 16:02:48 | #6 | `openDispute` | P | → Disputed | DisputeResolver + EscrowOrders | 454,729 | [0xe06d4170…115565](https://sepolia.etherscan.io/tx/0xe06d41704262cf3c5ac4cb980c16b0ad9c601bb09f8b01af22bb9a93dd115565) |
| B03 | 16:03:36 | #1 | `openDispute` | C | → Disputed | DisputeResolver + EscrowOrders | 454,419 | [0x565b5d26…80d7a9](https://sepolia.etherscan.io/tx/0x565b5d2672a089819985ed78b2c64078bb46777bb470657d005c18f6cd80d7a9) |
| B04 | 16:04:12 | #6 | `addEvidence` | C | — | DisputeResolver | 223,686 | [0xc4d96654…8d8837](https://sepolia.etherscan.io/tx/0xc4d9665428fa9f40568e64c608cf5c93105c8557cff97a5231f61af0bd8d8837) |
| B03 | 16:05:24 | #1 | `addEvidence` | P | — | DisputeResolver | 223,753 | [0xc62a45ac…ce97e9](https://sepolia.etherscan.io/tx/0xc62a45acacf5d004e2c311fd13bb53855c7fed37d8718114457d6feb84ce97e9) |
| B03 | 17:07:48 | #1 | `resolve` | A | 裁决退款给客户 | DisputeResolver + EscrowOrders | 582,132 | [0xb860fae2…6e2dd2](https://sepolia.etherscan.io/tx/0xb860fae2717150a1a631385c0a2ac503da1b082b7d4797ae22d0e1a1086e2dd2) |
| B04 | 17:08:36 | #6 | `resolve` | A | 裁决付款给服务方 | DisputeResolver + EscrowOrders | 484,210 | [0x9d7f817f…71b432](https://sepolia.etherscan.io/tx/0x9d7f817f6aadddf73b4767552bb0c4e9aea38f8504eb77f3b7ea0d15fc71b432) |
| B05 | 17:16:00 | #5 | `refundExpired` | C | → Refunded | EscrowOrders | 260,991 | [0x285b5cad…07b250](https://sepolia.etherscan.io/tx/0x285b5cadc9cadb36075a82ee8bac10cc0dfecdf8485c2b19faf24b0bee07b250) |
| B03+B05 | 17:16:36 | — | `withdraw` | C | 0.002 ETH 到 C | EscrowOrders | 221,015 | [0xd238578d…b53009](https://sepolia.etherscan.io/tx/0xd238578d2d97962a6ead0d31afa0ce76786d980e3d7519f5f01dedac82b53009) |
| B04 | 17:17:36 | — | `withdraw` | P | 0.001 ETH 到 P | EscrowOrders | 209,411 | [0x187ba7bd…3effe6](https://sepolia.etherscan.io/tx/0x187ba7bd80e680d6274b661f96eb95418513c4b38e03e95944aa95c9193effe6) |

### 6.4 Gas：Sepolia 实测与本地测试对比

| 操作 | Sepolia 实测 | 本地 Ganache（`gas-samples.json`） | 倍数 |
|---|---|---|---|
| `register` | 306,843 | 45,469 | 6.7× |
| `createOrder` | 775,874（第一单 873,794） | 154,889 | 5.0× |
| `acceptOrder` | 223,368 | 42,802 | 5.2× |
| `fundOrder` | 62,372（第一次 160,292） | 65,072 | 1.0× |
| `submitDelivery` | 331,817 | 63,213 | 5.2× |
| `approveDelivery` | 456,709 | 88,103 | 5.2× |
| `cancelOrder` | 223,271 | 42,705 | 5.2× |
| `openDispute` | 454,419 | 97,407 | 4.7× |
| `addEvidence` | 223,686 | 49,969 | 4.5× |
| `resolve` | 484,210（付款）/ 582,132（退款） | 124,568 / 124,558 | 3.9× / 4.7× |
| `refundExpired` | 260,991 | 88,237 | 3.0× |
| `withdraw` | 209,411 | 49,872 | 4.2× |

- `fundOrder` 是唯一直接调用合约的交易，gas 和本地基本一样，说明合约逻辑本身的开销没有变化。
- 其他交易都经 MetaMask 智能账户转发。`acceptOrder` 和 `cancelOrder` 都只修改已有的存储位，两者都比本地正好多出 180,566 gas，这是两个样本中观察到的相同差值，不能据此认定所有转发交易都有固定开销。
- 写入新存储位的交易会额外更贵：第一次入金要把 `lockedTotal` 从 0 写成非 0，用了 160,292，之后同样的入金只要 62,372。
- B01 完整流程共 2,059,551 gas。假设主网 gas 价格为 0.06 gwei、ETH 为 2,544 美元，折算约 0.31 美元；假设 1 gwei 则约 5.24 美元。这是敏感性情景，不是 Sepolia 实际美元支出；原始价格响应未归档，也不包含部署、注册、仲裁、法币兑换和托管服务费用。
- 建议负责 gas 分析的成员把“合约本身的开销”和“钱包转发的开销”分开讨论；需要更贴近合约本身的数据时，可以用没有升级为智能账户的普通账户重测。

**签名前估算与实测（F7）**：审核弹窗的 `Estimated gas units` 来自 `estimateGas`，`Estimated fee ceiling` 按估算值加 20% 计算（[截图](acceptance-screenshots/F7-createOrder-gas-estimate.webp)：2026-10-12 对一笔新的 `createOrder` 估算后点了 Cancel，没有发交易）。实际 gas limit 和用量由公开节点读取。

| 交易 | 应用估算 | 应用给的 gas limit（估算 × 1.2） | 实际 gas limit | 实际 gas used | 发送方式 |
|---|---|---|---|---|---|
| `fundOrder`（B01） | 63,202（由 gas limit 反推） | 75,842 | 75,842 | 62,372 | 直接调用 EscrowOrders |
| `createOrder`（估算取自 F7 截图，实际取自 B01） | 602,201 | 722,641 | 883,670 | 775,874 | 经 MetaMask `DelegationManager` 转发 |

- `fundOrder` 的 63,202 是由已记录 gas limit 反推的近似值；与实际 62,372 相差约 1.3%，不是独立保存的签名前估算截图。
- `createOrder` 的截图属于取消的新订单，实测属于此前 B01；这是跨样本的说明性对比，不能作为同一交易的估算误差实验，也不能证明某次交易必然低估 29%。
- 该对比提示智能账户转发可能使最终钱包交易费用高于应用的合约调用估算。固定另加 18 万 gas 的规则未经验证；应以钱包最终确认页为准，并在后续同一交易实验中同时记录估算、钱包 gas limit 和 receipt。
- F7 的估算展示已验收；F8 优化前后对照仍需负责成员补充，不能用这张表代替优化实验。

### 6.5 执行中发现的问题（可写进报告的局限与改进）

- **截止时间默认是 24 小时后**：B05 第一次尝试忘了修改，订单当天无法超期退款。可以在表单上加提示，或在测试步骤里专门提醒。
- **事件窗口约 3.3 小时**：注册记录大约 18:40 起、争议记录大约 19:20 起会从网页上消失，链上数据仍在。#1、#6 的争议详情已提前截图（见 6.6）。
- **智能账户费用提示需进一步验证**：跨样本对比提示应用估算可能未覆盖最终钱包转发成本，见 6.4；尚未做同一交易的完整前后记录。
- **全局数字含其他组员的订单**：订单总数、托管金额和待提现金额包括 #7、#8，对账要按订单和账户逐项核对。
- **记录文字过于简单**：测试中写的 “aa”“test” 等只适合测试，正式演示应改用贴近真实业务的描述。

### 6.6 截图索引

截图都来自线上版本，存放在 [`acceptance-screenshots/`](acceptance-screenshots/)。浏览器书签栏已裁掉；B03、B04 的最终详情是页面局部截图。“视角”指截图时 MetaMask 连接的账户。

| 截图 | 用例 · 步骤 | 视角 | 显示内容 |
|---|---|---|---|
| [B01-1-created-order4](acceptance-screenshots/B01-1-created-order4.jpg) | B01 · 1 | P | P 看到新订单 #4 为 `Created` |
| [B01-2-accepted-order4](acceptance-screenshots/B01-2-accepted-order4.jpg) | B01 · 2 | P | 接单确认（gas used 223,368），#4 为 `Accepted` |
| [B01-3-funded-order4](acceptance-screenshots/B01-3-funded-order4.jpg) | B01 · 3 | C | #4 为 `Funded`，C 只剩 `Open dispute` |
| [B01-4-before-submit-order4](acceptance-screenshots/B01-4-before-submit-order4.jpg) | B01 · 4 | P | P 可以 `Submit delivery` |
| [B01-4-submitted-order4](acceptance-screenshots/B01-4-submitted-order4.jpg) | B01 · 4 | P | #4 为 `Submitted`，交付记录 `Hash verified` |
| [B01-5-before-approve-order4](acceptance-screenshots/B01-5-before-approve-order4.jpg) | B01 · 5 | C | C 可以 `Approve delivery` |
| [B01-5-released-order4](acceptance-screenshots/B01-5-released-order4.jpg) | B01 · 5 | C | #4 为 `Released`，不再有操作按钮 |
| [B01-6-provider-balance](acceptance-screenshots/B01-6-provider-balance.jpg) | B01 · 6 | P | P 可提余额 0.001，`Withdraw ETH` 可点 |
| [B02-1-created-orders2-3](acceptance-screenshots/B02-1-created-orders2-3.jpg) | B02 · 1、4 | C | #2、#3 为 `Created` |
| [B02-2-cancelled-order2](acceptance-screenshots/B02-2-cancelled-order2.jpg) | B02 · 2 | C | #2 为 `Cancelled` |
| [B02-3-provider-list](acceptance-screenshots/B02-3-provider-list.jpg) | B02 · 3 | P | P 的列表：#2 `Cancelled`，#3 仍为 `Created` |
| [B02-3-no-accept-order2](acceptance-screenshots/B02-3-no-accept-order2.jpg) | B02 · 3 | P | #2 详情没有 `Accept order` |
| [B02-5-accepted-order3](acceptance-screenshots/B02-5-accepted-order3.jpg) | B02 · 5 | P | #3 为 `Accepted` |
| [B02-6-before-cancel-order3](acceptance-screenshots/B02-6-before-cancel-order3.jpg) | B02 · 6 | C | #3 有 `Fund escrow` 和 `Cancel order` |
| [B02-6-cancelled-order3](acceptance-screenshots/B02-6-cancelled-order3.jpg) | B02 · 6 | C | #3 为 `Cancelled`，不再有 `Fund escrow` |
| [B03-1-create-order1](acceptance-screenshots/B03-1-create-order1.jpg) | B03 · 1 | C | 创建确认（gas used 873,794），#1 为 `Created` |
| [B03-6-customer-balance](acceptance-screenshots/B03-6-customer-balance.jpg) | B03 · 6 | C | 裁决后 C 可提余额 0.001 |
| [B03-6-refunded-order1](acceptance-screenshots/B03-6-refunded-order1.png) | B03 · 6 | — | #1 为 `Refunded`；争议原因、证据、裁决都 `Hash verified` |
| [B04-7-provider-balance](acceptance-screenshots/B04-7-provider-balance.jpg) | B04 · 7 | P | 裁决后 P 可提余额 0.001 |
| [B04-7-released-order6](acceptance-screenshots/B04-7-released-order6.png) | B04 · 7 | — | #6 为 `Released`；交付、争议原因、证据、裁决都 `Hash verified` |
| [B05-2-accepted-order5](acceptance-screenshots/B05-2-accepted-order5.jpg) | B05 · 2 | C | #5 为 `Accepted`，截止 10-12 15:47 |
| [B05-4-before-deadline-no-refund-order1](acceptance-screenshots/B05-4-before-deadline-no-refund-order1.jpg) | B05 · 4 | C | #1 已入金、未到截止：没有 `Refund overdue order` |
| [B05-5-refund-button-order5](acceptance-screenshots/B05-5-refund-button-order5.jpg) | B05 · 5 | C | 截止后出现 `Refund overdue order` |
| [B05-5-no-submit-order5](acceptance-screenshots/B05-5-no-submit-order5.jpg) | B05 · 5 | P | 截止后 P 没有 `Submit delivery` |
| [F7-createOrder-gas-estimate](acceptance-screenshots/F7-createOrder-gas-estimate.webp) | F7 | C | 签名前审核弹窗：估算 602,201 gas，费用上限约 0.00072 ETH |

## 7 集成审查补充（2026-10-12）

32 笔交易 receipt、gas、事件及当前订单状态已由开发负责人通过只读 RPC 独立复核，证据见 [`review/business-chain-review.json`](review/business-chain-review.json)，解释和最终报告待修订项见 [`review/PR_REVIEW_ZH.md`](review/PR_REVIEW_ZH.md)。原始 PDF v3 和 Problem Analysis v2 尚需作者同步交易计数及分析措辞；本节不改变原始截图或历史测试记录。
