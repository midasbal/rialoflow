# RialoFlow — Autonomous Treasury Storyboard

> RialoFlow is a small interactive storyboard about autonomous finance and self‑driving treasuries.

> There is no real money, no blockchain, and no smart contracts here. It’s a front‑end simulation that makes it easier to *see* how a treasury could manage itself with rules, risk signals, and scheduled actions.

---

## What Is This?

RialoFlow takes a simple treasury portfolio (USDC, T‑Bills, corporate bonds, and cash) and walks through a short scenario:

1. **T+0 – Initial State**
   - Balanced starting position. Policies are armed but not triggered.

2. **T+1 – Market Shock**
   - A sudden hit to bond prices shocks the portfolio.

3. **T+2 – Auto‑Rebalance**
   - The reserve ratio falls below target, so the policy sells riskier assets and buys T‑Bills.

4. **T+3 – Yield Distribution**
   - A scheduled event distributes accumulated yield to holders.

At each step you can see:

- The **total value** and how it changed from the previous step (deltas)
- A simplified **Risk Score (0–100)** reacting to the scenario
- A short **Simulation Log** describing what just happened

---

## What Can You Do?

On the main screen you can:

### 1. Inspect the Treasury

- View the breakdown of:
  - USDC reserves
  - T‑Bills
  - Corporate bonds
  - Cash
- See:
  - Total portfolio value
  - A basic **reserve ratio**
  - A toy **Risk Score** (0–100) that moves with your settings

> This is not real risk modeling – just a signal for how an autonomous treasury might “feel” stress.

### 2. Tweak the Policies

Use the **Policy & Automation Rules** panel to:

- Adjust:
  - **Market Shock** magnitude
  - **Target Reserve Ratio**
  - **Yield Distribution** percentage
- Or load scenario presets:
  - **Conservative**, **Balanced**, **Aggressive** – each resets the sim with a different “treasury personality”.
- See a **Policy Preview** box that shows a pseudo on‑chain policy format, e.g.:

```txt
policy: "reserve_guardrail" {
  when reserve_ratio < target_ratio {
    sell "bonds"
    buy "tBills"
  }
}

policy: "monthly_yield" {
  at every month_end {
    distribute yield_percent to holders
  }
}
```

This preview is demonstrative, and in the app it can reflect the current slider values.

### 3. Play the Story

Step through T+0 → T+3 and compare:

- Traditional: Bots, cron jobs, ad‑hoc scripts, human coordination.
- Rialo‑style: On‑chain programs, native schedulers, and real‑world data feeds.

Watch:

- How total value and deltas evolve
- How the Risk Score responds
- Which policy was effectively “triggered”
- Read the Simulation Log at the bottom as a mini trace of the treasury’s decisions

---

## Why This Exists

Today, this kind of behavior typically depends on:

- Off‑chain bots and keeper networks
- Cron jobs and long‑lived scripts
- Bundled transactions and manual coordination

The Rialo vision is closer to:

- On‑chain programs with native scheduling and real‑world data
- Fewer opaque bots and external scripts
- More transparent, auditable on‑chain policies

RialoFlow does not run on Rialo. It’s a self‑contained, off‑chain demo:

- An educational toy to explore what a self‑driving treasury on something like Rialo could feel like.
- A design and product exploration of how rules, risk, and scheduling might be expressed in a UI.
- The Risk Score, presets, and all the math in this project are intentionally simplified — they explain ideas, not provide financial advice or real‑world models.

## Who Is It For?

- People in DeFi/crypto curious about autonomous finance
- Builders and designers thinking about treasuries, risk, and automation
- Anyone who likes to move sliders, press Play, and watch systems react

You can safely “break” the treasury, reload presets, and rerun the story as many times as you like.

## Tech Stack (High‑Level)

- Frontend: HTML, CSS, vanilla JavaScript
- State & Simulation: Simple in‑browser model driving timeline steps, risk score, deltas, and a simulation log
- No backend, no external APIs, no frameworks

## Quick Start

1. Clone or copy this repository to your machine.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
3. Interact with the Policy sliders, use presets, and step through T+0 → T+3.

Optional local workflow (Git + PowerShell):

```powershell
git add README.md
git commit -m "chore: add README for RialoFlow storyboard"
git push origin main
```

## License & Disclaimer

RialoFlow is provided as an educational demo. It is not financial advice. The simulation uses simplified logic and toy signals for illustrative purposes only.

## Contributing

Bug reports, UI suggestions, and small improvements are welcome. Open an issue or a PR on the GitHub repository where you host this project.

---

If you want this README also translated to Turkish or slightly shortened for a GitHub project front page, tell me how formal or short you want it and I’ll provide a variant.

***
Created for use on GitHub by the RialoFlow project.
***
