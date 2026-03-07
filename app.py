import base64
import json
import random
from dataclasses import dataclass
from typing import Dict, List, Optional

import streamlit as st
import streamlit.components.v1 as components

# ==================================================
# ------------- CONFIG & CONSTANTS -----------------
# ==================================================
st.set_page_config(page_title="Keystone Ventures", layout="wide")

HOME_BG = "home_bg.png"
MAP_BG  = "map_bg.png"

LEVEL_CHUNK_SIZE    = 40
LEVEL_X_JITTER      = 8    # px jitter side-to-side (as % of container)
LEVEL_SPACING_PX    = 120  # vertical pixels between torch rows
MAP_TOP_PAD_PX      = 100  # padding at top of the inner map div
MAP_BOT_PAD_PX      = 180  # padding at bottom (where level-1 torch sits)


# ==================================================
# ----------------- DATA MODEL ---------------------
# ==================================================
@dataclass
class Level:
    id: int
    risk: str
    capital: str
    reward: str
    narrative: str
    x: float   # % from left (for horizontal placement)


def procedural_risk(level_id: int) -> str:
    if level_id <= 3:  return "Foundation"
    if level_id <= 8:  return "Measured"
    if level_id <= 15: return "Speculative"
    if level_id <= 25: return "Frontier"
    return "Abyssal"


def procedural_capital(level_id: int) -> str:
    return f"${250_000 * (1 + level_id // 3):,}"


def procedural_reward(level_id: int) -> str:
    return f"{2 + (level_id ** 1.2) / 4:0.1f}x potential"


def procedural_narrative(level_id: int) -> str:
    templates = [
        "An overlooked seam of talent buried under legacy markets.",
        "An unstable cavern of infra where few dare to tread.",
        "A forgotten shard of a once-crowded thesis, now strangely quiet.",
        "A glowing fault line between regulation and raw demand.",
        "A narrow bridge over a chasm of execution risk.",
    ]
    return templates[level_id % len(templates)]


def generate_levels(start: int = 1, count: int = LEVEL_CHUNK_SIZE) -> List[Level]:
    levels: List[Level] = []
    for i in range(count):
        lvl = start + i
        x_center = 48 + random.randint(-LEVEL_X_JITTER, LEVEL_X_JITTER)
        levels.append(Level(
            id=lvl,
            risk=procedural_risk(lvl),
            capital=procedural_capital(lvl),
            reward=procedural_reward(lvl),
            narrative=procedural_narrative(lvl),
            x=x_center,
        ))
    return levels


LEVELS: List[Level] = generate_levels()
LEVEL_INDEX: Dict[int, Level] = {l.id: l for l in LEVELS}


def level_top_px(lvl_id: int) -> int:
    """
    Compute the absolute top position (in px) for a torch within #kv-map-inner.
    Level 1  → near the BOTTOM (user starts here, scrolls up to go deeper).
    Level 40 → near the TOP.
    """
    return MAP_TOP_PAD_PX + (LEVEL_CHUNK_SIZE - lvl_id) * LEVEL_SPACING_PX


def map_inner_height_px() -> int:
    return MAP_TOP_PAD_PX + (LEVEL_CHUNK_SIZE - 1) * LEVEL_SPACING_PX + MAP_BOT_PAD_PX


# ==================================================
# --------------- COMPANY MODEL --------------------
# ==================================================
@dataclass
class Company:
    id: str
    name: str
    tagline: str
    team: int            # 1–5
    market: int          # 1–5
    traction: int        # 1–5
    technology: int      # 1–5
    unit_economics: int  # 1–5
    moat: int            # 1–5
    description: str     # analyst-style flavour text
    ask: int             # suggested investment amount


# ── Level 1 companies (tutorial: TEAM is the differentiator) ──────
LEVEL_1_COMPANIES: List[Company] = [
    Company(
        id="l1_arboris",
        name="Arboris Labs",
        tagline="Precision OS for controlled-environment agriculture",
        team=5, market=3, traction=2, technology=4,
        unit_economics=2, moat=3,
        description=(
            "Two-time founders with a prior exit and PhDs in ag-systems. "
            "Early stage, but extremely credible. The team is what makes "
            "this investable."
        ),
        ask=150_000,
    ),
    Company(
        id="l1_ventra",
        name="Ventra Fleet",
        tagline="Real-time route optimisation SaaS for mid-market logistics",
        team=3, market=5, traction=3, technology=3,
        unit_economics=4, moat=2,
        description=(
            "First-time founders in a massive, booming market. Smart but "
            "untested. The market would forgive a lot — if the team can "
            "execute under pressure."
        ),
        ask=200_000,
    ),
    Company(
        id="l1_noctem",
        name="Noctem Health",
        tagline="Adaptive sleep-health platform for shift workers",
        team=2, market=4, traction=2, technology=3,
        unit_economics=2, moat=2,
        description=(
            "Solo clinical researcher pivoting into tech. Compelling "
            "thesis, thin founding team. Great insight — but who will "
            "build and sell it?"
        ),
        ask=100_000,
    ),
]

LEVEL_TUTORIALS: Dict[int, Dict] = {
    # ── Tutorial levels ────────────────────────────────────────────────────────
    1: {
        "title": "FIRST SIGNALS",
        "focus": ["TEAM", "MARKET"],
        "metric_keys": ["team", "market"],
        "threshold": 3,
        "rounds": 3,
        "lesson": (
            "Every investment starts with two fundamental questions: who is "
            "building this, and how large is the opportunity? A brilliant team "
            "in a dying market has no engine. A massive market with an "
            "unqualified team has no steering. Both must clear the bar."
        ),
    },
    2: {
        "title": "THE FULL PICTURE",
        "focus": ["TRACTION", "TECHNOLOGY", "ECONOMICS"],
        "metric_keys": ["traction", "technology", "unit_economics"],
        "threshold": 3,
        "rounds": 2,
        "lesson": (
            "Vision and people aren't enough. Can they build it, are customers "
            "responding, and does the business model hold? Traction, technology, "
            "and unit economics are where great stories either prove themselves "
            "or quietly fall apart."
        ),
    },
    # ── Game levels (all metrics visible, real capital) ────────────────────────
    3: {
        "title": "FIRST DESCENT",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Training is over. This is a live investment run — all six metrics "
            "are on the table and capital is real. Size each position carefully: "
            "there is no undo."
        ),
        "invest_steps": [50_000, 100_000, 250_000, 500_000],
    },
    4: {
        "title": "THE SECOND WAVE",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Second-wave companies often look like first-wave failures — same "
            "thesis, different timing. The market was right all along; the first "
            "movers were just too early. Look for teams that learned from what "
            "broke before them."
        ),
        "invest_steps": [50_000, 100_000, 250_000, 500_000],
    },
    5: {
        "title": "NOISE FLOOR",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Every signal in venture is wrapped in noise. Founders spin, "
            "markets hype, and decks are designed to impress. Your edge is "
            "in cutting through the narrative and reading the underlying "
            "numbers with cold clarity."
        ),
        "invest_steps": [75_000, 150_000, 300_000, 500_000],
    },
    6: {
        "title": "THE INFORMED BET",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Conviction is scarce and expensive. The best investors don't "
            "spread thin — they concentrate capital on the ideas they believe "
            "in most. Every dollar you hold back is a dollar not compounding. "
            "Size your positions with intention."
        ),
        "invest_steps": [75_000, 150_000, 350_000, 600_000],
    },
    7: {
        "title": "DEAD RECKONING",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Deep in the descent now. You have no guarantees, no map, and no "
            "oracle — only the data in front of you. Dead reckoning is "
            "navigation by known speed and heading, not landmarks. Trust your "
            "framework and commit."
        ),
        "invest_steps": [100_000, 200_000, 400_000, 750_000],
    },
    8: {
        "title": "OPERATOR'S EDGE",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Pattern recognition is the investor's compounding asset. You've "
            "now seen enough deals to start building instinct. When a company's "
            "profile feels familiar — good or bad — trust that instinct, then "
            "verify it against the metrics."
        ),
        "invest_steps": [100_000, 200_000, 400_000, 750_000],
    },
    9: {
        "title": "THE CONTRARIAN PLAY",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "The best returns come from being right when everyone else is wrong. "
            "A weak market metric might signal timing, not ceiling. A low "
            "traction score in a pre-product company is expected, not damning. "
            "Context distinguishes contrarian from reckless."
        ),
        "invest_steps": [100_000, 250_000, 500_000, 750_000],
    },
    10: {
        "title": "CRISIS CAPITAL",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Downturns are the proving ground for serious investors. When "
            "sentiment collapses and valuations reset, the fundamentals "
            "matter more — not less. The companies with strong unit economics "
            "and real moats survive. Back the survivors."
        ),
        "invest_steps": [50_000, 200_000, 500_000, 1_000_000],
    },
    11: {
        "title": "THE SCARCITY ROUND",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Capital is finite. Every position you take forecloses another. "
            "The real discipline isn't knowing when to invest — it's knowing "
            "when to pass. An empty allocation slot is not a failure; it is "
            "optionality preserved for the right deal."
        ),
        "invest_steps": [150_000, 300_000, 600_000, 1_000_000],
    },
    12: {
        "title": "THE DEEP CAVE",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Well past halfway now. The air is thinner here — fewer obvious "
            "opportunities, higher concentration of risk. The companies "
            "reaching you at this depth are either genuinely exceptional or "
            "deeply flawed. There is almost nothing in between."
        ),
        "invest_steps": [200_000, 400_000, 750_000, 1_000_000],
    },
    13: {
        "title": "SYNTHETIC SIGNALS",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "At this stage, every founder has rehearsed their story. The metrics "
            "are polished, the narrative is tight. Your job is to find what "
            "doesn't fit — the outlier data point, the mismatched claim, the "
            "metric that should be higher given the rest. Gaps reveal truth."
        ),
        "invest_steps": [200_000, 500_000, 750_000, 1_500_000],
    },
    14: {
        "title": "THE COLD SEAM",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Pressure and temperature rise together this deep. Decisions that "
            "felt straightforward at the surface are now weighted with real "
            "consequence. Your capital base has either grown or shrunk based "
            "on prior calls. Adjust your sizing accordingly."
        ),
        "invest_steps": [250_000, 500_000, 1_000_000, 1_500_000],
    },
    15: {
        "title": "FAULT LINES",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "Risk is not the enemy — uncompensated risk is. A company with "
            "weak moat and strong traction might grow fast and die young. "
            "One with strong moat and weak market may stagnate forever. The "
            "combination of metrics tells the full story; any single one lies."
        ),
        "invest_steps": [250_000, 500_000, 1_000_000, 2_000_000],
    },
    16: {
        "title": "THE LAST DESCENT",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "One level from the summit. Your choices here will define your "
            "final capital position. The companies at this depth are the "
            "rarest kind — fully formed bets that could either compound "
            "your gains into legend or erase what remains. Choose deliberately."
        ),
        "invest_steps": [300_000, 750_000, 1_500_000, 2_500_000],
    },
    17: {
        "title": "THE SUMMIT",
        "focus": "ALL",
        "mode": "game",
        "lesson": (
            "You are at the deepest point of the cave — and the highest point "
            "of your career. Every framework you've built, every pattern you've "
            "learned, every mistake you've survived has led here. Three "
            "companies. Unlimited ambition. No second chances. Invest accordingly."
        ),
        "invest_steps": [500_000, 1_000_000, 2_000_000, 5_000_000],
    },
}

# ── Level 1 tutorial company generation ───────────────────────────
_NAME_PARTS: List[List[str]] = [
    ["Arbo", "Vexa", "Noca", "Flyx", "Omni", "Plex", "Tera", "Nova",
     "Apex", "Crux", "Luma", "Sync", "Kova", "Zinc", "Aura", "Celo",
     "Prex", "Velo", "Sora", "Axon"],
    ["ris", "tra", "tem", "flow", "sys", "core", "Labs", "Works",
     "AI", "HQ", "Net", "Hub", "Tech", "Forge", "Ops", "IO",
     "Ware", "Bolt", "Grid", "Shift"],
]
_TAGLINES: List[str] = [
    "Reimagining {domain} for the {market} era.",
    "The operating system for {domain}.",
    "Automating {domain} at scale.",
    "{market}-native infrastructure for {domain}.",
    "Connecting the fragmented {domain} market.",
    "AI-powered {domain} for the modern enterprise.",
    "The future of {domain} starts here.",
    "Data intelligence for {domain} leaders.",
    "Disrupting {domain} from the ground up.",
    "Next-gen {domain} built for the {market} world.",
]
_DOMAINS: List[str] = [
    "logistics", "healthcare delivery", "fintech compliance", "agri-tech",
    "climate risk", "legal operations", "commercial real estate", "edtech",
    "supply chain", "insurance underwriting", "workforce management",
    "procurement", "fleet operations", "digital health",
]
_MARKETS: List[str] = [
    "cloud-first", "AI-native", "mobile-first", "post-pandemic",
    "distributed-work", "Gen-Z", "next-generation", "enterprise",
]

TEAM_PROFILES: Dict[int, Dict[str, str]] = {
    1: {
        "label": "Solo / Unproven",
        "desc": (
            "Single founder with no prior startup experience. "
            "Execution risk is extreme — one illness, one pivot, and "
            "the company can stall entirely."
        ),
    },
    2: {
        "label": "Early Team / Thin",
        "desc": (
            "Small founding team, limited relevant experience. "
            "Key gaps in technical or commercial leadership remain unfilled. "
            "Dependency risk is high."
        ),
    },
    3: {
        "label": "Functional / Average",
        "desc": (
            "Balanced team with some domain expertise. Credible but not "
            "exceptional — capable of execution in calm conditions, but "
            "unproven under real pressure."
        ),
    },
    4: {
        "label": "Strong / Experienced",
        "desc": (
            "Experienced founders with relevant track records. "
            "Demonstrates execution capability and ability to attract talent. "
            "High confidence in the team's ability to navigate adversity."
        ),
    },
    5: {
        "label": "World-Class",
        "desc": (
            "Serial founders or recognised domain leaders. Exceptional "
            "network, fundraising ability, and pattern-recognition. "
            "This team is often reason enough to invest."
        ),
    },
}

MARKET_PROFILES: Dict[int, Dict[str, str]] = {
    1: {
        "label": "Micro / Niche",
        "desc": (
            "Tiny addressable market with a limited growth ceiling. "
            "Even perfect execution yields a small outcome — not venture-scale."
        ),
    },
    2: {
        "label": "Small / Fragmented",
        "desc": (
            "Limited market size or highly fragmented with no clear consolidator. "
            "Difficult to build a scalable business without significant aggregation."
        ),
    },
    3: {
        "label": "Moderate / Regional",
        "desc": (
            "Decent market size but growth is slow or the opportunity is "
            "geographically limited. Serviceable, but not a venture-scale thesis."
        ),
    },
    4: {
        "label": "Large / Growing",
        "desc": (
            "Significant market with clear growth tailwinds. The tide is rising — "
            "execution matters more than luck. A strong team here can build something big."
        ),
    },
    5: {
        "label": "Massive / Explosive",
        "desc": (
            "Category-defining market opportunity. The kind of TAM that venture "
            "capital is built to fund. Timing and tailwinds are exceptional."
        ),
    },
}

TRACTION_PROFILES: Dict[int, Dict[str, str]] = {
    1: {
        "label": "No Traction",
        "desc": (
            "Pre-revenue, pre-customer. Nothing but a pitch deck. "
            "The idea may be compelling, but there's no market validation yet."
        ),
    },
    2: {
        "label": "Early Signals",
        "desc": (
            "A handful of design partners or letters of intent. Interest is there, "
            "but it's too early to read the signal clearly."
        ),
    },
    3: {
        "label": "Emerging Proof",
        "desc": (
            "Early paying customers and measurable growth. The market is beginning "
            "to respond — enough signal to take seriously at this stage."
        ),
    },
    4: {
        "label": "Strong Pull",
        "desc": (
            "Clear revenue growth, strong retention, and organic word-of-mouth. "
            "The product is finding its market and the numbers confirm it."
        ),
    },
    5: {
        "label": "Breakout Momentum",
        "desc": (
            "Exceptional growth that speaks for itself. The kind of traction that "
            "attracts term sheets before the deck is finished."
        ),
    },
}

TECHNOLOGY_PROFILES: Dict[int, Dict[str, str]] = {
    1: {
        "label": "Commodity Stack",
        "desc": (
            "Off-the-shelf tooling with no proprietary layer. Anyone with a weekend "
            "and a credit card can replicate this."
        ),
    },
    2: {
        "label": "Minor Differentiation",
        "desc": (
            "Some customisation, but nothing deeply defensible. A well-funded "
            "competitor could catch up within months."
        ),
    },
    3: {
        "label": "Functional Advantage",
        "desc": (
            "Meaningful technical capability that works today. Defensible in the "
            "short term but not yet a structural moat."
        ),
    },
    4: {
        "label": "Strong IP / Architecture",
        "desc": (
            "Proprietary algorithms, novel architecture, or deep data assets. "
            "Difficult for competitors to replicate without equivalent investment."
        ),
    },
    5: {
        "label": "Category-Defining Tech",
        "desc": (
            "Breakthrough capability that defines a new category. Years of research, "
            "patents, or unique data give it lasting and compounding protection."
        ),
    },
}

ECONOMICS_PROFILES: Dict[int, Dict[str, str]] = {
    1: {
        "label": "Deeply Negative",
        "desc": (
            "Every customer acquired costs far more than they generate. "
            "The business model requires a fundamental rethink before scaling."
        ),
    },
    2: {
        "label": "Structurally Challenged",
        "desc": (
            "Losses per unit are significant. Relies entirely on future pricing "
            "power or cost efficiencies that haven't materialised yet."
        ),
    },
    3: {
        "label": "Near Breakeven",
        "desc": (
            "Unit economics are marginal but a visible path to profitability exists. "
            "Scale may cure the remaining issues if execution holds."
        ),
    },
    4: {
        "label": "Healthy Margins",
        "desc": (
            "Positive or near-positive unit economics with a clear path to strong "
            "margins at scale. The business model is fundamentally sound."
        ),
    },
    5: {
        "label": "Exceptional Economics",
        "desc": (
            "High-margin, capital-efficient business with strong customer LTV. "
            "Each unit of growth compounds the overall health of the business."
        ),
    },
}

LEVEL_PROFILES: Dict[int, Dict[int, Dict[str, str]]] = {
    1: TEAM_PROFILES,
    2: MARKET_PROFILES,
    3: TRACTION_PROFILES,
    4: TECHNOLOGY_PROFILES,
    5: ECONOMICS_PROFILES,
}

# Keyed by metric_key — used by multi-metric tutorial result screen
METRIC_PROFILES: Dict[str, Dict[int, Dict[str, str]]] = {
    "team":          TEAM_PROFILES,
    "market":        MARKET_PROFILES,
    "traction":      TRACTION_PROFILES,
    "technology":    TECHNOLOGY_PROFILES,
    "unit_economics": ECONOMICS_PROFILES,
}

# Human-readable label for each metric key
_MK_LABEL: Dict[str, str] = {
    "team": "TEAM", "market": "MARKET", "traction": "TRACTION",
    "technology": "TECHNOLOGY", "unit_economics": "ECONOMICS", "moat": "MOAT",
}

COIN_REWARD      = 50  # coins awarded per correct call
ROUNDS_PER_LEVEL = 3   # companies evaluated per level


def generate_tutorial_company(seed: int, invest_steps: list = None) -> Company:
    """Deterministically generate a tutorial company from a random seed.

    For game levels, pass invest_steps so the company's 'ask' scales naturally
    to the level's investment range (prevents all invest buttons from being hidden).
    """
    rng     = random.Random(seed)
    name    = rng.choice(_NAME_PARTS[0]) + rng.choice(_NAME_PARTS[1])
    domain  = rng.choice(_DOMAINS)
    market  = rng.choice(_MARKETS)
    tagline = rng.choice(_TAGLINES).format(domain=domain, market=market)
    team    = rng.randint(1, 5)
    # For game levels: ask is one of the level's invest amounts (lower-to-mid tier),
    # so the invest buttons match the company's scale. For tutorial levels keep small.
    if invest_steps:
        mid = max(1, len(invest_steps) // 2 + 1)
        ask = rng.choice(invest_steps[:mid])
    else:
        ask = rng.choice([50_000, 75_000, 100_000, 150_000, 200_000])
    return Company(
        id=f"tutorial_{seed}",
        name=name,
        tagline=tagline,
        team=team,
        market=rng.randint(1, 5),
        traction=rng.randint(1, 5),
        technology=rng.randint(1, 5),
        unit_economics=rng.randint(1, 5),
        moat=rng.randint(1, 5),
        description=TEAM_PROFILES[team]["desc"],
        ask=ask,
    )


# ==================================================
# ----------------- STYLE HELPERS ------------------
# ==================================================
def encode_image(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def inject_global_css() -> None:
    st.markdown(
        """
        <style>
        /* Strip Streamlit chrome */
        #MainMenu, header, footer { visibility: hidden; }
        .block-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
        }
        .stApp { background-color: #050609; }
        img, canvas {
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def set_bg_css(image_path: str, repeat_y: bool = False) -> None:
    """
    Inject background directly onto .stApp via CSS.
    Using CSS instead of a layout div avoids z-index conflicts with
    Streamlit's own DOM elements, letting fixed overlays sit cleanly on top.
    """
    encoded = encode_image(image_path)
    repeat = "repeat-y" if repeat_y else "no-repeat"
    st.markdown(
        f"""
        <style>
        .stApp {{
            background-image: url('data:image/png;base64,{encoded}') !important;
            background-size: cover !important;
            background-position: center top !important;
            background-repeat: {repeat} !important;
            image-rendering: pixelated;
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


# ==================================================
# --------------- RENDERING HELPERS ----------------
# ==================================================
def stars_html(score: int) -> str:
    """Return HTML ★/☆ string colour-coded by score."""
    filled_col = "#ffb35a" if score >= 4 else "#c4a060" if score >= 3 else "#5a3e20"
    empty_col  = "#1e1710"
    return (
        f'<span style="color:{filled_col};">{"★" * score}</span>'
        f'<span style="color:{empty_col};">{"★" * (5 - score)}</span>'
    )


def company_card_html(company: Company, focus=None) -> str:
    """Dark panel card showing company name, tagline, 6 metric rows, and a description.
    focus can be a string label, a list of labels, or None — highlighted in amber."""
    if focus is None:
        focus_set: set = set()
    elif isinstance(focus, list):
        focus_set = {f.upper() for f in focus}
    else:
        focus_set = {focus.upper()}
    metrics = [
        ("TEAM",       company.team),
        ("MARKET",     company.market),
        ("TRACTION",   company.traction),
        ("TECHNOLOGY", company.technology),
        ("ECONOMICS",  company.unit_economics),
        ("MOAT",       company.moat),
    ]
    rows = ""
    for label, score in metrics:
        hl      = label in focus_set
        row_bg  = "rgba(255,168,76,0.07)" if hl else "transparent"
        lbl_col = "#ffb35a"               if hl else "#7a6a58"
        rows += (
            f'<div style="display:flex;justify-content:space-between;'
            f'align-items:center;padding:4px 6px;'
            f'background:{row_bg};border-radius:3px;margin-bottom:1px;">'
            f'<span style="font-size:11px;letter-spacing:0.08em;color:{lbl_col};">{label}</span>'
            f'<span style="font-size:14px;">{stars_html(score)}</span>'
            f'</div>'
        )
    return (
        f'<div style="background:rgba(4,5,9,0.92);'
        f'border:1px solid rgba(255,168,76,0.38);border-radius:6px;'
        f'padding:16px;font-family:\'Courier New\',monospace;color:#f4dab4;">'
        f'<div style="font-size:15px;font-weight:bold;letter-spacing:0.05em;'
        f'margin-bottom:3px;">{company.name}</div>'
        f'<div style="font-size:10px;color:#6a5a48;font-style:italic;'
        f'margin-bottom:14px;line-height:1.4;">{company.tagline}</div>'
        f'<div style="border-top:1px solid rgba(255,168,76,0.15);'
        f'padding-top:10px;margin-bottom:10px;">{rows}</div>'
        f'<div style="font-size:10px;color:#5a4a38;line-height:1.55;'
        f'border-top:1px solid rgba(255,168,76,0.10);padding-top:8px;">'
        f'{company.description}</div>'
        f'</div>'
    )


def company_card_quiz_html(company: Company, visible_metrics) -> str:
    """
    Company card showing only the specified metric(s) highlighted;
    all others are hidden (dark/invisible) to force focus on the visible ones.
    visible_metrics can be a single string or a list of strings.
    """
    if isinstance(visible_metrics, str):
        visible_metrics = [visible_metrics]
    metrics = [
        ("TEAM",       company.team),
        ("MARKET",     company.market),
        ("TRACTION",   company.traction),
        ("TECHNOLOGY", company.technology),
        ("ECONOMICS",  company.unit_economics),
        ("MOAT",       company.moat),
    ]
    rows = ""
    for label, score in metrics:
        if label in visible_metrics:
            rows += (
                f'<div style="display:flex;justify-content:space-between;'
                f'align-items:center;padding:6px 8px;'
                f'background:rgba(255,168,76,0.08);border-radius:4px;'
                f'margin-bottom:3px;">'
                f'<span style="font-size:12px;letter-spacing:0.09em;'
                f'color:#ffb35a;font-weight:bold;">{label}</span>'
                f'<span style="font-size:18px;">{stars_html(score)}</span>'
                f'</div>'
            )
        else:
            rows += (
                f'<div style="display:flex;justify-content:space-between;'
                f'align-items:center;padding:6px 8px;border-radius:4px;'
                f'margin-bottom:3px;">'
                f'<span style="font-size:12px;letter-spacing:0.09em;'
                f'color:#1e1812;">{label}</span>'
                f'<span style="font-size:16px;color:#18160e;">★★★★★</span>'
                f'</div>'
            )
    n_hidden  = 6 - len(visible_metrics)
    focus_str = " & ".join(visible_metrics)
    footer    = f"&#9632; {n_hidden} metrics classified. Evaluate {focus_str} only."
    return (
        f'<div style="background:rgba(4,5,9,0.92);'
        f'border:1px solid rgba(255,168,76,0.38);border-radius:8px;'
        f'padding:22px;font-family:\'Courier New\',monospace;color:#f4dab4;">'
        f'<div style="font-size:20px;font-weight:bold;letter-spacing:0.05em;'
        f'margin-bottom:5px;">{company.name}</div>'
        f'<div style="font-size:11px;color:#6a5a48;font-style:italic;'
        f'margin-bottom:18px;line-height:1.5;">{company.tagline}</div>'
        f'<div style="border-top:1px solid rgba(255,168,76,0.15);'
        f'padding-top:12px;margin-bottom:12px;">{rows}</div>'
        f'<div style="font-size:10px;color:#2e2418;line-height:1.55;'
        f'border-top:1px solid rgba(255,168,76,0.08);padding-top:8px;">'
        f'{footer}</div>'
        f'</div>'
    )


# ==================================================
# -------------------- SCREENS ---------------------
# ==================================================
def get_query_param(name: str, default: Optional[str] = None) -> Optional[str]:
    value = st.query_params.get(name)
    return value if value is not None else default


# ---- HOME --------------------------------------------------------
def home_screen() -> None:
    # On every fresh Streamlit session (new browser tab, page reload), wipe the
    # financial state so the player always starts with $1 M and an empty portfolio.
    # st.session_state is per WebSocket connection → naturally resets on each new
    # tab / reload, so we only need a simple "already ran" guard here.
    if "home_reset_done" not in st.session_state:
        st.session_state.home_reset_done = True
        # height=1 (not 0) ensures the iframe is actually loaded and script runs.
        components.html(
            """<script>
            try {
                localStorage.removeItem('kv_capital');
                localStorage.removeItem('kv_portfolio');
                localStorage.removeItem('kv_portfolio_total');
            } catch(e) {}
            </script>""",
            height=1,
        )
    set_bg_css(HOME_BG)
    st.markdown(
        """
        <style>
        /*
         * Full-screen fixed overlay — rendered above all Streamlit elements.
         * pointer-events:none on the container so the background is still
         * "visible" through it; re-enabled per-button.
         */
        #kv-home-overlay {
            position: fixed;
            inset: 0;
            z-index: 9000;
            pointer-events: none;
        }

        .kv-home-btn {
            position: absolute;
            pointer-events: auto;
            cursor: pointer;
            background: rgba(4, 5, 9, 0.78);
            border: 1px solid rgba(255, 168, 76, 0.65);
            border-radius: 4px;
            color: #f4dab4;
            font-family: "Courier New", monospace;
            font-size: 13px;
            letter-spacing: 0.12em;
            display: flex;
            align-items: center;
            justify-content: center;
            text-shadow: 0 0 8px #ff8c1a;
            text-decoration: none;
            transition: background 80ms ease, box-shadow 80ms ease;
            user-select: none;
        }

        .kv-home-btn:hover {
            background: rgba(14, 10, 4, 0.93);
            box-shadow: 0 0 14px rgba(255, 140, 26, 0.5);
        }
        </style>

        <div id="kv-home-overlay">
            <!-- <a href> instead of onclick — works even if Streamlit strips JS handlers -->
            <a class="kv-home-btn" href="?page=portfolio"
               style="left:18%; top:72%; width:220px; height:56px;">
                PORTFOLIO
            </a>
            <a class="kv-home-btn" href="?page=explore"
               style="left:39%; top:72%; width:220px; height:56px;">
                EXPLORE
            </a>
            <a class="kv-home-btn" href="?page=settings"
               style="left:62%; top:72%; width:110px; height:56px;">
                &#9733;
            </a>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ---- EXPLORE -----------------------------------------------------
def explore_screen(selected_level_id: Optional[int]) -> None:
    """
    Render the cave map inside a st.components.v1.html iframe.
    Using a real iframe document avoids Streamlit's markdown parser,
    which breaks on large HTML blocks and unescaped & in query params.
    Navigation back to Streamlit uses window.parent.location.href.
    """
    map_encoded  = encode_image(MAP_BG)
    inner_h      = map_inner_height_px()

    # ── torch anchor tags ─────────────────────────────────────────
    torches_html = ""
    for lvl in LEVELS:
        top_px = level_top_px(lvl.id)
        is_sel = lvl.id == selected_level_id
        color  = "#ffe6b5" if is_sel else "#ffb35a"
        shadow = (
            "0 0 5px #ffe0a0, 0 0 14px #ffb35a, 0 0 26px #ff8c1a"
            if is_sel else
            "0 0 4px #ff8c1a, 0 0 10px #ff8c1a, 0 0 18px #ff8c1a"
        )
        torches_html += (
            f'<a class="torch"'
            f' data-href="?page=level&amp;level={lvl.id}"'
            f' style="left:{lvl.x}%;top:{top_px}px;'
            f'color:{color};text-shadow:{shadow};"'
            f' onclick="event.preventDefault();'
            f"var cap=localStorage.getItem('kv_capital')||'1000000';"
            f"var pt=localStorage.getItem('kv_portfolio_total')||'0';"
            f"window.parent.open(this.dataset.href+'&capital='+cap+'&portfolio_total='+pt,'_blank');\">"
            f'&#128293; <span style="margin-left:4px;">{lvl.id}</span></a>\n'
        )

    # ── optional level info panel (shown when exploring a specific level) ──
    panel_html = ""
    if selected_level_id and selected_level_id in LEVEL_INDEX:
        lv = LEVEL_INDEX[selected_level_id]
        panel_html = (
            f'<div class="panel">'
            f'<div class="ptitle">LEVEL {lv.id}</div>'
            f'<div class="prow"><span>Risk</span><span>{lv.risk}</span></div>'
            f'<div class="prow"><span>Capital</span><span>{lv.capital}</span></div>'
            f'<div class="prow"><span>Reward</span><span>{lv.reward}</span></div>'
            f'<div class="psmall">{lv.narrative}</div>'
            f'</div>'
        )

    # ── full HTML document for the iframe ─────────────────────────
    html_doc = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html, body {{
    margin: 0; padding: 0; overflow: hidden;
    background: #050609;
}}
body {{
    background-image: url('data:image/png;base64,{map_encoded}');
    background-size: cover;
    background-position: top center;
    background-repeat: repeat-y;
    image-rendering: pixelated;
}}
#overlay {{
    position: absolute; inset: 0;
    overflow-y: auto; overflow-x: hidden;
}}
#map-inner {{
    position: relative; width: 100%;
    height: {inner_h}px;
    pointer-events: none;
}}
#path-line {{
    position: absolute; left: 49%; top: 0;
    width: 3px; height: 100%;
    background: #1e262f; opacity: 0.5; pointer-events: none;
}}
.torch {{
    position: absolute;
    font-family: monospace; font-size: 18px;
    cursor: pointer; text-decoration: none;
    pointer-events: auto;
    transition: transform 80ms ease-out;
    user-select: none;
}}
.torch:hover {{ transform: translateY(-3px) scale(1.05); }}
.panel {{
    position: fixed; right: 24px; top: 56px;
    width: 260px; padding: 14px 16px;
    background: rgba(4,5,9,0.96);
    border: 1px solid rgba(255,168,76,0.6); border-radius: 8px;
    box-shadow: 0 0 15px rgba(0,0,0,0.7);
    color: #f4dab4; font-family: monospace;
}}
.ptitle {{ font-size: 17px; font-weight: bold; letter-spacing: 0.08em; margin-bottom: 8px; }}
.prow   {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }}
.psmall {{ margin-top: 10px; font-size: 11px; color: #b7a288; line-height: 1.5; }}
</style></head><body>
<div id="overlay">
  <div id="map-inner">
    <div id="path-line"></div>
    {torches_html}
  </div>
</div>
{panel_html}
<script>
window.addEventListener('load', function() {{
  // ── Locking: read completed levels from localStorage ──
  var completed = [];
  try {{ completed = JSON.parse(localStorage.getItem('kv_completed') || '[]'); }} catch(e) {{}}
  document.querySelectorAll('.torch').forEach(function(torch) {{
    var href = torch.dataset.href || '';
    var parts = href.split('level=');
    if (parts.length < 2) return;
    var lvl = parseInt(parts[1]);
    // Lock every level ≥ 2 whose predecessor has not been completed yet
    if (lvl >= 2 && completed.indexOf(lvl - 1) === -1) {{
      torch.style.opacity = '0.22';
      torch.style.cursor  = 'not-allowed';
      torch.onclick = function(e) {{
        e.preventDefault();
        showToast('Complete Level ' + (lvl - 1) + ' first to unlock');
        return false;
      }};
    }}
  }});
  // ── Scroll to Level 1 (bottom of map) ─────────────────────────
  var el = document.getElementById('overlay');
  el.scrollTop = el.scrollHeight;
}});
function showToast(msg) {{
  var ex = document.getElementById('kv-toast');
  if (ex) ex.remove();
  var t = document.createElement('div');
  t.id = 'kv-toast';
  t.innerText = msg;
  t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);'
    + 'background:rgba(4,5,9,0.96);border:1px solid rgba(255,168,76,0.55);'
    + 'color:#f4dab4;font-family:monospace;font-size:13px;padding:10px 24px;'
    + 'border-radius:4px;z-index:9999;letter-spacing:0.08em;'
    + 'white-space:nowrap;pointer-events:none;'
    + 'text-shadow:0 0 8px #ff8c1a60;';
  document.body.appendChild(t);
  setTimeout(function(){{ t.remove(); }}, 2500);
}}
</script>
</body></html>"""

    # ── Back button lives OUTSIDE the sandboxed iframe so navigation works ──
    # (Streamlit component iframes lack allow-top-navigation; href links in
    #  st.markdown are handled by the real Streamlit page and navigate fine.)
    st.markdown(
        """
        <style>
        .stApp { background: #050609 !important; }
        iframe  { border: none !important; display: block !important; }
        #kv-explore-back {
            position: fixed; top: 18px; left: 24px; z-index: 9999;
            padding: 5px 14px;
            background: rgba(5,5,8,0.88); color: #f4dab4;
            border: 1px solid rgba(255,168,76,0.6); border-radius: 4px;
            font-family: 'Courier New', monospace; font-size: 13px;
            letter-spacing: 0.08em; text-shadow: 0 0 6px #ff8c1a;
            text-decoration: none; cursor: pointer;
        }
        #kv-explore-back:hover { background: rgba(12,12,18,0.96); }
        </style>
        <a id="kv-explore-back" href="?page=home">&#8592; BACK</a>
        """,
        unsafe_allow_html=True,
    )
    components.html(html_doc, height=750, scrolling=False)


# ---- PORTFOLIO ---------------------------------------------------
def portfolio_screen() -> None:
    # NOTE: This entire screen is a self-contained HTML page rendered inside a
    # Streamlit components iframe.  All data lives in localStorage (same origin).
    html_doc = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*, *::before, *::after { box-sizing: border-box; }
html, body {
    margin: 0; padding: 0;
    background: #040509;
    color: #f4dab4;
    font-family: 'Courier New', monospace;
}
body { padding: 20px 20px 60px; }
.wrap { max-width: 580px; margin: 0 auto; }
.lbl  { font-size:10px; color:#ffb35a; letter-spacing:0.25em; text-align:center; margin-bottom:8px; }
.ttl  { font-size:26px; font-weight:bold; letter-spacing:0.06em; text-align:center;
        text-shadow:0 0 20px #ff8c1a60; margin-bottom:16px; }
.hud  { display:flex; justify-content:center; gap:0; margin-bottom:24px;
        background:rgba(4,5,9,0.80); border:1px solid rgba(255,168,76,0.14);
        border-radius:6px; overflow:hidden; }
.hud-cell { flex:1; text-align:center; padding:10px 8px; border-right:1px solid rgba(255,168,76,0.10); }
.hud-cell:last-child { border-right:none; }
.hud-lbl  { font-size:8px; color:#5a4a3a; letter-spacing:0.16em; margin-bottom:4px; }
.hud-val  { font-size:13px; color:#f4dab4; }
.card {
    display:flex; align-items:center; gap:10px;
    padding:12px 14px; margin-bottom:8px;
    background:rgba(4,5,9,0.85); border:1px solid rgba(255,168,76,0.16);
    border-radius:6px;
}
.card-info { flex:1; min-width:0; }
.card-name { color:#f4dab4; font-size:12px; letter-spacing:0.04em;
             white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.card-tag  { color:#7a6a58; font-size:10px; margin-top:2px; }
.card-lvl  { color:#3a2a18; font-size:9px; margin-top:2px; }
.card-nums { text-align:right; flex-shrink:0; }
.card-curr { font-size:13px; font-weight:bold; }
.card-cost { font-size:10px; color:#7a6a58; margin-top:2px; }
.badge     { display:inline-block; font-size:10px; padding:1px 6px;
             border-radius:3px; margin-top:3px; letter-spacing:0.07em; }
.sell-btn  { flex-shrink:0; background:transparent;
             border:1px solid rgba(255,168,76,0.30); color:#7a6a58;
             font-family:'Courier New',monospace; font-size:11px;
             letter-spacing:0.08em; padding:5px 10px; border-radius:4px; cursor:pointer; }
.sell-btn:hover { border-color:rgba(255,168,76,0.65); color:#ffb35a; }
.empty { text-align:center; color:#3a2a18; font-size:12px;
         padding:36px 20px; line-height:2;
         border:1px solid rgba(255,168,76,0.07); border-radius:6px; }
/* confirm overlay */
#ov { position:fixed; inset:0; background:rgba(3,4,8,0.92);
      display:none; align-items:center; justify-content:center; z-index:200; }
#ov-box { background:rgba(4,5,9,0.98); border:1px solid rgba(255,168,76,0.32);
          border-radius:8px; padding:26px 28px; max-width:320px; text-align:center; }
</style></head><body>
<div class="wrap">
  <div class="lbl">PORTFOLIO VAULT</div>
  <div class="ttl">YOUR INVESTMENTS</div>
  <div class="hud" id="hud"></div>
  <div id="list"></div>
</div>
<div id="ov">
  <div id="ov-box">
    <div style="font-size:9px;color:#ffb35a;letter-spacing:0.2em;margin-bottom:10px;">CONFIRM SELL</div>
    <div id="ov-name" style="font-size:15px;font-weight:bold;margin-bottom:4px;"></div>
    <div id="ov-val"  style="font-size:12px;color:#4aff8c;margin-bottom:16px;"></div>
    <div style="font-size:10px;color:#7a6a58;margin-bottom:18px;">Proceeds added to liquid capital.</div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button onclick="cancelSell()"
        style="background:rgba(4,5,9,0.90);border:1px solid rgba(255,168,76,0.22);color:#7a6a58;
               font-family:'Courier New',monospace;font-size:11px;padding:7px 16px;
               border-radius:4px;cursor:pointer;">CANCEL</button>
      <button onclick="confirmSell()"
        style="background:rgba(74,255,140,0.10);border:1px solid rgba(74,255,140,0.38);
               color:#4aff8c;font-family:'Courier New',monospace;font-size:11px;
               padding:7px 16px;border-radius:4px;cursor:pointer;">SELL &rarr;</button>
    </div>
  </div>
</div>
<script>
// ── helpers ──────────────────────────────────────────────────────
function fmt(n){ return Number(n).toLocaleString(); }

function badgeInfo(pct, valued) {
    if (!valued) return {col:'#ffb35a', bg:'rgba(255,168,76,0.11)', lbl:'ACTIVE'};
    if (pct >= 20) return {col:'#4aff8c', bg:'rgba(74,255,140,0.11)', lbl:'\u25b2 +'+pct.toFixed(1)+'%'};
    if (pct >= 0)  return {col:'#b4ff8c', bg:'rgba(180,255,140,0.10)',lbl:'\u25b2 +'+pct.toFixed(1)+'%'};
    if (pct >= -30)return {col:'#ff8c4a', bg:'rgba(255,140,74,0.11)', lbl:'\u25bc '+pct.toFixed(1)+'%'};
    return          {col:'#ff4a4a', bg:'rgba(255,74,74,0.11)',  lbl:'\u25bc '+pct.toFixed(1)+'%'};
}

// ── sell flow ─────────────────────────────────────────────────────
var _sellKey = null;
function openSell(k, name, curr) {
    _sellKey = k;
    document.getElementById('ov-name').textContent = name;
    document.getElementById('ov-val').textContent  = '$' + fmt(curr) + ' proceeds';
    document.getElementById('ov').style.display    = 'flex';
}
function cancelSell() {
    _sellKey = null;
    document.getElementById('ov').style.display = 'none';
}
function confirmSell() {
    if (!_sellKey) return;
    var p = JSON.parse(localStorage.getItem('kv_portfolio') || '{}');
    var e = p[_sellKey];
    if (e) {
        var curr = (e.current_value !== undefined) ? e.current_value : e.amount;
        var cap  = parseInt(localStorage.getItem('kv_capital') || '1000000', 10);
        localStorage.setItem('kv_capital', String(cap + curr));
        delete p[_sellKey];
        var tot = 0;
        for (var x in p) tot += (p[x].current_value || p[x].amount || 0);
        localStorage.setItem('kv_portfolio_total', String(tot));
        localStorage.setItem('kv_portfolio', JSON.stringify(p));
    }
    location.reload();
}

// ── main render (runs after DOM is ready) ─────────────────────────
// ── renderHud / cell (defined before the IIFE that calls them) ────
function renderHud(hud, cap, portVal, dep, pnl) {
    if (!hud) return;
    var pnlSign  = pnl >= 0 ? '+' : '';
    var pnlColor = pnl >= 0 ? '#4aff8c' : '#ff4a4a';
    hud.innerHTML =
        cell('CAPITAL',  '$' + fmt(cap),    '#ffb35a') +
        cell('PORTFOLIO','$' + fmt(portVal), '#f4dab4') +
        cell('NET WORTH','$' + fmt(cap + portVal), '#f4dab4') +
        cell('P&amp;L',  pnlSign + '$' + fmt(Math.abs(pnl)), pnlColor);
}
function cell(lbl, val, col) {
    return '<div class="hud-cell"><div class="hud-lbl">' + lbl + '</div>'
         + '<div class="hud-val" style="color:' + col + ';">' + val + '</div></div>';
}

// ── main render — IIFE so it runs immediately at script-bottom.
// The script tag is at end of <body> so the DOM is fully ready here;
// no need for DOMContentLoaded which can mis-fire in srcdoc iframes.
(function initPortfolio() {
    var raw = '{}';
    try { raw = localStorage.getItem('kv_portfolio') || '{}'; } catch(e){}
    var p = {};
    try { p = JSON.parse(raw); } catch(e){}

    var cap = 1000000;
    try { cap = parseInt(localStorage.getItem('kv_capital') || '1000000', 10) || 1000000; } catch(e){}

    var hud  = document.getElementById('hud');
    var list = document.getElementById('list');

    if (!hud || !list) {
        // DOM not ready — shouldn't happen but fall back gracefully
        setTimeout(initPortfolio, 50);
        return;
    }

    var keys = Object.keys(p);

    if (keys.length === 0) {
        list.innerHTML = '<div class="empty">No investments yet.<br>Complete a game level to see companies here.</div>';
        renderHud(hud, cap, 0, 0, 0);
        return;
    }

    var totalDep = 0, totalCurr = 0, html = '';
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var e = p[k];
        if (!e) continue;

        var amt    = Number(e.amount)  || 0;
        var curr   = (e.current_value !== undefined) ? Number(e.current_value) : amt;
        var pct    = (e.return_pct    !== undefined) ? Number(e.return_pct)    : 0;
        var valued = (e.status === 'valued');
        totalDep  += amt;
        totalCurr += curr;

        var bi = badgeInfo(pct, valued);

        html += '<div class="card">';
        html +=   '<div class="card-info">';
        html +=     '<div class="card-name">' + (e.name    || '—') + '</div>';
        html +=     '<div class="card-tag">'  + (e.tagline || '')  + '</div>';
        html +=     '<div class="card-lvl">LEVEL ' + (e.level || '?') + '</div>';
        html +=   '</div>';
        html +=   '<div class="card-nums">';
        html +=     '<div class="card-curr" style="color:' + bi.col + ';">$' + fmt(curr) + '</div>';
        if (valued) html += '<div class="card-cost">$' + fmt(amt) + ' cost</div>';
        html +=     '<div><span class="badge" style="background:' + bi.bg + ';color:' + bi.col + ';">' + bi.lbl + '</span></div>';
        html +=   '</div>';
        if (valued) {
            html += '<button class="sell-btn" onclick="openSell(' + JSON.stringify(k) + ',' + JSON.stringify(e.name || '') + ',' + curr + ')">SELL</button>';
        }
        html += '</div>';
    }
    list.innerHTML = html;

    try { localStorage.setItem('kv_portfolio_total', String(totalCurr)); } catch(e){}
    renderHud(hud, cap, totalCurr, totalDep, totalCurr - totalDep);
})();
</script>
</body></html>"""
    # ── Back button lives OUTSIDE the sandboxed iframe ───────────────────────
    st.markdown(
        """
        <style>
        .stApp { background: #040509 !important; }
        iframe  { border: none !important; display: block !important; }
        #kv-port-back {
            display: inline-block;
            padding: 5px 14px; margin-bottom: 12px;
            background: rgba(5,5,8,0.88); color: #f4dab4;
            border: 1px solid rgba(255,168,76,0.6); border-radius: 4px;
            font-family: 'Courier New', monospace; font-size: 13px;
            letter-spacing: 0.08em; text-shadow: 0 0 6px #ff8c1a;
            text-decoration: none; cursor: pointer;
        }
        #kv-port-back:hover { background: rgba(12,12,18,0.96); }
        </style>
        <a id="kv-port-back" href="?page=home">&#8592; BACK</a>
        """,
        unsafe_allow_html=True,
    )
    components.html(html_doc, height=740, scrolling=True)


# ---- SETTINGS ----------------------------------------------------
def settings_screen() -> None:
    st.markdown(
        """
        <style>
        #kv-settings-overlay {
            position: fixed;
            inset: 0;
            z-index: 9000;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        #kv-settings-back {
            position: fixed;
            top: 24px;
            left: 32px;
            padding: 6px 14px;
            font-family: "Courier New", monospace;
            font-size: 14px;
            background: rgba(5, 5, 8, 0.88);
            color: #f4dab4;
            border: 1px solid rgba(255, 168, 76, 0.6);
            border-radius: 4px;
            cursor: pointer;
            text-shadow: 0 0 6px #ff8c1a;
            text-decoration: none;
            z-index: 9001;
            pointer-events: auto;
            user-select: none;
        }
        #kv-settings-back:hover { background: rgba(12, 12, 18, 0.96); }
        </style>

        <div id="kv-settings-overlay">
            <div style="pointer-events:auto; text-align:center;
                        color:#f4dab4; font-family:'Courier New',monospace;
                        max-width:480px;">
                <h2 style="letter-spacing:0.15em;">&#9733; SETTINGS</h2>
                <p style="opacity:0.8; line-height:1.6;">
                    Starting capital, difficulty, and tutorial options
                    will be configurable here.
                </p>
            </div>
        </div>

        <a id="kv-settings-back" href="?page=home">&#8592; BACK</a>
        """,
        unsafe_allow_html=True,
    )


# ---- LEVEL (shared helpers) --------------------------------------
def _level_common_css() -> None:
    st.markdown(
        "<style>.stApp { background-color: #060709 !important; }</style>",
        unsafe_allow_html=True,
    )
    st.markdown(
        """
        <style>
        div[data-testid="stButton"] button {
            background: rgba(4,5,9,0.90) !important;
            border: 1px solid rgba(255,168,76,0.58) !important;
            color: #f4dab4 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 13px !important;
            letter-spacing: 0.10em !important;
            text-shadow: 0 0 8px #ff8c1a !important;
            width: 100% !important;
            padding: 10px 0 !important;
        }
        div[data-testid="stButton"] button:hover {
            background: rgba(14,10,4,0.96) !important;
            box-shadow: 0 0 12px rgba(255,140,26,0.4) !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _level_top_bar(level_id: int) -> None:
    capital         = st.session_state.get("capital", 1_000_000)
    portfolio_total = st.session_state.get("portfolio_total", 0)  # historical holdings

    # Add this level's holdings at cost (pre-completion) or valued amount (post-completion)
    active_investments = st.session_state.get(_tk(level_id, "investments"), [])
    returns_applied    = st.session_state.get(_tk(level_id, "returns_applied"), False)
    if returns_applied:
        current_level_value = sum(inv.get("current_value", inv["amount"]) for inv in active_investments)
    else:
        current_level_value = sum(inv["amount"] for inv in active_investments)

    net_worth = capital + portfolio_total + current_level_value

    st.markdown(
        f"""
        <div style="position:fixed;top:0;left:0;right:0;z-index:9000;
                    display:flex;justify-content:space-between;align-items:center;
                    padding:8px 28px;
                    background:rgba(3,4,8,0.96);
                    border-bottom:1px solid rgba(255,168,76,0.20);">
            <a href="?page=explore"
               style="font-family:'Courier New',monospace;font-size:13px;
                      color:#f4dab4;text-decoration:none;
                      text-shadow:0 0 6px #ff8c1a;">
                &#8592; MAP
            </a>
            <div style="display:flex;gap:28px;align-items:center;">
                <div style="text-align:right;">
                    <div style="font-family:'Courier New',monospace;font-size:9px;
                                color:#5a4a3a;letter-spacing:0.18em;margin-bottom:2px;">
                        CAPITAL
                    </div>
                    <div style="font-family:'Courier New',monospace;font-size:14px;
                                color:#ffb35a;text-shadow:0 0 8px #ff8c1a;
                                letter-spacing:0.04em;">
                        ${capital:,}
                    </div>
                </div>
                <div style="width:1px;height:28px;background:rgba(255,168,76,0.15);"></div>
                <div style="text-align:right;">
                    <div style="font-family:'Courier New',monospace;font-size:9px;
                                color:#5a4a3a;letter-spacing:0.18em;margin-bottom:2px;">
                        NET WORTH
                    </div>
                    <div style="font-family:'Courier New',monospace;font-size:14px;
                                color:#f4dab4;letter-spacing:0.04em;">
                        ${net_worth:,}
                    </div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown('<div style="height:62px;"></div>', unsafe_allow_html=True)


# ---- TUTORIAL LEVEL helpers (generic, used for levels 1-5) -------
def _tk(level_id: int, key: str) -> str:
    """Session-state key scoped to a tutorial level."""
    return f"l{level_id}_{key}"


def _tutorial_intro(level_id: int, cfg: Dict) -> None:
    rounds        = cfg.get("rounds", ROUNDS_PER_LEVEL)
    threshold_str = f"{cfg['threshold']}&#9733;"
    focus         = cfg["focus"]                        # list e.g. ["TEAM","MARKET"]
    focus_label   = " &amp; ".join(focus)               # "TEAM &amp; MARKET"
    metric_chips  = "".join(
        f'<span style="display:inline-block;background:rgba(255,168,76,0.12);'
        f'color:#ffb35a;font-size:10px;letter-spacing:0.12em;padding:3px 8px;'
        f'border-radius:3px;margin:2px 3px 2px 0;">{m}</span>'
        for m in focus
    )
    st.markdown(
        f"""
        <div style="max-width:600px;margin:10px auto 0;
                    font-family:'Courier New',monospace;color:#f4dab4;">
            <div style="font-size:10px;color:#ffb35a;letter-spacing:0.25em;
                        margin-bottom:8px;">
                LEVEL {level_id} &mdash; TUTORIAL
            </div>
            <div style="font-size:26px;font-weight:bold;letter-spacing:0.06em;
                        margin-bottom:22px;">
                {cfg['title']}
            </div>
            <div style="background:rgba(255,168,76,0.04);
                        border-left:3px solid rgba(255,168,76,0.50);
                        padding:14px 18px;font-size:12px;
                        color:#9a8878;line-height:1.75;margin-bottom:26px;">
                {cfg['lesson']}
            </div>
            <div style="background:rgba(4,5,9,0.80);
                        border:1px solid rgba(255,168,76,0.18);
                        border-radius:6px;padding:18px 20px;
                        font-size:12px;line-height:1.9;color:#6a5a4a;
                        margin-bottom:28px;">
                <div style="color:#ffb35a;font-size:10px;letter-spacing:0.18em;
                             margin-bottom:12px;">&#9632; YOUR MISSION</div>
                You will evaluate
                <span style="color:#f4dab4;">{rounds} companies.</span>
                Only these metrics are visible — all others are classified:<br>
                <div style="margin:10px 0 6px;">{metric_chips}</div>
                <span style="color:#f4dab4;">INVEST</span> when
                <em>every</em> visible metric reaches
                <span style="color:#ffb35a;">{threshold_str} or higher.</span><br>
                <span style="color:#f4dab4;">PASS</span> if any metric falls below.<br><br>
                Correct calls earn
                <span style="color:#ffb35a;">&#9733;&nbsp;{COIN_REWARD} coins</span>
                each round.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    _, col, _ = st.columns([1, 1, 1])
    with col:
        if st.button("BEGIN ASSESSMENT", key=f"tut{level_id}_begin"):
            st.session_state[_tk(level_id, "phase")] = "question"
            st.rerun()


def _tutorial_question(level_id: int, company: Company, cfg: Dict) -> None:
    rnd         = st.session_state.get(_tk(level_id, "round"), 0)
    rounds      = cfg.get("rounds", ROUNDS_PER_LEVEL)
    focus       = cfg["focus"]                       # list e.g. ["TEAM","MARKET"]
    focus_label = " & ".join(focus)
    st.markdown(
        f"""
        <div style="text-align:center;font-family:'Courier New',monospace;
                    font-size:10px;color:#ffb35a;letter-spacing:0.22em;
                    margin-bottom:18px;">
            {focus_label} ASSESSMENT &mdash; COMPANY {rnd + 1} OF {rounds}
        </div>
        """,
        unsafe_allow_html=True,
    )
    _, col, _ = st.columns([1, 2, 1])
    with col:
        st.markdown(company_card_quiz_html(company, focus), unsafe_allow_html=True)
        st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)
        c1, c2 = st.columns(2, gap="small")
        with c1:
            if st.button("INVEST ↑", key=f"tut{level_id}_invest_{rnd}"):
                st.session_state[_tk(level_id, "answer")] = "invest"
                st.session_state[_tk(level_id, "phase")]  = "result"
                st.rerun()
        with c2:
            if st.button("PASS →", key=f"tut{level_id}_pass_{rnd}"):
                st.session_state[_tk(level_id, "answer")] = "pass"
                st.session_state[_tk(level_id, "phase")]  = "result"
                st.rerun()


def _tutorial_result(level_id: int, company: Company, cfg: Dict) -> None:
    answer      = st.session_state.get(_tk(level_id, "answer"))
    metric_keys = cfg["metric_keys"]          # e.g. ["team","market"]
    threshold   = cfg["threshold"]
    rounds      = cfg.get("rounds", ROUNDS_PER_LEVEL)
    rnd         = st.session_state.get(_tk(level_id, "round"), 0)
    focus       = cfg["focus"]               # list of display labels

    # Per-metric scores and correctness
    scores = {mk: getattr(company, mk) for mk in metric_keys}
    all_above      = all(s >= threshold for s in scores.values())
    correct_action = "invest" if all_above else "pass"
    is_correct     = answer == correct_action

    # Award coins exactly once per round result view
    rewarded_key = _tk(level_id, f"rewarded_{rnd}")
    if rewarded_key not in st.session_state:
        if is_correct:
            st.session_state.coins += COIN_REWARD
            earned_so_far = st.session_state.get(_tk(level_id, "coins_earned"), 0)
            st.session_state[_tk(level_id, "coins_earned")] = earned_so_far + COIN_REWARD
        st.session_state[rewarded_key] = True

    if is_correct:
        verdict_color = "#4aff8c"
        verdict_icon  = "&#10003;"
        verdict_label = "CORRECT CALL"
        verdict_sub   = f"+{COIN_REWARD} coins awarded"
    else:
        verdict_color = "#ff5a5a"
        verdict_icon  = "&#10007;"
        verdict_label = "WRONG CALL"
        verdict_sub   = "No coins awarded"

    # Build per-metric analysis rows
    analysis_rows = ""
    for mk in metric_keys:
        s       = scores[mk]
        profile = METRIC_PROFILES[mk][s]
        above   = s >= threshold
        ind_col = "#4aff8c" if above else "#ff5a5a"
        ind     = "&#10003;" if above else "&#10007;"
        lbl     = _MK_LABEL[mk]
        analysis_rows += (
            f'<div style="display:flex;justify-content:space-between;'
            f'align-items:baseline;padding:5px 0;'
            f'border-bottom:1px solid rgba(255,168,76,0.06);">'
            f'<span style="color:#ffb35a;font-size:10px;letter-spacing:0.10em;'
            f'min-width:90px;">{lbl}</span>'
            f'<span style="color:#f4dab4;flex:1;padding:0 10px;">'
            f'{s}&#9733; &mdash; {profile["label"]}</span>'
            f'<span style="color:{ind_col};font-size:13px;">{ind}</span>'
            f'</div>'
        )

    # Correct call summary
    if all_above:
        correct_str = f"INVEST &mdash; all metrics &ge; {threshold}&#9733;"
    else:
        failing = [_MK_LABEL[mk] for mk, s in scores.items() if s < threshold]
        correct_str = f"PASS &mdash; {' &amp; '.join(failing)} below {threshold}&#9733;"

    focus_label = " &amp; ".join(focus)
    st.markdown(
        f"""
        <div style="max-width:560px;margin:0 auto;
                    font-family:'Courier New',monospace;color:#f4dab4;">
            <div style="text-align:center;padding:10px 0 18px;">
                <div style="font-size:28px;font-weight:bold;color:{verdict_color};
                             letter-spacing:0.08em;
                             text-shadow:0 0 16px {verdict_color}80;">
                    {verdict_icon}&nbsp;{verdict_label}
                </div>
                <div style="font-size:12px;color:#7a6a58;margin-top:8px;
                             letter-spacing:0.06em;">
                    {verdict_sub}
                </div>
            </div>
            <div style="background:rgba(4,5,9,0.85);
                        border:1px solid rgba(255,168,76,0.18);
                        border-radius:6px;padding:16px 18px;
                        font-size:12px;color:#6a5a4a;line-height:1.8;
                        margin-bottom:20px;">
                <div style="color:#ffb35a;font-size:10px;letter-spacing:0.18em;
                             margin-bottom:12px;">&#9632; {focus_label} ANALYSIS</div>
                {analysis_rows}
                <div style="margin-top:12px;padding-top:8px;
                             border-top:1px solid rgba(255,168,76,0.10);">
                    Correct call: <span style="color:#f4dab4;">{correct_str}</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    _, col, _ = st.columns([1, 2, 1])
    with col:
        st.markdown(company_card_html(company, focus=focus), unsafe_allow_html=True)
        st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)

        is_last   = (rnd + 1) >= rounds
        btn_label = "SEE RESULTS &#8594;" if is_last else "NEXT COMPANY &#8594;"
        if st.button(btn_label, key=f"tut{level_id}_next_{rnd}"):
            st.session_state[_tk(level_id, "answer")] = None
            if is_last:
                st.session_state[_tk(level_id, "phase")] = "complete"
            else:
                st.session_state[_tk(level_id, "round")] = rnd + 1
                st.session_state[_tk(level_id, "seed")]  = random.randint(0, 99_999)
                st.session_state[_tk(level_id, "phase")] = "question"
            st.rerun()


def _tutorial_complete(level_id: int, cfg: Dict) -> None:
    rounds       = cfg.get("rounds", ROUNDS_PER_LEVEL)
    coins_earned = st.session_state.get(_tk(level_id, "coins_earned"), 0)
    correct      = coins_earned // COIN_REWARD
    focus        = cfg["focus"]                         # list
    focus_label  = " &amp; ".join(focus)
    next_level   = level_id + 1

    # Build completed list (URL param approach so back-nav shows correct locking)
    _prev_c_param = st.query_params.get("completed", "")
    _prev_c: list = []
    if _prev_c_param:
        try:
            _prev_c = [int(x) for x in _prev_c_param.split(",") if x.strip()]
        except ValueError:
            _prev_c = []
    _tut_completed_str = ",".join(str(x) for x in sorted(set(_prev_c) | {level_id}))
    next_btn     = ""
    if next_level in LEVEL_TUTORIALS:
        next_cfg   = LEVEL_TUTORIALS[next_level]
        is_next_game = next_cfg.get("mode") == "game"
        next_label = "BEGIN RUN" if is_next_game else f"LEVEL {next_level}"
        next_btn = (
            f'<a href="?page=level&amp;level={next_level}"'
            f' style="display:inline-flex;align-items:center;'
            f'justify-content:center;padding:11px 28px;'
            f'background:rgba(4,5,9,0.90);'
            f'border:1px solid rgba(255,168,76,0.58);border-radius:4px;'
            f'color:#f4dab4;font-family:\'Courier New\',monospace;font-size:13px;'
            f'letter-spacing:0.10em;text-shadow:0 0 8px #ff8c1a;'
            f'text-decoration:none;">'
            f'{next_label} &#8594;</a>'
        )
    st.markdown(
        f"""
        <div style="max-width:560px;margin:20px auto;
                    font-family:'Courier New',monospace;color:#f4dab4;
                    text-align:center;">
            <div style="font-size:10px;color:#ffb35a;letter-spacing:0.25em;
                        margin-bottom:10px;">LEVEL {level_id} COMPLETE</div>
            <div style="font-size:30px;font-weight:bold;letter-spacing:0.06em;
                        margin-bottom:8px;text-shadow:0 0 20px #ff8c1a60;">
                &#9733;&nbsp;{focus_label} ASSESSED
            </div>
            <div style="font-size:13px;color:#7a6a58;margin-bottom:30px;">
                {correct}/{rounds} correct
                &nbsp;&#8226;&nbsp;
                &#9733;&nbsp;{coins_earned} coins earned
            </div>
            <div style="background:rgba(255,168,76,0.04);
                        border:1px solid rgba(255,168,76,0.18);
                        border-radius:6px;padding:16px 20px;
                        font-size:12px;color:#6a5a4a;line-height:1.8;
                        margin-bottom:30px;text-align:left;">
                <div style="color:#ffb35a;font-size:10px;letter-spacing:0.15em;
                             margin-bottom:8px;">&#9632; KEY LESSON</div>
                {cfg['lesson']}
            </div>
            <div style="display:flex;gap:16px;justify-content:center;">
                <a href="?page=explore&completed={_tut_completed_str}"
                   style="display:inline-flex;align-items:center;
                          justify-content:center;padding:11px 28px;
                          background:rgba(4,5,9,0.90);
                          border:1px solid rgba(255,168,76,0.30);border-radius:4px;
                          color:#9a8a78;font-family:'Courier New',monospace;
                          font-size:13px;letter-spacing:0.10em;
                          text-shadow:0 0 6px #ff8c1a50;text-decoration:none;">
                    &#8592;&nbsp;MAP
                </a>
                {next_btn}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    # Persist completion in localStorage so the explore map can enforce ordering.
    # Uses a 0-height components.html iframe (same origin → same localStorage).
    components.html(
        f"""<script>
        try {{
            var c = JSON.parse(localStorage.getItem('kv_completed') || '[]');
            if (c.indexOf({level_id}) === -1) c.push({level_id});
            localStorage.setItem('kv_completed', JSON.stringify(c));
        }} catch(e) {{}}
        </script>""",
        height=1,
    )


# ---- GAME LEVEL helpers (level 6+) -------
def _game_intro(level_id: int, cfg: Dict) -> None:
    capital = st.session_state.get("capital", 1_000_000)
    st.markdown(
        f"""
        <div style="max-width:600px;margin:10px auto 0;
                    font-family:'Courier New',monospace;color:#f4dab4;">
            <div style="font-size:10px;color:#ffb35a;letter-spacing:0.25em;
                        margin-bottom:8px;">
                LEVEL {level_id} &mdash; INVESTMENT RUN
            </div>
            <div style="font-size:26px;font-weight:bold;letter-spacing:0.06em;
                        margin-bottom:22px;">
                {cfg['title']}
            </div>
            <div style="background:rgba(255,168,76,0.04);
                        border-left:3px solid rgba(255,168,76,0.50);
                        padding:14px 18px;font-size:12px;
                        color:#9a8878;line-height:1.75;margin-bottom:26px;">
                {cfg['lesson']}
            </div>
            <div style="background:rgba(4,5,9,0.80);
                        border:1px solid rgba(255,168,76,0.18);
                        border-radius:6px;padding:18px 20px;
                        font-size:12px;line-height:1.9;color:#6a5a4a;
                        margin-bottom:28px;">
                <div style="color:#ffb35a;font-size:10px;letter-spacing:0.18em;
                             margin-bottom:12px;">&#9632; YOUR BRIEF</div>
                Deployable capital:
                <span style="color:#f4dab4;">${capital:,}</span><br><br>
                You will evaluate
                <span style="color:#f4dab4;">{ROUNDS_PER_LEVEL} companies.</span>
                All six metrics are visible. Choose whether to
                <span style="color:#f4dab4;">INVEST</span> and how much,
                or <span style="color:#f4dab4;">PASS</span>.<br><br>
                Companies you back are added to your
                <span style="color:#ffb35a;">portfolio</span>.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    _, col, _ = st.columns([1, 1, 1])
    with col:
        if st.button("BEGIN RUN", key=f"game{level_id}_begin"):
            st.session_state[_tk(level_id, "phase")] = "question"
            st.rerun()


def _calc_return_multiplier(avg: float, noise_seed: int) -> float:
    """
    Deterministic return multiplier based on average metric score + noise.
      avg = 5.0 → base ≈ 4.2x  (great company)
      avg = 3.0 → base ≈ 1.0x  (break-even)
      avg = 1.0 → base ≈ 0.06x (write-off)
    ±20% market noise keeps each run feeling live.
    """
    base  = (avg / 3.0) ** 2.5
    noise = random.Random(noise_seed).uniform(0.80, 1.20)
    return max(0.05, min(5.0, round(base * noise, 4)))


def _game_question(level_id: int, company: Company, cfg: Dict) -> None:
    rnd     = st.session_state.get(_tk(level_id, "round"), 0)
    capital = st.session_state.get("capital", 1_000_000)
    st.markdown(
        f"""
        <div style="text-align:center;font-family:'Courier New',monospace;
                    font-size:10px;color:#ffb35a;letter-spacing:0.22em;
                    margin-bottom:18px;">
            INVESTMENT DECISION &mdash; COMPANY {rnd + 1} OF {ROUNDS_PER_LEVEL}
        </div>
        """,
        unsafe_allow_html=True,
    )
    _, col, _ = st.columns([1, 2, 1])
    with col:
        st.markdown(company_card_html(company), unsafe_allow_html=True)
        st.markdown(
            f'<div style="font-family:\'Courier New\',monospace;font-size:11px;'
            f'color:#7a6a58;text-align:center;margin:14px 0 18px;'
            f'letter-spacing:0.08em;">'
            f'SEEKING <span style="color:#f4dab4;">${company.ask:,}</span>'
            f'&nbsp;&nbsp;&#8226;&nbsp;&nbsp;'
            f'YOUR CAPITAL <span style="color:#f4dab4;">${capital:,}</span>'
            f'</div>',
            unsafe_allow_html=True,
        )
        # Show all invest_steps affordable with current capital; ask is cosmetic
        valid_amounts = [a for a in cfg["invest_steps"] if a <= capital]
        n_cols   = len(valid_amounts) + 1
        btn_cols = st.columns(n_cols, gap="small")
        for i, amount in enumerate(valid_amounts):
            with btn_cols[i]:
                if st.button(
                    f"${amount // 1000}K",
                    key=f"game{level_id}_inv_{rnd}_{amount}",
                ):
                    st.session_state[_tk(level_id, "answer")]        = "invest"
                    st.session_state[_tk(level_id, "invest_amount")] = amount
                    st.session_state[_tk(level_id, "phase")]         = "result"
                    st.rerun()
        with btn_cols[-1]:
            if st.button("PASS", key=f"game{level_id}_pass_{rnd}"):
                st.session_state[_tk(level_id, "answer")]        = "pass"
                st.session_state[_tk(level_id, "invest_amount")] = 0
                st.session_state[_tk(level_id, "phase")]         = "result"
                st.rerun()


def _game_result(level_id: int, company: Company, cfg: Dict) -> None:
    answer = st.session_state.get(_tk(level_id, "answer"))
    amount = st.session_state.get(_tk(level_id, "invest_amount"), 0)
    rnd    = st.session_state.get(_tk(level_id, "round"), 0)
    seed   = st.session_state.get(_tk(level_id, "seed"), 0)

    # Process investment exactly once per round
    processed_key = _tk(level_id, f"processed_{rnd}")
    if processed_key not in st.session_state:
        if answer == "invest" and amount > 0:
            st.session_state.capital -= amount
            # Unique noise seed per investment (level + round + company seed)
            return_seed = seed + level_id * 37 + rnd * 7919
            portfolio_key = f"{level_id}_{rnd}_{company.id}"
            st.session_state.portfolio[company.id] = {
                "name":    company.name,
                "tagline": company.tagline,
                "level":   level_id,
                "amount":  amount,
                "ask":     company.ask,
            }
            inv_list = st.session_state.get(_tk(level_id, "investments"), [])
            inv_list.append({
                "name":          company.name,
                "amount":        amount,
                "team":          company.team,
                "market":        company.market,
                "traction":      company.traction,
                "technology":    company.technology,
                "unit_economics":company.unit_economics,
                "moat":          company.moat,
                "return_seed":   return_seed,
                "portfolio_key": portfolio_key,
            })
            st.session_state[_tk(level_id, "investments")] = inv_list
            # Persist to localStorage (current_value = amount; updated at level complete)
            _entry = json.dumps({
                "name":          company.name,
                "tagline":       company.tagline,
                "level":         level_id,
                "amount":        amount,
                "ask":           company.ask,
                "current_value": amount,
                "return_pct":    0.0,
                "status":        "active",
                "team":          company.team,
                "market":        company.market,
                "traction":      company.traction,
                "technology":    company.technology,
                "unit_economics":company.unit_economics,
                "moat":          company.moat,
                "return_seed":   return_seed,
            })
            _cid = json.dumps(portfolio_key)
            _cap_after = st.session_state.capital
            components.html(
                f"""<script>
                try {{
                    var p = JSON.parse(localStorage.getItem('kv_portfolio') || '{{}}');
                    p[{_cid}] = {_entry};
                    localStorage.setItem('kv_portfolio', JSON.stringify(p));
                    localStorage.setItem('kv_capital', '{_cap_after}');
                }} catch(e) {{}}
                </script>""",
                height=1,
            )
        st.session_state[processed_key] = True

    capital = st.session_state.get("capital", 1_000_000)
    if answer == "invest":
        verdict_color = "#4aff8c"
        verdict_label = f"INVESTED ${amount:,}"
        verdict_sub   = f"Capital remaining: ${capital:,}"
    else:
        verdict_color = "#7a6a58"
        verdict_label = "PASSED"
        verdict_sub   = f"Capital remaining: ${capital:,}"

    st.markdown(
        f"""
        <div style="max-width:560px;margin:0 auto;
                    font-family:'Courier New',monospace;color:#f4dab4;
                    text-align:center;padding:16px 0 24px;">
            <div style="font-size:26px;font-weight:bold;color:{verdict_color};
                         letter-spacing:0.08em;
                         text-shadow:0 0 16px {verdict_color}60;">
                {verdict_label}
            </div>
            <div style="font-size:12px;color:#7a6a58;margin-top:8px;">
                {verdict_sub}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    _, col, _ = st.columns([1, 2, 1])
    with col:
        st.markdown(company_card_html(company), unsafe_allow_html=True)
        st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)
        is_last   = (rnd + 1) >= ROUNDS_PER_LEVEL
        btn_label = "CLOSE RUN &#8594;" if is_last else "NEXT COMPANY &#8594;"
        if st.button(btn_label, key=f"game{level_id}_next_{rnd}"):
            st.session_state[_tk(level_id, "answer")]        = None
            st.session_state[_tk(level_id, "invest_amount")] = 0
            if is_last:
                st.session_state[_tk(level_id, "phase")] = "complete"
            else:
                st.session_state[_tk(level_id, "round")] = rnd + 1
                st.session_state[_tk(level_id, "seed")]  = random.randint(0, 99_999)
                st.session_state[_tk(level_id, "phase")] = "question"
            st.rerun()


def _game_complete(level_id: int, cfg: Dict) -> None:
    investments = st.session_state.get(_tk(level_id, "investments"), [])

    # ── Calculate returns (guarded: only once per level completion) ──────────
    # P&L stays in portfolio — capital is NOT replenished; players must SELL to unlock cash
    returns_key = _tk(level_id, "returns_applied")
    if returns_key not in st.session_state:
        for inv in investments:
            avg  = (inv["team"] + inv["market"] + inv["traction"] +
                    inv["technology"] + inv["unit_economics"] + inv["moat"]) / 6.0
            mult = _calc_return_multiplier(avg, inv["return_seed"])
            curr_val = round(inv["amount"] * mult)
            pnl      = curr_val - inv["amount"]
            inv["multiplier"]    = mult
            inv["current_value"] = curr_val
            inv["pnl"]           = pnl
            inv["return_pct"]    = round((mult - 1.0) * 100, 1)
            # Capital NOT modified here — gains stay in portfolio, not liquid cash
        st.session_state[_tk(level_id, "investments")] = investments
        st.session_state[returns_key] = True

    capital        = st.session_state.get("capital", 1_000_000)
    total_deployed = sum(inv["amount"] for inv in investments)
    total_pnl      = sum(inv.get("pnl", 0) for inv in investments)

    # Build the completed-levels list so the MAP link can carry it in the URL
    # (explore_screen reads it as a fallback when localStorage isn't yet updated)
    _prev_completed_param = st.query_params.get("completed", "")
    _prev_completed: list = []
    if _prev_completed_param:
        try:
            _prev_completed = [int(x) for x in _prev_completed_param.split(",") if x.strip()]
        except ValueError:
            _prev_completed = []
    _all_completed = sorted(set(_prev_completed) | {level_id})
    _completed_str = ",".join(str(x) for x in _all_completed)

    # ── Build return rows for display ────────────────────────────────────────
    inv_rows = ""
    for inv in investments:
        pct   = inv.get("return_pct", 0.0)
        curr  = inv.get("current_value", inv["amount"])
        arrow = "&#9650;" if pct >= 0 else "&#9660;"
        color = "#4aff8c" if pct >= 5 else ("#ff4a4a" if pct < -5 else "#ffb35a")
        sign  = "+" if pct >= 0 else ""
        inv_rows += (
            f'<div style="display:flex;justify-content:space-between;'
            f'align-items:center;padding:9px 0;'
            f'border-bottom:1px solid rgba(255,168,76,0.08);">'
            f'<span style="color:#f4dab4;font-size:12px;">{inv["name"]}</span>'
            f'<span style="font-size:12px;text-align:right;">'
            f'<span style="color:{color};">{arrow}&nbsp;{sign}{pct:.1f}%</span>'
            f'&nbsp;&nbsp;'
            f'<span style="color:#7a6a58;">${inv["amount"]:,}</span>'
            f'<span style="color:#3a2a18;"> &#8594; </span>'
            f'<span style="color:{color};">${curr:,}</span>'
            f'</span>'
            f'</div>'
        )
    if not inv_rows:
        inv_rows = (
            '<div style="color:#3a2a18;font-size:11px;padding:8px 0;">'
            "No investments made this run.</div>"
        )

    pnl_color = "#4aff8c" if total_pnl >= 0 else "#ff4a4a"
    pnl_sign  = "+" if total_pnl >= 0 else ""

    st.markdown(
        f"""
        <div style="max-width:560px;margin:20px auto;
                    font-family:'Courier New',monospace;color:#f4dab4;
                    text-align:center;">
            <div style="font-size:10px;color:#ffb35a;letter-spacing:0.25em;
                        margin-bottom:10px;">LEVEL {level_id} COMPLETE</div>
            <div style="font-size:30px;font-weight:bold;letter-spacing:0.06em;
                        margin-bottom:8px;text-shadow:0 0 20px #ff8c1a60;">
                RUN CLOSED
            </div>
            <div style="font-size:13px;color:#7a6a58;margin-bottom:30px;">
                {len(investments)}/{ROUNDS_PER_LEVEL} backed
                &nbsp;&#8226;&nbsp;
                &#128176;&nbsp;${total_deployed:,} deployed
                &nbsp;&#8226;&nbsp;
                <span style="color:{pnl_color};">{pnl_sign}${total_pnl:,} P&amp;L</span>
            </div>
            <div style="background:rgba(4,5,9,0.85);
                        border:1px solid rgba(255,168,76,0.18);
                        border-radius:6px;padding:16px 20px;
                        font-size:12px;line-height:1.8;
                        margin-bottom:16px;text-align:left;">
                <div style="color:#ffb35a;font-size:10px;letter-spacing:0.15em;
                             margin-bottom:12px;">&#9632; PORTFOLIO RETURNS</div>
                {inv_rows}
            </div>
            <div style="background:rgba(4,5,9,0.60);
                        border:1px solid rgba(255,168,76,0.10);
                        border-radius:6px;padding:12px 20px;
                        font-size:12px;color:#6a5a4a;
                        margin-bottom:30px;text-align:left;">
                Capital remaining:
                <span style="color:#f4dab4;float:right;">${capital:,}</span>
            </div>
            <div style="display:flex;gap:16px;justify-content:center;">
                <a href="?page=explore&completed={_completed_str}"
                   style="display:inline-flex;align-items:center;
                          justify-content:center;padding:11px 28px;
                          background:rgba(4,5,9,0.90);
                          border:1px solid rgba(255,168,76,0.30);border-radius:4px;
                          color:#9a8a78;font-family:'Courier New',monospace;
                          font-size:13px;letter-spacing:0.10em;
                          text-shadow:0 0 6px #ff8c1a50;text-decoration:none;">
                    &#8592;&nbsp;MAP
                </a>
                <a href="?page=portfolio"
                   style="display:inline-flex;align-items:center;
                          justify-content:center;padding:11px 28px;
                          background:rgba(4,5,9,0.90);
                          border:1px solid rgba(255,168,76,0.58);border-radius:4px;
                          color:#f4dab4;font-family:'Courier New',monospace;
                          font-size:13px;letter-spacing:0.10em;
                          text-shadow:0 0 8px #ff8c1a;text-decoration:none;">
                    PORTFOLIO &#8594;
                </a>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── Persist level completion + re-value ALL portfolio entries ────────────
    # This single JS block:
    #  1. Marks the level complete
    #  2. Re-values every portfolio entry using the seeded return formula
    #     (market "moves" each time a new level completes, keyed on completion count)
    #  3. Writes kv_capital and kv_portfolio_total so the next level tab picks
    #     up the correct CAPITAL and NET WORTH via URL params
    _cap_now = st.session_state.get("capital", 1_000_000)
    components.html(
        f"""<script>
        (function() {{
        try {{
            // 1. Mark complete
            var c = JSON.parse(localStorage.getItem('kv_completed') || '[]');
            if (c.indexOf({level_id}) === -1) c.push({level_id});
            localStorage.setItem('kv_completed', JSON.stringify(c));
            var completedCount = c.length;

            // 2. Seeded pseudo-random (sin-based, good enough for visual noise)
            function pseudoRnd(seed) {{
                var x = Math.sin(seed + 1) * 10000;
                return x - Math.floor(x);
            }}
            function calcMult(avg, noiseSeed) {{
                var base  = Math.pow(avg / 3.0, 2.5);
                // "market drift" noise shifts with each new completion
                var noise = 0.80 + pseudoRnd(noiseSeed + completedCount * 31337) * 0.40;
                return Math.max(0.05, Math.min(5.0, base * noise));
            }}

            // 3. Re-value every entry in kv_portfolio
            var p = JSON.parse(localStorage.getItem('kv_portfolio') || '{{}}');
            for (var k in p) {{
                var e = p[k];
                if (e.team === undefined) continue; // no metrics stored
                var avg = (e.team + e.market + e.traction +
                           e.technology + e.unit_economics + e.moat) / 6.0;
                var mult = calcMult(avg, e.return_seed || 0);
                e.current_value = Math.round(e.amount * mult);
                e.return_pct    = Math.round((mult - 1.0) * 100 * 10) / 10;
                e.status        = 'valued';
                p[k] = e;
            }}
            localStorage.setItem('kv_portfolio', JSON.stringify(p));

            // 4. Compute portfolio total (for NET WORTH in next level's top bar)
            var portfolioTotal = 0;
            for (var k in p) portfolioTotal += (p[k].current_value || p[k].amount || 0);
            localStorage.setItem('kv_portfolio_total', String(portfolioTotal));

            // 5. Persist liquid capital
            localStorage.setItem('kv_capital', '{_cap_now}');
        }} catch(e) {{ console.error('kv_complete error', e); }}
        }})();
        </script>""",
        height=1,
    )


def _tutorial_level_dispatch(level_id: int) -> None:
    """Initialise tutorial/game level session state and route to the correct phase."""
    cfg        = LEVEL_TUTORIALS[level_id]
    phase_key  = _tk(level_id, "phase")
    seed_key   = _tk(level_id, "seed")
    round_key  = _tk(level_id, "round")
    answer_key = _tk(level_id, "answer")

    if phase_key  not in st.session_state:
        st.session_state[phase_key]  = "intro"
    if seed_key   not in st.session_state:
        st.session_state[seed_key]   = random.randint(0, 99_999)
    if round_key  not in st.session_state:
        st.session_state[round_key]  = 0
    if answer_key not in st.session_state:
        st.session_state[answer_key] = None

    phase   = st.session_state[phase_key]
    seed    = st.session_state[seed_key]
    is_game = cfg.get("mode") == "game"
    # For game levels, scale company ask to the level's invest_steps so buttons always show
    company = generate_tutorial_company(
        seed,
        invest_steps=cfg.get("invest_steps") if is_game else None,
    )

    if phase == "intro":
        _game_intro(level_id, cfg) if is_game else _tutorial_intro(level_id, cfg)
    elif phase == "question":
        _game_question(level_id, company, cfg) if is_game else _tutorial_question(level_id, company, cfg)
    elif phase == "result":
        if st.session_state[answer_key] is None:
            st.session_state[phase_key] = "question"
            st.rerun()
        else:
            _game_result(level_id, company, cfg) if is_game else _tutorial_result(level_id, company, cfg)
    elif phase == "complete":
        _game_complete(level_id, cfg) if is_game else _tutorial_complete(level_id, cfg)
    else:
        st.session_state[phase_key] = "intro"
        st.rerun()


# ---- LEVEL (main entry) ------------------------------------------
def level_screen(level_id: int) -> None:
    _level_common_css()
    _level_top_bar(level_id)

    if level_id in LEVEL_TUTORIALS:
        _tutorial_level_dispatch(level_id)
    else:
        st.markdown(
            f"""
            <div style="text-align:center;color:#3a2a18;
                        font-family:'Courier New',monospace;padding:80px;">
                Level {level_id} has not yet been mapped.
            </div>
            """,
            unsafe_allow_html=True,
        )


# ==================================================
# ------------------- ENTRYPOINT -------------------
# ==================================================
def main() -> None:
    # Initialise persistent game state (survives st.rerun, resets on page reload)
    if "capital" not in st.session_state:
        # Restore capital from URL param (set by explore map when opening a level tab)
        _cap_param = st.query_params.get("capital", None)
        try:
            st.session_state.capital = int(_cap_param) if _cap_param else 1_000_000
        except (ValueError, TypeError):
            st.session_state.capital = 1_000_000
    if "portfolio_total" not in st.session_state:
        # Restore historical portfolio value from URL param (computed after each level completes)
        _pt_param = st.query_params.get("portfolio_total", None)
        try:
            st.session_state.portfolio_total = int(_pt_param) if _pt_param else 0
        except (ValueError, TypeError):
            st.session_state.portfolio_total = 0
    if "portfolio" not in st.session_state:
        st.session_state.portfolio = {}   # company_id → {name, level, amount}
    if "coins" not in st.session_state:
        st.session_state.coins = 100

    inject_global_css()

    page        = get_query_param("page", default="home")
    level_param = get_query_param("level")
    try:
        selected_level = int(level_param) if level_param else None
    except ValueError:
        selected_level = None

    if   page == "level"     and selected_level: level_screen(selected_level)
    elif page == "explore":   explore_screen(selected_level)
    elif page == "portfolio": portfolio_screen()
    elif page == "settings":  settings_screen()
    else:                     home_screen()


if __name__ == "__main__":
    main()
