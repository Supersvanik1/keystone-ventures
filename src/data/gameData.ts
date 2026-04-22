// ==================================================
// DATA MODEL
// ==================================================
export interface Level {
  id: number;
  risk: string;
  capital: string;
  reward: string;
  narrative: string;
  x: number; // % from left
}

export interface Company {
  id: string;
  name: string;
  tagline: string;
  team: number;
  market: number;
  traction: number;
  technology: number;
  unit_economics: number;
  moat: number;
  description: string;
  ask: number;
}

export interface TutorialConfig {
  title: string;
  focus: string[] | 'ALL';
  metric_keys?: string[];
  threshold?: number;
  rounds?: number;
  lesson: string;
  mode?: 'game';
  invest_steps?: number[];
}

// ==================================================
// LEVEL GENERATION
// ==================================================
const LEVEL_CHUNK_SIZE = 40;
const LEVEL_X_JITTER = 8;
const LEVEL_SPACING_PX = 120;
const MAP_TOP_PAD_PX = 100;
const MAP_BOT_PAD_PX = 180;

export const LEVEL_SPACING = LEVEL_SPACING_PX;
export const MAP_TOP_PAD = MAP_TOP_PAD_PX;

function procedural_risk(level_id: number): string {
  if (level_id <= 3) return 'Foundation';
  if (level_id <= 8) return 'Measured';
  if (level_id <= 15) return 'Speculative';
  if (level_id <= 25) return 'Frontier';
  return 'Abyssal';
}

function procedural_capital(level_id: number): string {
  return `$${(250_000 * (1 + Math.floor(level_id / 3))).toLocaleString()}`;
}

function procedural_reward(level_id: number): string {
  return `${(2 + Math.pow(level_id, 1.2) / 4).toFixed(1)}x potential`;
}

const NARRATIVES = [
  'An overlooked seam of talent buried under legacy markets.',
  'An unstable cavern of infra where few dare to tread.',
  'A forgotten shard of a once-crowded thesis, now strangely quiet.',
  'A glowing fault line between regulation and raw demand.',
  'A narrow bridge over a chasm of execution risk.',
];

function procedural_narrative(level_id: number): string {
  return NARRATIVES[level_id % NARRATIVES.length];
}

// Seeded random using LCG to be deterministic
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateLevels(): Level[] {
  const levels: Level[] = [];
  const rng = seededRandom(42); // fixed seed for consistent layout
  for (let i = 0; i < LEVEL_CHUNK_SIZE; i++) {
    const lvl = i + 1;
    const jitter = Math.floor(rng() * (LEVEL_X_JITTER * 2 + 1)) - LEVEL_X_JITTER;
    const x = 48 + jitter;
    levels.push({
      id: lvl,
      risk: procedural_risk(lvl),
      capital: procedural_capital(lvl),
      reward: procedural_reward(lvl),
      narrative: procedural_narrative(lvl),
      x,
    });
  }
  return levels;
}

export const LEVELS: Level[] = generateLevels();
export const LEVEL_INDEX: Record<number, Level> = Object.fromEntries(LEVELS.map(l => [l.id, l]));

export function level_top_px(lvl_id: number): number {
  return MAP_TOP_PAD_PX + (LEVEL_CHUNK_SIZE - lvl_id) * LEVEL_SPACING_PX;
}

export function map_inner_height_px(): number {
  return MAP_TOP_PAD_PX + (LEVEL_CHUNK_SIZE - 1) * LEVEL_SPACING_PX + MAP_BOT_PAD_PX;
}

// ==================================================
// LEVEL 1 COMPANIES
// ==================================================
export const LEVEL_1_COMPANIES: Company[] = [
  {
    id: 'l1_arboris',
    name: 'Arboris Labs',
    tagline: 'Precision OS for controlled-environment agriculture',
    team: 5, market: 3, traction: 2, technology: 4,
    unit_economics: 2, moat: 3,
    description:
      'Two-time founders with a prior exit and PhDs in ag-systems. ' +
      'Early stage, but extremely credible. The team is what makes this investable.',
    ask: 150_000,
  },
  {
    id: 'l1_ventra',
    name: 'Ventra Fleet',
    tagline: 'Real-time route optimisation SaaS for mid-market logistics',
    team: 3, market: 5, traction: 3, technology: 3,
    unit_economics: 4, moat: 2,
    description:
      'First-time founders in a massive, booming market. Smart but untested. ' +
      'The market would forgive a lot — if the team can execute under pressure.',
    ask: 200_000,
  },
  {
    id: 'l1_noctem',
    name: 'Noctem Health',
    tagline: 'Adaptive sleep-health platform for shift workers',
    team: 2, market: 4, traction: 2, technology: 3,
    unit_economics: 2, moat: 2,
    description:
      'Solo clinical researcher pivoting into tech. Compelling thesis, thin founding team. ' +
      'Great insight — but who will build and sell it?',
    ask: 100_000,
  },
];

// ==================================================
// TUTORIAL / GAME LEVEL CONFIGS
// ==================================================
export const LEVEL_TUTORIALS: Record<number, TutorialConfig> = {
  1: {
    title: 'FIRST SIGNALS',
    focus: ['TEAM', 'MARKET'],
    metric_keys: ['team', 'market'],
    threshold: 3,
    rounds: 3,
    lesson:
      'Every investment starts with two fundamental questions: who is building this, and how large is the opportunity? ' +
      'A brilliant team in a dying market has no engine. A massive market with an unqualified team has no steering. ' +
      'Both must clear the bar.',
  },
  2: {
    title: 'THE FULL PICTURE',
    focus: ['TRACTION', 'TECHNOLOGY', 'ECONOMICS'],
    metric_keys: ['traction', 'technology', 'unit_economics'],
    threshold: 3,
    rounds: 2,
    lesson:
      'Vision and people aren\'t enough. Can they build it, are customers responding, and does the business model hold? ' +
      'Traction, technology, and unit economics are where great stories either prove themselves or quietly fall apart.',
  },
  3: {
    title: 'FIRST DESCENT',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Training is over. This is a live investment run — all six metrics are on the table and capital is real. ' +
      'Size each position carefully: there is no undo.',
    invest_steps: [50_000, 100_000, 250_000, 500_000],
  },
  4: {
    title: 'THE SECOND WAVE',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Second-wave companies often look like first-wave failures — same thesis, different timing. ' +
      'The market was right all along; the first movers were just too early. ' +
      'Look for teams that learned from what broke before them.',
    invest_steps: [50_000, 100_000, 250_000, 500_000],
  },
  5: {
    title: 'NOISE FLOOR',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Every signal in venture is wrapped in noise. Founders spin, markets hype, and decks are designed to impress. ' +
      'Your edge is in cutting through the narrative and reading the underlying numbers with cold clarity.',
    invest_steps: [75_000, 150_000, 300_000, 500_000],
  },
  6: {
    title: 'THE INFORMED BET',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Conviction is scarce and expensive. The best investors don\'t spread thin — they concentrate capital on the ideas they believe in most. ' +
      'Every dollar you hold back is a dollar not compounding. Size your positions with intention.',
    invest_steps: [75_000, 150_000, 350_000, 600_000],
  },
  7: {
    title: 'DEAD RECKONING',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Deep in the descent now. You have no guarantees, no map, and no oracle — only the data in front of you. ' +
      'Dead reckoning is navigation by known speed and heading, not landmarks. Trust your framework and commit.',
    invest_steps: [100_000, 200_000, 400_000, 750_000],
  },
  8: {
    title: 'OPERATOR\'S EDGE',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Pattern recognition is the investor\'s compounding asset. You\'ve now seen enough deals to start building instinct. ' +
      'When a company\'s profile feels familiar — good or bad — trust that instinct, then verify it against the metrics.',
    invest_steps: [100_000, 200_000, 400_000, 750_000],
  },
  9: {
    title: 'THE CONTRARIAN PLAY',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'The best returns come from being right when everyone else is wrong. ' +
      'A weak market metric might signal timing, not ceiling. A low traction score in a pre-product company is expected, not damning. ' +
      'Context distinguishes contrarian from reckless.',
    invest_steps: [100_000, 250_000, 500_000, 750_000],
  },
  10: {
    title: 'CRISIS CAPITAL',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Downturns are the proving ground for serious investors. When sentiment collapses and valuations reset, ' +
      'the fundamentals matter more — not less. The companies with strong unit economics and real moats survive. Back the survivors.',
    invest_steps: [50_000, 200_000, 500_000, 1_000_000],
  },
  11: {
    title: 'THE SCARCITY ROUND',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Capital is finite. Every position you take forecloses another. ' +
      'The real discipline isn\'t knowing when to invest — it\'s knowing when to pass. ' +
      'An empty allocation slot is not a failure; it is optionality preserved for the right deal.',
    invest_steps: [150_000, 300_000, 600_000, 1_000_000],
  },
  12: {
    title: 'THE DEEP CAVE',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Well past halfway now. The air is thinner here — fewer obvious opportunities, higher concentration of risk. ' +
      'The companies reaching you at this depth are either genuinely exceptional or deeply flawed. ' +
      'There is almost nothing in between.',
    invest_steps: [200_000, 400_000, 750_000, 1_000_000],
  },
  13: {
    title: 'SYNTHETIC SIGNALS',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'At this stage, every founder has rehearsed their story. The metrics are polished, the narrative is tight. ' +
      'Your job is to find what doesn\'t fit — the outlier data point, the mismatched claim, the metric that should be higher given the rest. ' +
      'Gaps reveal truth.',
    invest_steps: [200_000, 500_000, 750_000, 1_500_000],
  },
  14: {
    title: 'THE COLD SEAM',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Pressure and temperature rise together this deep. Decisions that felt straightforward at the surface are now weighted with real consequence. ' +
      'Your capital base has either grown or shrunk based on prior calls. Adjust your sizing accordingly.',
    invest_steps: [250_000, 500_000, 1_000_000, 1_500_000],
  },
  15: {
    title: 'FAULT LINES',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'Risk is not the enemy — uncompensated risk is. A company with weak moat and strong traction might grow fast and die young. ' +
      'One with strong moat and weak market may stagnate forever. The combination of metrics tells the full story; any single one lies.',
    invest_steps: [250_000, 500_000, 1_000_000, 2_000_000],
  },
  16: {
    title: 'THE LAST DESCENT',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'One level from the summit. Your choices here will define your final capital position. ' +
      'The companies at this depth are the rarest kind — fully formed bets that could either compound your gains into legend or erase what remains. ' +
      'Choose deliberately.',
    invest_steps: [300_000, 750_000, 1_500_000, 2_500_000],
  },
  17: {
    title: 'THE SUMMIT',
    focus: 'ALL',
    mode: 'game',
    lesson:
      'You are at the deepest point of the cave — and the highest point of your career. ' +
      'Every framework you\'ve built, every pattern you\'ve learned, every mistake you\'ve survived has led here. ' +
      'Three companies. Unlimited ambition. No second chances. Invest accordingly.',
    invest_steps: [500_000, 1_000_000, 2_000_000, 5_000_000],
  },
};

// ==================================================
// METRIC PROFILES
// ==================================================
export interface MetricProfile { label: string; desc: string; }

export const TEAM_PROFILES: Record<number, MetricProfile> = {
  1: { label: 'Solo / Unproven', desc: 'Single founder with no prior startup experience. Execution risk is extreme — one illness, one pivot, and the company can stall entirely.' },
  2: { label: 'Early Team / Thin', desc: 'Small founding team, limited relevant experience. Key gaps in technical or commercial leadership remain unfilled. Dependency risk is high.' },
  3: { label: 'Functional / Average', desc: 'Balanced team with some domain expertise. Credible but not exceptional — capable of execution in calm conditions, but unproven under real pressure.' },
  4: { label: 'Strong / Experienced', desc: 'Experienced founders with relevant track records. Demonstrates execution capability and ability to attract talent. High confidence in the team\'s ability to navigate adversity.' },
  5: { label: 'World-Class', desc: 'Serial founders or recognised domain leaders. Exceptional network, fundraising ability, and pattern-recognition. This team is often reason enough to invest.' },
};

export const MARKET_PROFILES: Record<number, MetricProfile> = {
  1: { label: 'Micro / Niche', desc: 'Tiny addressable market with a limited growth ceiling. Even perfect execution yields a small outcome — not venture-scale.' },
  2: { label: 'Small / Fragmented', desc: 'Limited market size or highly fragmented with no clear consolidator. Difficult to build a scalable business without significant aggregation.' },
  3: { label: 'Moderate / Regional', desc: 'Decent market size but growth is slow or the opportunity is geographically limited. Serviceable, but not a venture-scale thesis.' },
  4: { label: 'Large / Growing', desc: 'Significant market with clear growth tailwinds. The tide is rising — execution matters more than luck. A strong team here can build something big.' },
  5: { label: 'Massive / Explosive', desc: 'Category-defining market opportunity. The kind of TAM that venture capital is built to fund. Timing and tailwinds are exceptional.' },
};

export const TRACTION_PROFILES: Record<number, MetricProfile> = {
  1: { label: 'No Traction', desc: 'Pre-revenue, pre-customer. Nothing but a pitch deck. The idea may be compelling, but there\'s no market validation yet.' },
  2: { label: 'Early Signals', desc: 'A handful of design partners or letters of intent. Interest is there, but it\'s too early to read the signal clearly.' },
  3: { label: 'Emerging Proof', desc: 'Early paying customers and measurable growth. The market is beginning to respond — enough signal to take seriously at this stage.' },
  4: { label: 'Strong Pull', desc: 'Clear revenue growth, strong retention, and organic word-of-mouth. The product is finding its market and the numbers confirm it.' },
  5: { label: 'Breakout Momentum', desc: 'Exceptional growth that speaks for itself. The kind of traction that attracts term sheets before the deck is finished.' },
};

export const TECHNOLOGY_PROFILES: Record<number, MetricProfile> = {
  1: { label: 'Commodity Stack', desc: 'Off-the-shelf tooling with no proprietary layer. Anyone with a weekend and a credit card can replicate this.' },
  2: { label: 'Minor Differentiation', desc: 'Some customisation, but nothing deeply defensible. A well-funded competitor could catch up within months.' },
  3: { label: 'Functional Advantage', desc: 'Meaningful technical capability that works today. Defensible in the short term but not yet a structural moat.' },
  4: { label: 'Strong IP / Architecture', desc: 'Proprietary algorithms, novel architecture, or deep data assets. Difficult for competitors to replicate without equivalent investment.' },
  5: { label: 'Category-Defining Tech', desc: 'Breakthrough capability that defines a new category. Years of research, patents, or unique data give it lasting and compounding protection.' },
};

export const ECONOMICS_PROFILES: Record<number, MetricProfile> = {
  1: { label: 'Deeply Negative', desc: 'Every customer acquired costs far more than they generate. The business model requires a fundamental rethink before scaling.' },
  2: { label: 'Structurally Challenged', desc: 'Losses per unit are significant. Relies entirely on future pricing power or cost efficiencies that haven\'t materialised yet.' },
  3: { label: 'Near Breakeven', desc: 'Unit economics are marginal but a visible path to profitability exists. Scale may cure the remaining issues if execution holds.' },
  4: { label: 'Healthy Margins', desc: 'Positive or near-positive unit economics with a clear path to strong margins at scale. The business model is fundamentally sound.' },
  5: { label: 'Exceptional Economics', desc: 'High-margin, capital-efficient business with strong customer LTV. Each unit of growth compounds the overall health of the business.' },
};

export const METRIC_PROFILES: Record<string, Record<number, MetricProfile>> = {
  team: TEAM_PROFILES,
  market: MARKET_PROFILES,
  traction: TRACTION_PROFILES,
  technology: TECHNOLOGY_PROFILES,
  unit_economics: ECONOMICS_PROFILES,
};

export const MK_LABEL: Record<string, string> = {
  team: 'TEAM', market: 'MARKET', traction: 'TRACTION',
  technology: 'TECHNOLOGY', unit_economics: 'ECONOMICS', moat: 'MOAT',
};

// ==================================================
// COMPANY GENERATION
// ==================================================
const NAME_PARTS: string[][] = [
  ['Arbo','Vexa','Noca','Flyx','Omni','Plex','Tera','Nova','Apex','Crux',
   'Luma','Sync','Kova','Zinc','Aura','Celo','Prex','Velo','Sora','Axon'],
  ['ris','tra','tem','flow','sys','core','Labs','Works','AI','HQ',
   'Net','Hub','Tech','Forge','Ops','IO','Ware','Bolt','Grid','Shift'],
];

const TAGLINES = [
  'Reimagining {domain} for the {market} era.',
  'The operating system for {domain}.',
  'Automating {domain} at scale.',
  '{market}-native infrastructure for {domain}.',
  'Connecting the fragmented {domain} market.',
  'AI-powered {domain} for the modern enterprise.',
  'The future of {domain} starts here.',
  'Data intelligence for {domain} leaders.',
  'Disrupting {domain} from the ground up.',
  'Next-gen {domain} built for the {market} world.',
];

const DOMAINS = [
  'logistics','healthcare delivery','fintech compliance','agri-tech',
  'climate risk','legal operations','commercial real estate','edtech',
  'supply chain','insurance underwriting','workforce management',
  'procurement','fleet operations','digital health',
];

const MARKETS = [
  'cloud-first','AI-native','mobile-first','post-pandemic',
  'distributed-work','Gen-Z','next-generation','enterprise',
];

export const COIN_REWARD = 50;
export const ROUNDS_PER_LEVEL = 3;

export function generateTutorialCompany(seed: number, invest_steps?: number[]): Company {
  const rng = seededRandom(seed);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

  const name = pick(NAME_PARTS[0]) + pick(NAME_PARTS[1]);
  const domain = pick(DOMAINS);
  const market = pick(MARKETS);
  const tagline = pick(TAGLINES)
    .replace('{domain}', domain)
    .replace('{market}', market);
  const team = randInt(1, 5);

  let ask: number;
  if (invest_steps && invest_steps.length > 0) {
    const mid = Math.max(1, Math.floor(invest_steps.length / 2) + 1);
    const choices = invest_steps.slice(0, mid);
    ask = choices[Math.floor(rng() * choices.length)];
  } else {
    ask = pick([50_000, 75_000, 100_000, 150_000, 200_000]);
  }

  return {
    id: `tutorial_${seed}`,
    name,
    tagline,
    team,
    market: randInt(1, 5),
    traction: randInt(1, 5),
    technology: randInt(1, 5),
    unit_economics: randInt(1, 5),
    moat: randInt(1, 5),
    description: TEAM_PROFILES[team].desc,
    ask,
  };
}

export function calcReturnMultiplier(avg: number, noiseSeed: number): number {
  const base = Math.pow(avg / 3.0, 2.5);
  // sin-based pseudo-random noise
  const x = Math.sin(noiseSeed + 1) * 10000;
  const noise = 0.80 + (x - Math.floor(x)) * 0.40;
  return Math.max(0.05, Math.min(5.0, Math.round(base * noise * 10000) / 10000));
}
