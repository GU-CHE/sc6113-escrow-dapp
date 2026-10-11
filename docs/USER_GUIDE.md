# User guide

Use Sepolia test ETH only. All descriptions and links are public. Do not enter private personal information, keys or recovery phrases.

1. Open the HTTPS Render URL in a desktop browser with MetaMask, or in the MetaMask mobile browser.
2. Select Sepolia, connect your wallet and sign the login message. Login is not a payment.
3. Register once as Customer or Service provider. Use separate wallets for the two roles. The deployment wallet is the fixed Administrator.
4. Provider registers before a customer creates an order addressed to that provider.
5. Customer creates an order with scope, price, provider address and deadline within 90 days.
6. Provider opens the order and accepts. Customer then funds the exact test ETH amount.
7. Provider submits a public delivery description/link before the deadline. Customer reviews and approves.
8. Provider selects Withdraw ETH to collect credited payments.
9. Either participant can dispute a funded/submitted order and add public evidence. Administrator selects the final full refund or provider payment. The recipient then withdraws.
10. Customer may cancel Created/Accepted orders, or refund a Funded order after the delivery deadline if no work was submitted.

Review the contract, test ETH value and gas estimate before confirming in MetaMask. A submitted transaction is not confirmed until a receipt is shown. If a request times out, inspect history/the explorer and refresh before retrying.

Order lists page newest first; Load older orders to browse further. Event history is the latest 100 decoded events from a 1,000-block window. Refresh explicitly after another user acts. Metadata is hash-verified when loaded. If text is unavailable, the on-chain hash and funds/state remain accessible.

## Presentation outline

Problem and credible evidence (1 minute); why blockchain (1 minute); architecture and three-contract interaction (1 minute); main lifecycle with MetaMask and receipt (4 minutes); dispute or permission failure (1 minute); tests, Gas and evaluation (1 minute); limitations and contributions (1 minute). Prepare orders in multiple states and record a backup video. Do not claim real deployment or phone acceptance until completed.
