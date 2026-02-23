import { Scenario, SurvivalDifficulty } from "@shared/schema";

// 30 days of pre-generated scenarios (5 per day = 150 total)
// Scenarios cycle back to day 1 after day 30

export const staticScenarioSets: Scenario[][] = [
  // Day 1
  [
    {
      id: "day1-tech",
      category: "tech",
      context: "Cash $3,800 | Debt $200 | Credit 690 | Stress 44 | Portfolio: 70% in company stock",
      question: "$10k RSUs vest. Your portfolio is already 70% company stock. What do you do?",
      choices: [
        { label: "A", text: "Sell 70% and diversify into index funds", isCorrect: true, points: 100, feedback: "Smart move! Diversification protects your wealth while keeping some company upside." },
        { label: "B", text: "Hold all RSUs — belief = wealth", isCorrect: false, points: -20, feedback: "Concentration risk is real. Many tech workers lost everything when their company stock crashed." },
        { label: "C", text: "Upgrade your apartment (fixed costs up)", isCorrect: false, points: -40, feedback: "Classic lifestyle creep! Increasing fixed expenses with volatile income is risky." },
        { label: "D", text: "Sell 100% and go cash", isCorrect: false, points: 40, feedback: "Too conservative if you have job stability, but reasonable if layoff risk is high." }
      ],
      deepDive: {
        teaching: "Concentration risk can wipe out years of savings. Your job already depends on your company - your investments shouldn't too.",
        alternative: "Sell 50-70% of RSUs immediately upon vesting and reinvest in broad market index funds like VTI or VOO.",
        ruleOfThumb: "Never have more than 10-15% of your portfolio in any single stock, including company stock.",
        realWorldExample: "Enron employees had 62% of their 401k in company stock. When it collapsed in 2001, they lost both jobs AND retirement savings."
      }
    },
    {
      id: "day1-scam",
      category: "scam",
      context: "Cash $1,500 | Debt $0 | Credit 700 | Stress 40",
      question: "Caller ID shows your bank. They know your name + last transaction. They ask for OTP to 'verify' your account.",
      choices: [
        { label: "A", text: "Ask for employee ID then proceed", isCorrect: false, points: -30, feedback: "Employee IDs can be faked. Hang up and call your bank directly." },
        { label: "B", text: "Ask them to email proof first", isCorrect: false, points: 10, feedback: "Still risky. Scammers can fake emails too. Call your bank directly instead." },
        { label: "C", text: "Give OTP to verify your identity", isCorrect: false, points: -100, feedback: "Never give OTP over the phone! This is a spoofing scam. Banks never ask for OTP." },
        { label: "D", text: "Hang up and call number on back of card", isCorrect: true, points: 100, feedback: "Perfect! Always verify by calling official numbers you trust, not numbers given to you." }
      ],
      deepDive: {
        teaching: "Caller ID spoofing is easy. Scammers buy your data from breaches, then use urgency to bypass your judgment.",
        alternative: null,
        ruleOfThumb: "If someone calls you asking for ANY codes or passwords, hang up. Real banks never do this.",
        realWorldExample: "In 2023, Americans lost $10 billion to phone scams. Bank impersonation is the #1 method used."
      }
    },
    {
      id: "day1-travel",
      category: "travel",
      context: "Cash $1,900 | Debt $600 | Credit 675 | Stress 47 | No travel fund",
      question: "Flight deal: $310 today. If you wait 30 days it might be $450 (60% chance). You have no travel fund.",
      choices: [
        { label: "A", text: "Skip travel this season", isCorrect: false, points: 50, feedback: "Reasonable if money is tight, but you're missing the chance to build good habits." },
        { label: "B", text: "Wait + start $10/day sinking fund", isCorrect: true, points: 100, feedback: "Great discipline! Building a travel fund prevents debt and teaches delayed gratification." },
        { label: "C", text: "Book now but cut spending to pay card in full", isCorrect: true, points: 80, feedback: "Good if you can truly commit to paying it off. Make sure you follow through!" },
        { label: "D", text: "Book now on credit card", isCorrect: false, points: -20, feedback: "Adding to debt for travel isn't ideal when you already have $600 in debt." }
      ],
      deepDive: {
        teaching: "FOMO deals create urgency that bypasses good judgment. A sinking fund lets you enjoy guilt-free spending later.",
        alternative: "Set up automatic transfers to a dedicated travel savings account before deals appear.",
        ruleOfThumb: "If you can't pay cash for a vacation, you can't afford it yet.",
        realWorldExample: "The average American carries $1,000 in vacation debt. Those who save first report 40% more trip satisfaction."
      }
    },
    {
      id: "day1-lifestyle",
      category: "lifestyle",
      context: "Cash $4,500 | Debt $0 | Credit 720 | Stress 35 | Just got a 15% raise",
      question: "Your friends are upgrading to nicer apartments after promotions. Your lease is up. What do you do?",
      choices: [
        { label: "A", text: "Stay where you are and invest the raise difference", isCorrect: true, points: 100, feedback: "Wealth building 101! Living below your means and investing the difference compounds massively." },
        { label: "B", text: "Move to a luxury building to match your success", isCorrect: false, points: -70, feedback: "This is pure lifestyle inflation. Your apartment doesn't define your success." },
        { label: "C", text: "Upgrade to a place that's 30% more expensive", isCorrect: false, points: -50, feedback: "Classic lifestyle creep! Your housing should stay around 25-30% of income, not grow with raises." },
        { label: "D", text: "Get a slightly nicer place, invest half the raise", isCorrect: true, points: 70, feedback: "Balanced approach. Small lifestyle improvements are fine if you're still saving more." }
      ],
      deepDive: {
        teaching: "Lifestyle creep is silent wealth destruction. Every dollar spent on upgrades is a dollar not compounding for decades.",
        alternative: "Automate investing the raise before you see it. What you don't see, you won't spend.",
        ruleOfThumb: "Save at least 50% of every raise. The other 50% can be lifestyle.",
        realWorldExample: "Two people earning $100k: one saves 20%, one saves 5%. After 30 years, the saver has $1.2M more."
      }
    },
    {
      id: "day1-investing",
      category: "investing",
      context: "Cash $8,000 | Emergency Fund: 3 months | No debt | Credit 750 | Age 28",
      question: "A friend's crypto pick is up 400% this year. They're 'sure' it'll keep going. You have $5k to invest.",
      choices: [
        { label: "A", text: "Keep it in savings, crypto is too risky", isCorrect: false, points: 20, feedback: "Holding cash long-term loses to inflation. At 28, you can afford market risk for higher returns." },
        { label: "B", text: "Put all $5k in a total market index fund", isCorrect: true, points: 90, feedback: "Conservative but wise. Consistent index investing beats most active strategies over time." },
        { label: "C", text: "Put all $5k into the crypto", isCorrect: false, points: -80, feedback: "FOMO investing rarely works. Past performance doesn't predict future returns, especially in crypto." },
        { label: "D", text: "Put $500 in crypto, $4,500 in index funds", isCorrect: true, points: 100, feedback: "Smart allocation! Small speculative bets are fine, but the bulk should be in diversified investments." }
      ],
      deepDive: {
        teaching: "FOMO (Fear Of Missing Out) is the enemy of good investing. Hot tips from friends usually arrive after the big gains.",
        alternative: "Use a 90/10 rule: 90% in boring index funds, 10% max for speculation.",
        ruleOfThumb: "If a friend is bragging about gains, it's probably too late to join.",
        realWorldExample: "90% of individual crypto traders lose money. The average S&P 500 return is 10%/year over decades."
      }
    }
  ],

  // Day 2
  [
    {
      id: "day2-career",
      category: "career",
      context: "Cash $5,000 | Debt $2,000 | Credit 710 | Stress 55 | Current salary: $75k",
      question: "You get a job offer for $95k but it requires relocating. Moving costs would be $8k. Your current job is stable.",
      choices: [
        { label: "A", text: "Take the job - the salary bump is worth it", isCorrect: true, points: 80, feedback: "A $20k raise pays back moving costs in months. Career growth often requires bold moves." },
        { label: "B", text: "Negotiate remote work instead of relocating", isCorrect: true, points: 100, feedback: "Best of both worlds! Always negotiate before accepting or declining." },
        { label: "C", text: "Stay put - stability is more valuable", isCorrect: false, points: 30, feedback: "Stability has value, but passing on a 27% raise is a big opportunity cost." },
        { label: "D", text: "Take the job and put moving costs on credit cards", isCorrect: false, points: -20, feedback: "Starting a new job in debt adds stress. Negotiate a signing bonus or relocation package instead." }
      ],
      deepDive: {
        teaching: "Career decisions should factor in total compensation, growth potential, and cost of living - not just base salary.",
        alternative: "Ask for a signing bonus or relocation stipend. Many companies have budgets for this.",
        ruleOfThumb: "If a move increases your salary by 20%+, it often pays off within 1-2 years even with moving costs.",
        realWorldExample: "Workers who change jobs every 2-3 years earn 50% more over their careers than those who stay put."
      }
    },
    {
      id: "day2-debt",
      category: "debt",
      context: "Cash $1,200 | Credit Card Debt $4,500 at 24% APR | Student Loans $25k at 5% | Credit 650",
      question: "You have an extra $500 this month. Where should it go?",
      choices: [
        { label: "A", text: "Pay credit card debt", isCorrect: true, points: 100, feedback: "Always attack the highest interest rate first. 24% APR is an emergency." },
        { label: "B", text: "Split between credit card and student loans", isCorrect: false, points: 40, feedback: "Mathematically, focusing on 24% APR first saves more money." },
        { label: "C", text: "Put it in savings for emergencies", isCorrect: false, points: 20, feedback: "With 24% APR debt, paying that off IS your emergency. You can always use the card if needed." },
        { label: "D", text: "Pay extra on student loans", isCorrect: false, points: -10, feedback: "5% interest is manageable. Prioritize the 24% credit card debt first." }
      ],
      deepDive: {
        teaching: "The debt avalanche method (paying highest interest first) saves the most money mathematically.",
        alternative: "If you need quick wins for motivation, the debt snowball (smallest balance first) works psychologically.",
        ruleOfThumb: "Any debt over 7% APR should be paid off before investing beyond employer 401k match.",
        realWorldExample: "$4,500 at 24% APR costs $1,080/year in interest alone. That's $90/month just to stay even."
      }
    },
    {
      id: "day2-scam",
      category: "scam",
      context: "Cash $2,000 | Debt $0 | Credit 720 | Stress 30",
      question: "An Instagram influencer you follow is promoting a 'guaranteed' forex trading course for $997. They show luxury lifestyle photos.",
      choices: [
        { label: "A", text: "Buy it - they clearly know what they're doing", isCorrect: false, points: -80, feedback: "Influencer lifestyle is often rented or fake. Real traders don't need to sell courses." },
        { label: "B", text: "Ask for proof of their trading returns first", isCorrect: false, points: 20, feedback: "Good instinct, but screenshots can be faked. The course itself is likely a scam." },
        { label: "C", text: "Skip it - if it was that easy, everyone would be rich", isCorrect: true, points: 100, feedback: "Exactly! The real money is in selling the dream, not forex trading." },
        { label: "D", text: "Start with their free content first", isCorrect: false, points: 40, feedback: "Free content is designed to upsell you. The business model is selling courses, not trading." }
      ],
      deepDive: {
        teaching: "Most 'get rich quick' courses make money by selling the course, not by using the methods they teach.",
        alternative: "Free resources like Investopedia, Khan Academy, and library books teach the same concepts.",
        ruleOfThumb: "If someone's secret to wealth is so good, why are they selling it for $997?",
        realWorldExample: "The FTC found that 99% of MLM participants lose money. Many 'gurus' make more from courses than trading."
      }
    },
    {
      id: "day2-lifestyle",
      category: "lifestyle",
      context: "Cash $3,500 | Debt $800 | Credit 695 | Stress 45 | Car is 10 years old but runs fine",
      question: "Your coworkers all drive newer cars. A dealer is offering 0% APR on a $35k vehicle. Your old car needs $600 in repairs.",
      choices: [
        { label: "A", text: "Buy the new car - 0% APR means it's basically free", isCorrect: false, points: -60, feedback: "0% APR doesn't mean free. You're still spending $35k that could grow in investments." },
        { label: "B", text: "Fix the old car and keep driving it", isCorrect: true, points: 100, feedback: "Perfect! $600 for years more of use beats $35k for a depreciating asset." },
        { label: "C", text: "Lease a cheaper car instead", isCorrect: false, points: -30, feedback: "Leasing means paying forever with nothing to show. Worst option financially." },
        { label: "D", text: "Buy a 3-year-old certified pre-owned car", isCorrect: true, points: 70, feedback: "Good middle ground if you need reliability. Let someone else pay the depreciation." }
      ],
      deepDive: {
        teaching: "Cars lose 20-30% of value in year one. Buying used lets others absorb that loss.",
        alternative: "The $600 repair probably buys 2+ more years of service. That's $25/month vs $400+/month for new.",
        ruleOfThumb: "Your car payment + insurance should be under 15% of take-home pay.",
        realWorldExample: "The average new car payment is $726/month. Investing that instead would yield $500k+ over 20 years."
      }
    },
    {
      id: "day2-investing",
      category: "investing",
      context: "Cash $12,000 | 401k: $45k | No debt | Credit 780 | Age 35",
      question: "Your 401k is all in a target-date fund. A coworker says you should actively manage it for better returns.",
      choices: [
        { label: "A", text: "Switch to actively managed funds with higher returns", isCorrect: false, points: -40, feedback: "Actively managed funds rarely beat index funds long-term, and have higher fees." },
        { label: "B", text: "Keep the target-date fund - set it and forget it", isCorrect: true, points: 100, feedback: "Target-date funds auto-rebalance and have low fees. Perfect for most investors." },
        { label: "C", text: "Move everything to company stock", isCorrect: false, points: -80, feedback: "Never put all your eggs in one basket. Your job already depends on the company." },
        { label: "D", text: "Split between target-date and index funds", isCorrect: true, points: 80, feedback: "Reasonable diversification, though target-date already includes broad market exposure." }
      ],
      deepDive: {
        teaching: "Over 90% of actively managed funds underperform index funds over 15+ year periods.",
        alternative: "If you want more control, use a simple 3-fund portfolio: US stocks, international stocks, bonds.",
        ruleOfThumb: "Investment fees of 0.1% vs 1% can cost you hundreds of thousands over a career.",
        realWorldExample: "Warren Buffett bet $1M that an S&P 500 index fund would beat hedge funds over 10 years. He won."
      }
    }
  ],

  // Day 3
  [
    {
      id: "day3-emergency",
      category: "emergency",
      context: "Cash $800 | Emergency Fund $0 | Debt $1,500 | Credit 670 | Stress 60",
      question: "Your car breaks down. Repair cost is $1,200. You need the car for work. What do you do?",
      choices: [
        { label: "A", text: "Put it on a credit card and pay minimum", isCorrect: false, points: -40, feedback: "Minimum payments mean paying 2-3x the repair cost in interest." },
        { label: "B", text: "Get a 0% APR balance transfer card for the repair", isCorrect: true, points: 90, feedback: "Smart! 0% APR gives you time to pay it off without interest piling up." },
        { label: "C", text: "Ask family for a short-term loan", isCorrect: true, points: 100, feedback: "If available, family loans typically have no interest. Just pay them back quickly." },
        { label: "D", text: "Take out a payday loan - you need the car now", isCorrect: false, points: -100, feedback: "Payday loans can have 400%+ APR. This turns a $1,200 problem into a $3,000+ nightmare." }
      ],
      deepDive: {
        teaching: "Emergency funds exist to prevent debt spirals. Without one, you're one car repair away from financial crisis.",
        alternative: "After this crisis, start building even a $1,000 mini emergency fund to avoid future stress.",
        ruleOfThumb: "Aim for 3-6 months of expenses in an emergency fund before aggressive investing.",
        realWorldExample: "40% of Americans can't cover a $400 emergency without borrowing. Building a buffer changes everything."
      }
    },
    {
      id: "day3-subscription",
      category: "lifestyle",
      context: "Cash $2,800 | Debt $500 | Credit 700 | Stress 40 | Monthly subscriptions: $280",
      question: "You're auditing your subscriptions: Gym ($50 - go 2x/month), Streaming ($65 - 4 services), Meal kit ($120), Apps ($45).",
      choices: [
        { label: "A", text: "Cancel all subscriptions and start fresh", isCorrect: false, points: 30, feedback: "Too extreme! Some subscriptions provide real value. Be selective." },
        { label: "B", text: "Keep gym, cancel 2 streaming services, cancel meal kit", isCorrect: true, points: 100, feedback: "Great analysis! Gym encourages health, 2 streaming services is plenty, meal kits are expensive convenience." },
        { label: "C", text: "Keep everything - it's only $280/month", isCorrect: false, points: -50, feedback: "$280/month is $3,360/year. That's a vacation or significant investment contribution." },
        { label: "D", text: "Cancel gym (barely go) and one streaming service", isCorrect: true, points: 70, feedback: "Honest about gym usage! But the meal kit is your biggest savings opportunity." }
      ],
      deepDive: {
        teaching: "Subscription creep is the modern version of lifestyle creep. Small monthly charges add up fast.",
        alternative: "Do a subscription audit every 6 months. Calculate annual cost, not monthly.",
        ruleOfThumb: "If you haven't used a subscription in 30 days, cancel it. You can always resubscribe.",
        realWorldExample: "The average American spends $273/month on subscriptions but thinks they spend $86."
      }
    },
    {
      id: "day3-housing",
      category: "housing",
      context: "Cash $15,000 | Debt $0 | Credit 750 | Monthly Income $6,000 | Rent $1,800/month",
      question: "Rent is 30% of your income. A friend says you should buy a condo with 3% down. Condos in your area start at $350k.",
      choices: [
        { label: "A", text: "Buy now before prices go up more", isCorrect: false, points: -40, feedback: "FOMO buying is dangerous. With only $15k saved, you'd be house-poor with PMI and HOA fees." },
        { label: "B", text: "Keep renting and save for a 20% down payment", isCorrect: true, points: 100, feedback: "Smart! 20% down avoids PMI and gives you a cushion for closing costs and repairs." },
        { label: "C", text: "Buy with 3% down - building equity beats renting", isCorrect: false, points: -20, feedback: "3% down means huge PMI payments and being underwater if prices dip even slightly." },
        { label: "D", text: "Move somewhere cheaper to save faster", isCorrect: true, points: 80, feedback: "If feasible, this accelerates your timeline. Just factor in commute and quality of life." }
      ],
      deepDive: {
        teaching: "The true cost of homeownership includes PMI, HOA, maintenance, taxes, and insurance - not just the mortgage.",
        alternative: "Save until you have 20% down + 6 months expenses + closing costs (usually 2-5% of home price).",
        ruleOfThumb: "Don't buy unless you plan to stay 5+ years. Transaction costs eat short-term gains.",
        realWorldExample: "A $350k condo with 3% down means $350/month PMI alone. That's $4,200/year in extra costs."
      }
    },
    {
      id: "day3-scam",
      category: "scam",
      context: "Cash $3,000 | Debt $0 | Credit 720 | Just started new job",
      question: "Your 'new boss' emails asking you to buy $500 in gift cards for a client meeting. They'll reimburse you. Email looks legit.",
      choices: [
        { label: "A", text: "Buy the gift cards - don't want to upset the new boss", isCorrect: false, points: -100, feedback: "Classic CEO fraud scam! Real bosses never ask for gift cards via email." },
        { label: "B", text: "Reply asking for more details first", isCorrect: false, points: -20, feedback: "Still risky - the scammer will provide convincing fake details. Verify differently." },
        { label: "C", text: "Call or walk to your boss's desk to verify in person", isCorrect: true, points: 100, feedback: "Perfect! Always verify unusual requests through a different communication channel." },
        { label: "D", text: "Check the email address carefully for typos", isCorrect: true, points: 70, feedback: "Good instinct! Scam emails often use slight misspellings. But still verify in person." }
      ],
      deepDive: {
        teaching: "Business Email Compromise (BEC) scams cost businesses $2.7 billion annually. Gift card requests are a huge red flag.",
        alternative: "Establish verification procedures with your team for any unusual financial requests.",
        ruleOfThumb: "Any request for gift cards, wire transfers, or crypto from 'authority figures' is a scam until proven otherwise.",
        realWorldExample: "A new employee at a tech company lost $25,000 in a 'boss' gift card scam in their first week."
      }
    },
    {
      id: "day3-investing",
      category: "investing",
      context: "Cash $5,000 | 401k: $20k | Roth IRA: $0 | Tax bracket: 22% | Age 27",
      question: "You have $500/month to invest. Your employer matches 401k up to 6%. What's your priority order?",
      choices: [
        { label: "A", text: "Max out 401k first, then Roth IRA", isCorrect: false, points: 60, feedback: "Close, but you're missing the power of Roth tax-free growth while in a lower bracket." },
        { label: "B", text: "401k to match, then max Roth IRA, then more 401k", isCorrect: true, points: 100, feedback: "Perfect! Free match money first, then tax-free Roth growth, then tax-deferred 401k." },
        { label: "C", text: "All in Roth IRA for tax-free growth", isCorrect: false, points: 20, feedback: "You're leaving free money on the table by skipping the 401k match!" },
        { label: "D", text: "Taxable brokerage for flexibility", isCorrect: false, points: -20, feedback: "Tax-advantaged accounts should be maxed before taxable investing in most cases." }
      ],
      deepDive: {
        teaching: "The optimal order is: 401k match (free money) → Roth IRA (tax-free growth) → max 401k → taxable.",
        alternative: "At higher tax brackets, the order might favor more 401k for the tax deduction.",
        ruleOfThumb: "Never leave employer match on the table. It's an instant 50-100% return.",
        realWorldExample: "Skipping a 6% match on $75k salary for 30 years costs you $350k+ in retirement savings."
      }
    }
  ],

  // Day 4
  [
    {
      id: "day4-food",
      category: "lifestyle",
      context: "Cash $2,500 | Debt $1,000 | Credit 680 | Food spending: $800/month (includes $350 dining out)",
      question: "You want to cut food costs but your social life revolves around restaurants. What's your move?",
      choices: [
        { label: "A", text: "Cut dining completely and become a hermit", isCorrect: false, points: 20, feedback: "Extreme restriction usually fails. Social connection has value too." },
        { label: "B", text: "Suggest cheaper restaurants or happy hours", isCorrect: true, points: 90, feedback: "Smart compromise! You can be social without ordering $25 entrees." },
        { label: "C", text: "Host potlucks instead of going out", isCorrect: true, points: 100, feedback: "Best of both worlds! Social time at 10% of restaurant costs." },
        { label: "D", text: "Keep dining out - you deserve nice things", isCorrect: false, points: -40, feedback: "$350/month is $4,200/year. That 'deserve' mentality leads to lifestyle creep." }
      ],
      deepDive: {
        teaching: "Sustainable budgets include social spending. The goal is optimization, not deprivation.",
        alternative: "Try the 'one in, one out' rule: for every restaurant meal, host one at home.",
        ruleOfThumb: "Food costs should be under 10-15% of take-home pay including dining out.",
        realWorldExample: "Cutting $200/month from dining out and investing it yields $180k+ over 25 years."
      }
    },
    {
      id: "day4-credit",
      category: "credit",
      context: "Cash $3,000 | Credit Card Debt $0 | Credit Score 650 | Only 1 credit card, 8 years old",
      question: "You want to improve your credit score. A store offers you a card with 25% APR but 10% off today's purchase.",
      choices: [
        { label: "A", text: "Open it for the discount and the credit mix", isCorrect: false, points: -30, feedback: "Store cards have terrible terms. The short-term discount isn't worth it." },
        { label: "B", text: "Apply for a regular rewards card with better terms", isCorrect: true, points: 100, feedback: "Great choice! Better rewards, lower rates, and still adds to your credit mix." },
        { label: "C", text: "Don't open any new cards - keep what you have", isCorrect: false, points: 40, feedback: "Another card could help utilization and credit mix, but choose wisely." },
        { label: "D", text: "Open multiple cards to boost available credit fast", isCorrect: false, points: -50, feedback: "Too many inquiries hurt your score. Space applications 6+ months apart." }
      ],
      deepDive: {
        teaching: "Credit score factors: payment history (35%), utilization (30%), length (15%), mix (10%), new credit (10%).",
        alternative: "Request a credit limit increase on existing cards - same utilization benefit, no hard inquiry.",
        ruleOfThumb: "Keep utilization under 30%, ideally under 10%. Pay before statement closes.",
        realWorldExample: "Someone with a 650 score pays $40k+ more interest on a mortgage than someone with 750."
      }
    },
    {
      id: "day4-career",
      category: "career",
      context: "Cash $4,000 | Debt $0 | Credit 720 | Salary $65k | Job is boring but stable",
      question: "You're offered a role at a startup: $55k salary but significant equity. Your current job is stable but has no growth.",
      choices: [
        { label: "A", text: "Take it - startups are the path to wealth", isCorrect: false, points: -20, feedback: "Most startups fail. Taking a $10k pay cut for lottery tickets is risky." },
        { label: "B", text: "Negotiate for $60k+ and better equity terms", isCorrect: true, points: 100, feedback: "Smart! If they want you, they can meet you closer to market rate." },
        { label: "C", text: "Stay at current job - stability beats potential", isCorrect: false, points: 40, feedback: "Stability has value, but stagnation has costs too. At least explore options." },
        { label: "D", text: "Ask for a raise at current job using the offer as leverage", isCorrect: true, points: 80, feedback: "Good tactic, but be prepared to actually leave if they say no." }
      ],
      deepDive: {
        teaching: "Startup equity is worth $0 until an exit event. Discount it heavily when comparing offers.",
        alternative: "Ask about the equity: vesting schedule, strike price, total shares outstanding, and recent valuation.",
        ruleOfThumb: "Don't take more than a 10-15% pay cut for equity unless you can afford the risk.",
        realWorldExample: "90% of startups fail. Of the 10% that succeed, most employees get modest payouts."
      }
    },
    {
      id: "day4-insurance",
      category: "insurance",
      context: "Cash $6,000 | Debt $0 | Credit 750 | Healthy 32-year-old | No dependents",
      question: "Open enrollment is here. You can choose: High deductible ($3,000) with HSA vs. Low deductible ($500) at $200/month more.",
      choices: [
        { label: "A", text: "Low deductible - I don't want surprise medical bills", isCorrect: false, points: 20, feedback: "Understandable fear, but you're paying $2,400/year extra in premiums for that comfort." },
        { label: "B", text: "High deductible with HSA, max out contributions", isCorrect: true, points: 100, feedback: "Triple tax advantage! HSA is the best retirement account available." },
        { label: "C", text: "High deductible but skip the HSA", isCorrect: false, points: 40, feedback: "You're missing the biggest benefit! HSA grows tax-free for life." },
        { label: "D", text: "Cheapest plan available, skip insurance", isCorrect: false, points: -80, feedback: "One accident can mean $100k+ in bills. Never skip health insurance." }
      ],
      deepDive: {
        teaching: "HSAs have triple tax benefits: tax-deductible contributions, tax-free growth, tax-free withdrawals for medical expenses.",
        alternative: "Pay current medical expenses out of pocket, let HSA grow, use it tax-free in retirement.",
        ruleOfThumb: "If you're healthy and can cover the deductible, HDHPs with HSAs usually win mathematically.",
        realWorldExample: "Maxing HSA from age 30-65 at 7% returns yields $500k+ for tax-free medical expenses in retirement."
      }
    },
    {
      id: "day4-scam",
      category: "scam",
      context: "Cash $2,000 | Debt $500 | Credit 690 | Looking for side income",
      question: "LinkedIn message: 'Hi! I work with entrepreneurs. We help people earn $5-10k/month in passive income. Interested in learning more?'",
      choices: [
        { label: "A", text: "Reply to learn more - what's the harm?", isCorrect: false, points: -30, feedback: "Opening the door invites high-pressure tactics. These are usually MLMs or scams." },
        { label: "B", text: "Ask what company and research them first", isCorrect: true, points: 70, feedback: "Good instinct to verify, but these messages are almost always pyramid schemes." },
        { label: "C", text: "Ignore and block - this is definitely a scam", isCorrect: true, points: 100, feedback: "Correct! Legitimate opportunities don't cold message with vague income promises." },
        { label: "D", text: "Join the opportunity - passive income sounds great", isCorrect: false, points: -100, feedback: "This is an MLM or scam. 99% of participants lose money." }
      ],
      deepDive: {
        teaching: "Legitimate businesses don't recruit via cold messages promising passive income. This is textbook MLM language.",
        alternative: "Real side income: freelancing, tutoring, consulting in your expertise. Skills pay, not 'opportunities.'",
        ruleOfThumb: "If you have to pay to join or buy inventory, it's not a job - it's you being the customer.",
        realWorldExample: "99% of MLM participants lose money. The FTC considers most MLMs to be pyramid schemes in disguise."
      }
    }
  ],

  // Day 5
  [
    {
      id: "day5-wedding",
      category: "relationships",
      context: "Cash $8,000 | Debt $3,000 | Credit 700 | Best friend's destination wedding costs $2,500 to attend",
      question: "Your best friend's destination wedding is in 4 months. Attending would cost $2,500 (flights, hotel, gift). You have $3k in debt.",
      choices: [
        { label: "A", text: "Go into more debt - you can't miss this", isCorrect: false, points: -50, feedback: "Adding debt for a wedding you can't afford isn't friendship - it's financial harm." },
        { label: "B", text: "Be honest: attend just the ceremony, skip the resort week", isCorrect: true, points: 100, feedback: "True friends understand. You can celebrate without the full destination experience." },
        { label: "C", text: "Skip entirely and send a nice gift", isCorrect: true, points: 70, feedback: "Valid choice if the relationship allows. A heartfelt explanation and gift can work." },
        { label: "D", text: "Ask if they can help cover your costs", isCorrect: false, points: -20, feedback: "Destination weddings acknowledge not everyone can attend. Don't guilt them into paying." }
      ],
      deepDive: {
        teaching: "Destination weddings come with an implicit understanding that not everyone can make it work financially.",
        alternative: "Offer to throw them a local celebration when they return - personal and affordable.",
        ruleOfThumb: "Never go into debt for someone else's celebration. Real friends won't expect you to.",
        realWorldExample: "The average wedding guest spends $700+. Destination weddings average $1,500-3,000 per guest."
      }
    },
    {
      id: "day5-tax",
      category: "tax",
      context: "Cash $4,000 | Refund coming: $3,200 | Debt $2,000 | No emergency fund",
      question: "Tax refund of $3,200 is coming! You have $2k debt at 18% APR and no emergency fund. What's the play?",
      choices: [
        { label: "A", text: "Pay off all debt, put rest in emergency fund", isCorrect: true, points: 100, feedback: "Perfect order! Eliminate high-interest debt first, then build your safety net." },
        { label: "B", text: "Put it all in emergency fund first", isCorrect: false, points: 40, feedback: "Emergency funds are important, but 18% APR debt is an emergency itself." },
        { label: "C", text: "Treat yourself - you worked hard for this", isCorrect: false, points: -60, feedback: "A refund isn't a bonus - it's your own money you overpaid. Don't blow it." },
        { label: "D", text: "Invest it all for long-term growth", isCorrect: false, points: -20, feedback: "Can't out-invest 18% APR debt risk-free. Pay debt first." }
      ],
      deepDive: {
        teaching: "A tax refund means you gave the government an interest-free loan. Adjust withholdings to get more per paycheck.",
        alternative: "Use a windfall strategy: 50% debt, 30% savings, 20% wants. But high-interest debt takes priority.",
        ruleOfThumb: "Any debt over 7% APR should be paid before investing beyond employer match.",
        realWorldExample: "The average tax refund is $3,000. Invested at 7% for 30 years, that's $22,000 per annual refund."
      }
    },
    {
      id: "day5-peer",
      category: "lifestyle",
      context: "Cash $5,000 | Debt $0 | Credit 740 | Friend group is wealthy",
      question: "Your friend group loves expensive dinners ($150/person), boutique fitness ($300/month), and designer clothes. You earn half what they do.",
      choices: [
        { label: "A", text: "Keep up to avoid being left out", isCorrect: false, points: -70, feedback: "Spending to match wealthier friends is a fast track to debt and resentment." },
        { label: "B", text: "Suggest cheaper alternatives sometimes", isCorrect: true, points: 80, feedback: "Good friends will meet you halfway. If they don't, question the friendship." },
        { label: "C", text: "Be honest about your budget and opt out sometimes", isCorrect: true, points: 100, feedback: "Vulnerability builds deeper friendships. Real friends won't judge your budget." },
        { label: "D", text: "Find new friends in your income bracket", isCorrect: false, points: 30, feedback: "Extreme, but mixed-income friendships do require effort from both sides." }
      ],
      deepDive: {
        teaching: "Lifestyle inflation driven by peer pressure is one of the biggest wealth destroyers for young professionals.",
        alternative: "Suggest activities you can afford: hikes, potlucks, free events. Quality time doesn't require spending.",
        ruleOfThumb: "Your lifestyle should match your income, not your friends' incomes.",
        realWorldExample: "Studies show people with 'rich' friends spend 10-20% more than those with income-matched peers."
      }
    },
    {
      id: "day5-tech",
      category: "tech",
      context: "Cash $3,500 | Debt $0 | Credit 710 | Phone is 3 years old, works fine",
      question: "New iPhone is $1,200. Your current phone works fine but the battery lasts only half the day. Trade-in value: $200.",
      choices: [
        { label: "A", text: "Buy new phone - battery life is crucial", isCorrect: false, points: -30, feedback: "$1,000 for better battery? There are much cheaper solutions." },
        { label: "B", text: "Replace battery for $80, keep current phone", isCorrect: true, points: 100, feedback: "Genius! Battery replacement extends phone life 2+ years for under $100." },
        { label: "C", text: "Buy refurbished previous-gen model", isCorrect: true, points: 80, feedback: "Smart if you want an upgrade! Last year's model at 40% off is great value." },
        { label: "D", text: "Finance the new phone at 0% for 24 months", isCorrect: false, points: 20, feedback: "0% financing isn't 'free.' You're still spending $1,000 on a minor upgrade." }
      ],
      deepDive: {
        teaching: "Phones are built to last 4-5 years. Battery replacement at year 2-3 is the smartest upgrade.",
        alternative: "If you must upgrade, buy previous-gen refurbished. 80% of the features at 50% of the price.",
        ruleOfThumb: "Tech upgrades should solve real problems, not just satisfy 'new shiny' urges.",
        realWorldExample: "Upgrading phones every 2 years costs $6,000 more over 10 years than keeping phones 4 years."
      }
    },
    {
      id: "day5-investing",
      category: "investing",
      context: "Cash $10,000 | 401k: $50k | Debt $0 | Credit 760 | Age 35 | Market just dropped 20%",
      question: "The market just crashed 20%. Your 401k is down $10k. Your friends are panic selling. What do you do?",
      choices: [
        { label: "A", text: "Sell everything before it gets worse", isCorrect: false, points: -80, feedback: "Selling low locks in losses. Crashes are when you should be buying, not selling." },
        { label: "B", text: "Stay the course - keep contributing normally", isCorrect: true, points: 90, feedback: "Time in market beats timing the market. Corrections are temporary, growth is permanent." },
        { label: "C", text: "Invest extra cash now - stocks are on sale", isCorrect: true, points: 100, feedback: "Buying the dip is smart if you have cash. Others' panic is your opportunity." },
        { label: "D", text: "Stop contributing until things stabilize", isCorrect: false, points: -40, feedback: "You're missing discounted shares. This is the worst time to stop investing." }
      ],
      deepDive: {
        teaching: "Since 1950, the market has recovered from every crash within 2-5 years. Panic selling is always wrong.",
        alternative: "If you're stressed, stop checking your accounts. Set it and forget it.",
        ruleOfThumb: "You're buying shares, not prices. More shares at lower prices = more wealth later.",
        realWorldExample: "Investors who sold in March 2020 missed a 100%+ recovery by end of 2021."
      }
    }
  ],

  // Day 6
  [
    {
      id: "day6-side",
      category: "career",
      context: "Cash $4,000 | Debt $1,500 | Credit 695 | Full-time job $60k | 10 free hours/week",
      question: "You want to start a side hustle. You have 10 hours/week available. Options: Uber ($15/hr after costs), freelance in your field ($50/hr), or start a dropshipping store.",
      choices: [
        { label: "A", text: "Uber - guaranteed income, no skills needed", isCorrect: false, points: 20, feedback: "$150/week is fine but low. Your time is worth more than $15/hour." },
        { label: "B", text: "Freelance in your expertise", isCorrect: true, points: 100, feedback: "Highest hourly rate and builds your professional brand. Win-win." },
        { label: "C", text: "Dropshipping - passive income potential", isCorrect: false, points: -30, feedback: "Dropshipping is rarely passive and requires significant upfront learning and capital." },
        { label: "D", text: "Work overtime at current job instead", isCorrect: true, points: 70, feedback: "Simple and effective if available. No extra complexity." }
      ],
      deepDive: {
        teaching: "The best side hustles leverage skills you already have. Trading time for minimum wage isn't scalable.",
        alternative: "Start with 1-2 freelance clients. Use platforms like Upwork or your network.",
        ruleOfThumb: "Side hustle hourly rate should be at least equal to your main job rate.",
        realWorldExample: "A software developer doing $50/hr freelance for 10 hrs/week earns $26k extra annually."
      }
    },
    {
      id: "day6-family",
      category: "relationships",
      context: "Cash $6,000 | Debt $0 | Credit 720 | Parents asking for $5,000 loan",
      question: "Your parents need $5,000 for an unexpected expense. They've helped you before. They promise to pay back in 6 months.",
      choices: [
        { label: "A", text: "Give them $5,000 - family comes first", isCorrect: false, points: 30, feedback: "Generous, but giving money you can't lose is risky. Set boundaries with love." },
        { label: "B", text: "Give what you can afford to lose as a gift, not a loan", isCorrect: true, points: 100, feedback: "Smart! Treat family 'loans' as gifts. If repaid, it's a bonus." },
        { label: "C", text: "Say no - you need to protect yourself", isCorrect: false, points: 40, feedback: "Valid boundary, but consider a smaller amount if they genuinely helped you before." },
        { label: "D", text: "Loan the full amount with a written agreement", isCorrect: true, points: 70, feedback: "Formal agreements help, but be prepared if they can't repay." }
      ],
      deepDive: {
        teaching: "Family loans destroy relationships when repayment fails. Give what you can afford to lose.",
        alternative: "Offer to help in non-monetary ways: co-signing (carefully), connecting to resources, budgeting help.",
        ruleOfThumb: "Never lend money to family that you can't afford to give as a gift.",
        realWorldExample: "37% of people who've lent money to family say it damaged the relationship."
      }
    },
    {
      id: "day6-scam",
      category: "scam",
      context: "Cash $2,500 | Debt $800 | Credit 680 | Selling furniture online",
      question: "Selling a $400 couch on Facebook Marketplace. Buyer offers $500 and says they'll send a check - you keep extra for 'shipping hassle.'",
      choices: [
        { label: "A", text: "Accept - free $100", isCorrect: false, points: -100, feedback: "Classic overpayment scam! The check will bounce after you've sent the 'extra' back." },
        { label: "B", text: "Accept but wait for check to clear first", isCorrect: false, points: -40, feedback: "Fake checks can take weeks to bounce. The bank reverses it and you're out the money." },
        { label: "C", text: "Decline and only accept cash or verified digital payment", isCorrect: true, points: 100, feedback: "Perfect! Cash, Venmo, or PayPal only. Checks from strangers are always suspicious." },
        { label: "D", text: "Ask them to send exactly $400", isCorrect: false, points: -20, feedback: "A scammer sending any check is a red flag. Don't accept checks from strangers." }
      ],
      deepDive: {
        teaching: "Overpayment scams rely on fake checks that take days/weeks to bounce. Banks will reverse the deposit.",
        alternative: "Use secure payment: cash in person, PayPal Goods & Services, or Venmo with identity verified.",
        ruleOfThumb: "If a buyer offers MORE than asking price, it's a scam. No exceptions.",
        realWorldExample: "Americans lost $114 million to fake check scams in 2022. Average loss: $1,200."
      }
    },
    {
      id: "day6-rent",
      category: "housing",
      context: "Cash $3,000 | Debt $0 | Credit 710 | Rent $1,400/month | Income $4,500/month | Lease ending",
      question: "Landlord raising rent 10% to $1,540. That's 34% of your income. You could move but costs $2,500 in deposits/moving.",
      choices: [
        { label: "A", text: "Accept the increase - moving is expensive", isCorrect: false, points: 30, feedback: "34% rent-to-income is high but moving costs are real. Could you negotiate?" },
        { label: "B", text: "Negotiate - offer a 2-year lease for smaller increase", isCorrect: true, points: 100, feedback: "Landlords value stability. A longer lease can be worth a smaller increase to them." },
        { label: "C", text: "Move to save money long-term", isCorrect: true, points: 70, feedback: "If you find rent $200+ cheaper, the move pays for itself in a year." },
        { label: "D", text: "Get a roommate to split the increased cost", isCorrect: true, points: 80, feedback: "Great option if your lease and lifestyle allow it. Dramatically reduces housing burden." }
      ],
      deepDive: {
        teaching: "Rent-to-income should ideally be 25-30%. Above 30% squeezes other financial goals.",
        alternative: "Calculate total cost of moving vs. staying over 2 years to see which is cheaper.",
        ruleOfThumb: "If a move saves you $200+/month, the moving costs pay off in 12-15 months.",
        realWorldExample: "The average cost of moving is $1,400 locally. Factor this into any rent comparison."
      }
    },
    {
      id: "day6-investing",
      category: "investing",
      context: "Cash $15,000 | 401k: $30k | No debt | Credit 750 | Age 30",
      question: "You have $15k cash. Your 401k is in target-date funds. Should you open a taxable brokerage account?",
      choices: [
        { label: "A", text: "Yes - invest it all in index funds", isCorrect: false, points: 60, feedback: "Have you maxed tax-advantaged accounts first? Check Roth IRA limits." },
        { label: "B", text: "First max out Roth IRA, then taxable brokerage", isCorrect: true, points: 100, feedback: "Perfect order! Roth IRA's tax-free growth should come before taxable accounts." },
        { label: "C", text: "Keep it all in high-yield savings", isCorrect: false, points: 30, feedback: "Good for emergency fund but excess cash should be invested at age 30." },
        { label: "D", text: "Put more in 401k instead via payroll", isCorrect: true, points: 80, feedback: "Also good! Increase 401k contributions and use cash for living expenses." }
      ],
      deepDive: {
        teaching: "Tax-advantaged accounts (401k, IRA, HSA) should generally be maxed before taxable investing.",
        alternative: "2024 limits: $23,000 for 401k, $7,000 for IRA, $4,150 for HSA (individual).",
        ruleOfThumb: "Keep 3-6 months expenses in savings, invest the rest for long-term goals.",
        realWorldExample: "Roth IRA invested from age 30-65 at $7k/year and 7% returns = $700k tax-free."
      }
    }
  ],

  // Day 7
  [
    {
      id: "day7-impulse",
      category: "lifestyle",
      context: "Cash $2,800 | Debt $1,200 | Credit 680 | Just got $800 bonus",
      question: "You just got an $800 work bonus. You've been eyeing a $750 designer bag. You also have $1,200 in credit card debt at 20% APR.",
      choices: [
        { label: "A", text: "Buy the bag - you earned it!", isCorrect: false, points: -60, feedback: "Rewarding yourself with debt still unpaid is how lifestyle creep starts." },
        { label: "B", text: "Pay off $800 of debt, reward yourself later", isCorrect: true, points: 100, feedback: "Delayed gratification wins! Pay debt first, then save for wants guilt-free." },
        { label: "C", text: "Split: $400 debt, $400 toward bag", isCorrect: false, points: 20, feedback: "Compromise sounds nice but 20% APR debt should be attacked aggressively." },
        { label: "D", text: "Save the bonus for emergencies", isCorrect: true, points: 70, feedback: "Good instinct, but high-interest debt is your current emergency." }
      ],
      deepDive: {
        teaching: "Windfalls feel like 'extra' money but they're the fastest path to financial goals when used wisely.",
        alternative: "Use the 50/30/20 rule for windfalls: 50% goals, 30% savings, 20% wants.",
        ruleOfThumb: "Pay off all high-interest debt before spending on wants. Then reward yourself.",
        realWorldExample: "Paying $800 toward 20% APR debt saves $160+/year in interest. The bag costs $160/year to delay."
      }
    },
    {
      id: "day7-health",
      category: "health",
      context: "Cash $3,500 | Debt $0 | Credit 720 | No health issues | Age 28",
      question: "Dentist recommends $2,000 in preventive work. Insurance covers 50%. You've been putting off dental care.",
      choices: [
        { label: "A", text: "Skip it - teeth feel fine", isCorrect: false, points: -50, feedback: "Dental problems compound. A $1,000 filling now prevents a $5,000 root canal later." },
        { label: "B", text: "Get the work done, pay $1,000 out of pocket", isCorrect: true, points: 100, feedback: "Preventive healthcare is an investment. Cheaper now than emergency later." },
        { label: "C", text: "Get a second opinion first", isCorrect: true, points: 80, feedback: "Smart! Second opinions are reasonable for major dental work." },
        { label: "D", text: "Put it on a payment plan even if it has interest", isCorrect: false, points: 40, feedback: "If you have $3,500 cash, don't pay interest. Pay cash if affordable." }
      ],
      deepDive: {
        teaching: "Preventive healthcare is always cheaper than emergency care. Don't skip recommended maintenance.",
        alternative: "Dental schools offer discounted work. Also check if your area has dental discount plans.",
        ruleOfThumb: "Budget 1-2% of income annually for health expenses not covered by insurance.",
        realWorldExample: "Average root canal + crown costs $2,500-4,500 vs. $200-300 for filling."
      }
    },
    {
      id: "day7-scam",
      category: "scam",
      context: "Cash $4,000 | Debt $0 | Credit 730 | Dating for 3 months",
      question: "You've been dating someone online for 3 months but never met. They're overseas and need $2,000 for emergency flight home to finally meet you.",
      choices: [
        { label: "A", text: "Send the money - love requires trust", isCorrect: false, points: -100, feedback: "This is a textbook romance scam. Someone you've never met asking for money is always a scam." },
        { label: "B", text: "Offer to book the flight directly yourself", isCorrect: true, points: 70, feedback: "Good test! Scammers will refuse or make excuses. A real person would accept." },
        { label: "C", text: "Video call first to verify they're real", isCorrect: true, points: 80, feedback: "Essential step! If they refuse video calls, it's definitely a scam." },
        { label: "D", text: "End the relationship - this is a red flag", isCorrect: true, points: 100, feedback: "Harsh but smart. Money requests from never-met online relationships are always scams." }
      ],
      deepDive: {
        teaching: "Romance scams cost Americans $1.3 billion in 2022. Scammers build emotional connection before asking for money.",
        alternative: "Never send money to someone you haven't met in person. No exceptions.",
        ruleOfThumb: "If an online relationship involves money requests before meeting, it's 100% a scam.",
        realWorldExample: "The average romance scam victim loses $10,000-50,000 before realizing."
      }
    },
    {
      id: "day7-student",
      category: "debt",
      context: "Cash $2,000 | Student Loans $35k at 6.5% | Salary $55k | Age 26",
      question: "Your student loans are $35k at 6.5%. You can afford $500/month. Standard payment is $400. What's your strategy?",
      choices: [
        { label: "A", text: "Pay minimum, invest the extra $100", isCorrect: false, points: 40, feedback: "Reasonable if investing in 401k match, but 6.5% is borderline for this strategy." },
        { label: "B", text: "Pay $500 to reduce interest paid over time", isCorrect: true, points: 90, feedback: "At 6.5%, paying extra makes sense. You'll save thousands in interest." },
        { label: "C", text: "Refinance to lower rate, then pay extra", isCorrect: true, points: 100, feedback: "Best of both worlds! Lower rate + extra payments maximizes savings." },
        { label: "D", text: "Apply for income-driven repayment instead", isCorrect: false, points: 20, feedback: "IDR lowers payments but extends timeline. Only use if you can't afford standard." }
      ],
      deepDive: {
        teaching: "At 6.5%+, paying extra beats most investing returns after tax. Below 5%, investing might win.",
        alternative: "Look into refinancing with SoFi, Earnest, or similar. Even 1% lower saves thousands.",
        ruleOfThumb: "If loan interest > 6%, prioritize payoff. If < 4%, consider minimum and investing the difference.",
        realWorldExample: "$35k at 6.5% over 10 years costs $12k in interest. Paying $100 extra/month saves $3,500."
      }
    },
    {
      id: "day7-investing",
      category: "investing",
      context: "Cash $20,000 | 401k: $100k | No debt | Credit 780 | Age 40",
      question: "Financial advisor offers to manage your portfolio for 1% annual fee. Your 401k is in target-date funds (0.1% fee).",
      choices: [
        { label: "A", text: "Hire them - professional management is worth it", isCorrect: false, points: -30, feedback: "1% fee on $100k is $1,000/year that compounds away. Target-date funds do the same job." },
        { label: "B", text: "Keep target-date funds, skip the advisor", isCorrect: true, points: 100, feedback: "Smart! Target-date funds auto-rebalance. You're paying 10x less for similar results." },
        { label: "C", text: "Use a robo-advisor at 0.25% instead", isCorrect: true, points: 80, feedback: "Good middle ground if you want some guidance. Much cheaper than human advisors." },
        { label: "D", text: "Manage it yourself with individual stocks", isCorrect: false, points: 20, feedback: "Most individual investors underperform index funds. Stay diversified." }
      ],
      deepDive: {
        teaching: "A 1% fee seems small but costs hundreds of thousands over a career. Low-cost index funds win.",
        alternative: "Use fee-only advisors for one-time planning ($200-500) instead of ongoing AUM fees.",
        ruleOfThumb: "Never pay more than 0.25% in investment fees. Index funds charge 0.03-0.15%.",
        realWorldExample: "1% fee on $500k portfolio over 25 years costs $200k+ in lost growth."
      }
    }
  ],

  // Day 8-30: Continue with similar variety...
  // Day 8
  [
    {
      id: "day8-car",
      category: "lifestyle",
      context: "Cash $7,000 | Debt $0 | Credit 730 | Car is 8 years old with 120k miles",
      question: "Your reliable car needs $2,500 in maintenance. A dealer offers $3,000 trade-in toward a $28k new car. Mechanic says maintenance buys 3-4 more years.",
      choices: [
        { label: "A", text: "Trade in - avoid throwing money at old car", isCorrect: false, points: -40, feedback: "$2,500 for 3-4 years beats $25k+ for new car depreciation." },
        { label: "B", text: "Do the maintenance, keep driving", isCorrect: true, points: 100, feedback: "Perfect math! $625/year for a working car vs. $400+/month for new." },
        { label: "C", text: "Buy a certified pre-owned for $18k", isCorrect: true, points: 60, feedback: "If car is truly dying, CPO is smarter than new. But $2,500 repair is still cheapest." },
        { label: "D", text: "Get a second opinion on the repair cost", isCorrect: true, points: 80, feedback: "Smart! Get 2-3 quotes. Mechanics vary widely on pricing." }
      ],
      deepDive: {
        teaching: "The cheapest car to own is usually the one you already have, as long as it's safe and reliable.",
        alternative: "Save a 'car replacement fund' of $200/month while driving your current car.",
        ruleOfThumb: "As long as annual repairs < $2,000 and car is safe, keep maintaining it.",
        realWorldExample: "Average new car payment is $726/month. That's $8,712/year vs. occasional repairs."
      }
    },
    {
      id: "day8-raise",
      category: "career",
      context: "Cash $5,000 | Debt $2,000 | Credit 700 | Salary $70k | Same role for 3 years",
      question: "You haven't had a raise in 2 years. Inflation has eaten 15% of your purchasing power. How do you approach your manager?",
      choices: [
        { label: "A", text: "Demand a raise or you'll quit", isCorrect: false, points: -30, feedback: "Ultimatums rarely work. You need to demonstrate value, not threaten." },
        { label: "B", text: "Document achievements and request a meeting", isCorrect: true, points: 100, feedback: "Perfect approach! Come with data: accomplishments, market rates, specific ask." },
        { label: "C", text: "Wait for annual review cycle", isCorrect: false, points: 20, feedback: "Don't wait! Proactive requests are more effective than hoping for recognition." },
        { label: "D", text: "Start job hunting for leverage", isCorrect: true, points: 80, feedback: "Know your market value, but don't bluff. Be prepared to actually leave." }
      ],
      deepDive: {
        teaching: "Most raises go to those who ask. Document your wins and request with confidence.",
        alternative: "Research market rates on Levels.fyi, Glassdoor, or LinkedIn Salary before negotiating.",
        ruleOfThumb: "If you haven't gotten a raise in 2 years, you've taken a pay cut due to inflation.",
        realWorldExample: "Employees who negotiate salary earn $1M+ more over their careers than non-negotiators."
      }
    },
    {
      id: "day8-investment",
      category: "investing",
      context: "Cash $12,000 | Roth IRA: $0 | 401k: $25k | Age 26 | No debt",
      question: "You have $6k to invest. It's January. You can put it in your Roth IRA. When should you invest it?",
      choices: [
        { label: "A", text: "Invest all $6k on January 1", isCorrect: true, points: 100, feedback: "Time in market beats timing the market. Lump sum wins 2/3 of the time." },
        { label: "B", text: "Dollar-cost average over 12 months", isCorrect: true, points: 70, feedback: "Lower risk approach, but statistically lump sum performs better." },
        { label: "C", text: "Wait for a market dip to buy low", isCorrect: false, points: -20, feedback: "You can't time the market consistently. Cash sitting earns nothing." },
        { label: "D", text: "Wait until April in case you need the cash", isCorrect: false, points: 30, feedback: "If you might need it, it shouldn't be in retirement accounts anyway." }
      ],
      deepDive: {
        teaching: "Studies show lump-sum investing beats dollar-cost averaging about 66% of the time.",
        alternative: "If lump sum feels scary, invest 50% now and rest over 3-6 months.",
        ruleOfThumb: "Front-load retirement contributions when possible. Time in market matters most.",
        realWorldExample: "$6k invested at 26 grows to $90k+ by 65 at 7% returns."
      }
    },
    {
      id: "day8-scam",
      category: "scam",
      context: "Cash $3,000 | Debt $500 | Credit 690 | Recently moved",
      question: "Email from 'power company': Your account is past due, pay $287 in gift cards within 2 hours or service will be disconnected.",
      choices: [
        { label: "A", text: "Pay immediately - can't risk losing power", isCorrect: false, points: -100, feedback: "Utilities NEVER accept gift cards. This is 100% a scam." },
        { label: "B", text: "Call the number in the email to verify", isCorrect: false, points: -40, feedback: "The number in the email goes to scammers. Call the real company directly." },
        { label: "C", text: "Log into your actual account to check balance", isCorrect: true, points: 100, feedback: "Perfect! Always verify through official channels, never links/numbers in emails." },
        { label: "D", text: "Ignore it - probably spam", isCorrect: true, points: 80, feedback: "Right instinct! But verify just in case there's a real issue with your account." }
      ],
      deepDive: {
        teaching: "Legitimate companies never demand immediate gift card payments. Urgency + gift cards = always scam.",
        alternative: "Bookmark your utility company's real website. Go there directly, never click email links.",
        ruleOfThumb: "No legitimate business accepts gift cards as payment. Ever.",
        realWorldExample: "Utility scams spike during extreme weather. Scammers know you fear losing heat/AC."
      }
    },
    {
      id: "day8-budget",
      category: "budgeting",
      context: "Cash $2,500 | Debt $3,000 | Credit 670 | Spending: No idea where money goes",
      question: "You want to budget but don't know where your money goes. What's your first step?",
      choices: [
        { label: "A", text: "Create a detailed budget spreadsheet immediately", isCorrect: false, points: 30, feedback: "How can you budget if you don't know current spending? Track first." },
        { label: "B", text: "Track every expense for 30 days first", isCorrect: true, points: 100, feedback: "Perfect! You can't manage what you don't measure. Data first, budget second." },
        { label: "C", text: "Use an app like YNAB or Mint to auto-categorize", isCorrect: true, points: 90, feedback: "Great tool! Automation makes tracking painless and reveals patterns." },
        { label: "D", text: "Just start spending less on everything", isCorrect: false, points: 10, feedback: "Vague goals fail. You need to know specifically where money is leaking." }
      ],
      deepDive: {
        teaching: "Most people are shocked by their actual spending on dining, subscriptions, and 'small' purchases.",
        alternative: "Review 3 months of bank/credit card statements. Categorize every transaction.",
        ruleOfThumb: "Track for 30 days before making any budget. The data will reveal priorities.",
        realWorldExample: "People typically underestimate their spending by 30-40% until they track it."
      }
    }
  ],

  // Day 9
  [
    {
      id: "day9-gift",
      category: "relationships",
      context: "Cash $2,000 | Debt $1,500 | Credit 680 | Holiday season approaching",
      question: "Family expects expensive gifts ($100+ each). You have 8 people to buy for. That's $800+ while you have $1,500 in debt.",
      choices: [
        { label: "A", text: "Buy expensive gifts - family is worth it", isCorrect: false, points: -60, feedback: "Going deeper into debt for gifts isn't love - it's financial self-harm." },
        { label: "B", text: "Suggest a Secret Santa with $25 limit", isCorrect: true, points: 100, feedback: "Win-win! Everyone saves money and gifts become more thoughtful." },
        { label: "C", text: "Make homemade gifts instead", isCorrect: true, points: 80, feedback: "Personal gifts show more care than expensive store-bought ones." },
        { label: "D", text: "Skip gifts entirely this year", isCorrect: false, points: 30, feedback: "Might damage relationships. A budget-friendly alternative is better than nothing." }
      ],
      deepDive: {
        teaching: "Gift-giving shouldn't require debt. Set expectations early and suggest alternatives.",
        alternative: "Give experiences: cook dinner for someone, offer to babysit, plan a day together.",
        ruleOfThumb: "If you can't afford a gift without credit cards, you can't afford it.",
        realWorldExample: "Average American spends $1,000+ on holiday gifts. Many carry that debt for months."
      }
    },
    {
      id: "day9-crypto",
      category: "investing",
      context: "Cash $8,000 | 401k: $40k | No debt | Credit 750 | Crypto curious",
      question: "Coworkers made 10x on a memecoin. They're telling you to buy before 'it moons again.' You have $8k in cash.",
      choices: [
        { label: "A", text: "Put all $8k in - don't want to miss out", isCorrect: false, points: -100, feedback: "FOMO investing in memecoins is gambling, not investing. Most lose everything." },
        { label: "B", text: "Skip it - you don't understand it", isCorrect: true, points: 80, feedback: "Warren Buffett rule: Never invest in what you don't understand." },
        { label: "C", text: "Put $500 max - money you can lose", isCorrect: true, points: 100, feedback: "Speculative 'fun money' is fine if truly affordable to lose. Keep it small." },
        { label: "D", text: "Research it heavily first, then decide", isCorrect: true, points: 60, feedback: "Good instinct, but memecoins are pure speculation. No amount of research changes that." }
      ],
      deepDive: {
        teaching: "When everyone's talking about an investment, you're usually late. Early gains go to insiders.",
        alternative: "Use a 90/10 rule: 90% boring index funds, 10% max for speculation.",
        ruleOfThumb: "Never invest more than you can 100% lose in crypto, especially memecoins.",
        realWorldExample: "For every crypto millionaire story, there are thousands who lost everything."
      }
    },
    {
      id: "day9-rent-vs-buy",
      category: "housing",
      context: "Cash $40,000 | Debt $0 | Credit 780 | Rent $1,800/month | Income $90k | City with $600k median home",
      question: "You've saved $40k. Should you buy a condo for $500k (10% down), or keep renting at $1,800/month?",
      choices: [
        { label: "A", text: "Buy now - stop throwing money away on rent", isCorrect: false, points: -20, feedback: "With 10% down, PMI + HOA + taxes might exceed your rent. Run the real numbers." },
        { label: "B", text: "Keep renting and investing the difference", isCorrect: true, points: 90, feedback: "In expensive markets, renting + investing often beats buying long-term." },
        { label: "C", text: "Save until you have 20% down", isCorrect: true, points: 100, feedback: "20% eliminates PMI and gives you a buffer for closing costs and repairs." },
        { label: "D", text: "Buy with roommates to offset costs", isCorrect: true, points: 70, feedback: "House hacking is smart! Roommate income can cover your mortgage." }
      ],
      deepDive: {
        teaching: "Rent isn't 'throwing money away' - it's paying for flexibility, no maintenance, and often lower total cost.",
        alternative: "Use a rent vs. buy calculator with ALL costs: PMI, HOA, taxes, insurance, maintenance.",
        ruleOfThumb: "Buy if you'll stay 5+ years AND total ownership cost is < 1.5x rent.",
        realWorldExample: "In NYC/SF, renters who invest the difference often end up wealthier than buyers."
      }
    },
    {
      id: "day9-charity",
      category: "giving",
      context: "Cash $5,000 | Debt $0 | Credit 720 | Emergency fund complete | Want to give back",
      question: "You want to donate to charity. A friend asks you to give $500 to their GoFundMe for a new business. What do you do?",
      choices: [
        { label: "A", text: "Give $500 - support your friend's dreams", isCorrect: false, points: 20, feedback: "Supporting friends is nice, but business funding isn't charity. It's a gift with expectations." },
        { label: "B", text: "Donate to established charities with track records", isCorrect: true, points: 100, feedback: "Verified charities are tax-deductible and have accountability. Better bang for your buck." },
        { label: "C", text: "Give $100 to friend, rest to other causes", isCorrect: true, points: 70, feedback: "Balanced approach. Small support for friend, larger impact elsewhere." },
        { label: "D", text: "Offer to help friend in non-monetary ways", isCorrect: true, points: 80, feedback: "Skills, time, and connections can be more valuable than cash for startups." }
      ],
      deepDive: {
        teaching: "Charitable giving should be intentional. Research charities on GiveWell or Charity Navigator.",
        alternative: "Consider donating to effective charities. $500 can provide 200 malaria nets.",
        ruleOfThumb: "GoFundMes aren't tax-deductible and have no accountability. Budget them as gifts, not donations.",
        realWorldExample: "Top-rated charities can save a life for $3,000-5,000. Impact varies 100x between charities."
      }
    },
    {
      id: "day9-insurance",
      category: "insurance",
      context: "Cash $3,500 | Debt $0 | Credit 720 | Renter | Has old $500k life insurance policy from parents",
      question: "Your parents set up a $500k whole life insurance policy for you as a kid. You pay $150/month. You're single with no dependents.",
      choices: [
        { label: "A", text: "Keep it - it's building cash value", isCorrect: false, points: -30, feedback: "Cash value grows slowly with high fees. You'd be better investing that $150/month." },
        { label: "B", text: "Cancel it - you have no dependents to protect", isCorrect: true, points: 100, feedback: "Correct! Life insurance protects dependents. Without them, it's just an expensive savings account." },
        { label: "C", text: "Reduce coverage to lower premium", isCorrect: false, points: 30, feedback: "Still paying for something you don't need. Cancel completely for now." },
        { label: "D", text: "Keep it - you might have dependents someday", isCorrect: false, points: 20, feedback: "Buy term life when you have dependents. It's 10x cheaper than whole life." }
      ],
      deepDive: {
        teaching: "Life insurance is for income replacement when dependents rely on you. No dependents = no need.",
        alternative: "When you do need life insurance, term life is 5-10x cheaper than whole life.",
        ruleOfThumb: "Buy term, invest the difference. Whole life is expensive and rarely worth it.",
        realWorldExample: "$150/month invested at 7% for 30 years = $180k. Whole life cash value would be far less."
      }
    }
  ],

  // Day 10
  [
    {
      id: "day10-job-loss",
      category: "emergency",
      context: "Cash $10,000 | Debt $0 | Credit 750 | Just got laid off | Monthly expenses: $3,500",
      question: "You just got laid off. You have $10k saved (about 3 months expenses). What's your first move?",
      choices: [
        { label: "A", text: "File for unemployment immediately", isCorrect: true, points: 100, feedback: "First priority! Unemployment takes weeks to process. File day one." },
        { label: "B", text: "Start job hunting before worrying about benefits", isCorrect: false, points: 50, feedback: "Job hunting is important, but unemployment benefits extend your runway significantly." },
        { label: "C", text: "Take a week to decompress first", isCorrect: false, points: 20, feedback: "Understandable, but every day without unemployment filed is money lost." },
        { label: "D", text: "Immediately cut all discretionary spending", isCorrect: true, points: 80, feedback: "Smart! Extend your runway while searching. Cancel subscriptions and cut extras." }
      ],
      deepDive: {
        teaching: "Job loss protocol: File unemployment day 1, cut expenses, update resume, network aggressively.",
        alternative: "COBRA health insurance is expensive. Look at healthcare.gov marketplace plans instead.",
        ruleOfThumb: "This is why emergency funds exist. 3-6 months expenses buys you time to find the right job.",
        realWorldExample: "Unemployment pays 40-50% of salary. Combined with savings, you can job search strategically."
      }
    },
    {
      id: "day10-split",
      category: "relationships",
      context: "Cash $6,000 | Debt $0 | Credit 730 | Partner earns 2x your salary",
      question: "You and your partner are moving in together. They earn $150k, you earn $75k. How should you split rent on a $3,000/month apartment?",
      choices: [
        { label: "A", text: "50/50 - equal partners, equal split", isCorrect: false, points: 30, feedback: "Sounds fair but leaves you stretched and them comfortable. Equity matters." },
        { label: "B", text: "Proportional to income (you: $1,000, them: $2,000)", isCorrect: true, points: 100, feedback: "Equitable! Both pay the same percentage of income, creating balance." },
        { label: "C", text: "They pay more since they wanted the nicer place", isCorrect: true, points: 80, feedback: "Valid if they're driving lifestyle choices. Communicate openly about this." },
        { label: "D", text: "You cover utilities, they cover rent", isCorrect: false, points: 40, feedback: "Unclear and variable. Percentage-based splits are cleaner and fairer." }
      ],
      deepDive: {
        teaching: "Income proportional splitting prevents resentment and ensures both partners can save.",
        alternative: "Create a joint account for shared expenses, keep separate accounts for personal spending.",
        ruleOfThumb: "If lifestyle choices are driven by the higher earner, they should pay proportionally more.",
        realWorldExample: "Couples who discuss money openly have 30% lower divorce rates."
      }
    },
    {
      id: "day10-inheritance",
      category: "windfall",
      context: "Cash $5,000 | Debt $20,000 | Credit 680 | Just inherited $50,000",
      question: "You just inherited $50,000. You have $20k in debt (mix of 6% and 18% APR). What's your plan?",
      choices: [
        { label: "A", text: "Pay off all debt, invest the rest", isCorrect: true, points: 100, feedback: "Perfect order! Eliminate all debt, then build wealth with clean slate." },
        { label: "B", text: "Invest everything - debt interest is manageable", isCorrect: false, points: -20, feedback: "18% APR debt is an emergency. No investment guarantees 18% returns." },
        { label: "C", text: "Pay high-interest debt, invest rest instead of low-interest", isCorrect: true, points: 80, feedback: "Valid strategy! 18% debt must go. 6% debt is borderline - could invest instead." },
        { label: "D", text: "Spend on a dream vacation - this is rare money", isCorrect: false, points: -50, feedback: "Inheritances are building blocks for generational wealth. Don't squander them." }
      ],
      deepDive: {
        teaching: "Windfalls should accelerate your financial goals, not fund lifestyle inflation.",
        alternative: "Consider the 50/30/20 windfall rule: 50% goals, 30% savings, 20% wants.",
        ruleOfThumb: "Wait 6 months before any major windfall decisions. Avoid emotional spending.",
        realWorldExample: "70% of lottery winners go broke within 5 years. Windfalls require discipline."
      }
    },
    {
      id: "day10-degree",
      category: "career",
      context: "Cash $8,000 | Debt $0 | Credit 720 | Salary $55k | Feeling stuck",
      question: "You're considering a $40k MBA to advance your career. Current salary is $55k. MBA grads at target companies earn $85k+.",
      choices: [
        { label: "A", text: "Go for it - education is always worth it", isCorrect: false, points: -20, feedback: "Not always! ROI matters. A $40k degree for a $30k raise takes 3+ years to break even." },
        { label: "B", text: "Research employer tuition assistance first", isCorrect: true, points: 100, feedback: "Many employers pay for grad school! Check before spending your own money." },
        { label: "C", text: "Get certifications or skills training instead", isCorrect: true, points: 90, feedback: "Often higher ROI than degrees. $5k in certifications might yield the same raise." },
        { label: "D", text: "Skip it - experience matters more than degrees", isCorrect: false, points: 50, feedback: "Depends on industry. Some fields require advanced degrees for advancement." }
      ],
      deepDive: {
        teaching: "Calculate education ROI: (Salary increase - Tuition) / Years to break even.",
        alternative: "Consider part-time programs, online options, or employer-sponsored education.",
        ruleOfThumb: "Grad school debt should not exceed first year's expected salary increase.",
        realWorldExample: "A $40k MBA with $30k raise takes 1.3 years to break even - solid ROI if salary jump is guaranteed."
      }
    },
    {
      id: "day10-late",
      category: "credit",
      context: "Cash $1,500 | Credit Card payment due: $150 | Account: $100 | Payday: 3 days away",
      question: "Your credit card minimum payment of $150 is due tomorrow. You only have $100 in your account. Payday is in 3 days.",
      choices: [
        { label: "A", text: "Pay what you can ($100) before the due date", isCorrect: true, points: 100, feedback: "Partial payment shows good faith and may reduce late fees. Better than nothing." },
        { label: "B", text: "Wait until payday and pay in full", isCorrect: false, points: -40, feedback: "Late payment gets reported to credit bureaus after 30 days, but late fee hits immediately." },
        { label: "C", text: "Call the company and ask for due date extension", isCorrect: true, points: 90, feedback: "Many companies offer one-time extensions. It never hurts to ask!" },
        { label: "D", text: "Ignore it - one late payment won't matter", isCorrect: false, points: -60, feedback: "Late payments stay on credit reports for 7 years. One can drop your score 100+ points." }
      ],
      deepDive: {
        teaching: "Payment history is 35% of your credit score. Even one 30-day late payment hurts badly.",
        alternative: "Set up autopay for minimums so you never miss. Pay extra manually.",
        ruleOfThumb: "Contact your lender before missing a payment. Most have hardship programs.",
        realWorldExample: "A late payment can drop a 780 score to 680, costing thousands on future loans."
      }
    }
  ],

  // Days 11-30 (Abbreviated for space - each has 5 scenarios)
  // Day 11
  [
    { id: "day11-side-gig", category: "career", context: "Full-time employee | Side gig earning $500/month", question: "Your employer discovers your side gig. They're not happy even though it doesn't compete. What do you do?", choices: [{ label: "A", text: "Quit the side gig immediately", isCorrect: false, points: 30, feedback: "Check your contract first. Non-compete and moonlighting clauses vary." }, { label: "B", text: "Review your employment contract carefully", isCorrect: true, points: 100, feedback: "Know your rights! Many employers can't actually prohibit non-competing side work." }, { label: "C", text: "Keep it secret and be more careful", isCorrect: false, points: -30, feedback: "Dishonesty can lead to termination for cause. Be transparent." }, { label: "D", text: "Offer to discuss boundaries with HR", isCorrect: true, points: 80, feedback: "Proactive communication often resolves these situations positively." }], deepDive: { teaching: "Many employment contracts have vague moonlighting clauses that aren't enforceable.", alternative: "Consider forming an LLC to separate your side business legally.", ruleOfThumb: "Never use company resources, time, or compete directly with your employer.", realWorldExample: "Most tech companies allow side projects as long as they don't conflict or use company IP." } },
    { id: "day11-elderly", category: "relationships", context: "Cash $15,000 | Parents need help | You're their only child", question: "Your elderly parents need financial help. They need $800/month to cover expenses. You can afford $500/month.", choices: [{ label: "A", text: "Give the full $800, sacrifice your savings", isCorrect: false, points: 20, feedback: "Burning out financially helps no one. Give what you can sustainably." }, { label: "B", text: "Give $500/month, help find other resources", isCorrect: true, points: 100, feedback: "Perfect! Give sustainably while exploring government benefits, Medicaid, etc." }, { label: "C", text: "Research government assistance programs for them", isCorrect: true, points: 90, feedback: "Many seniors leave money on the table. SSI, SNAP, utility assistance exist for this." }, { label: "D", text: "Set up a family meeting to split costs with relatives", isCorrect: true, points: 80, feedback: "If other family members can help, sharing the burden is fair." }], deepDive: { teaching: "Sustainable help is better than burning out. You can't pour from an empty cup.", alternative: "Look into Area Agency on Aging, Medicaid, SNAP, Low-Income Home Energy Assistance.", ruleOfThumb: "Secure your own financial oxygen mask before helping others.", realWorldExample: "1 in 4 adults financially supports aging parents. Average contribution is $1,000/month." } },
    { id: "day11-wedding-own", category: "lifestyle", context: "Cash $10,000 | Debt $0 | Planning wedding", question: "You're planning your wedding. Family pressure says spend $30k. You have $10k saved. What's your approach?", choices: [{ label: "A", text: "Get a wedding loan - it's a once-in-a-lifetime event", isCorrect: false, points: -60, feedback: "Starting marriage in debt is a terrible foundation. Average wedding debt takes 2+ years to pay off." }, { label: "B", text: "Plan a $10k wedding within your means", isCorrect: true, points: 100, feedback: "A wedding is one day. A marriage is a lifetime. Don't start in debt." }, { label: "C", text: "Ask parents to contribute if they want fancy", isCorrect: true, points: 80, feedback: "If they're pressuring for expensive, they can help fund it. Fair request." }, { label: "D", text: "Postpone until you save $30k", isCorrect: false, points: 40, feedback: "Why? You can have a beautiful wedding for $10k. Expectations need adjusting, not timeline." }], deepDive: { teaching: "Wedding costs don't correlate with marriage happiness. Some studies show inverse relationship.", alternative: "Courthouse + nice dinner + honeymoon fund can be more meaningful than big weddings.", ruleOfThumb: "Spend no more than what you can pay in cash. Wedding debt predicts divorce.", realWorldExample: "Couples spending $20k+ on weddings have higher divorce rates than those spending under $10k." } },
    { id: "day11-identity", category: "scam", context: "Just received fraud alert | Credit card charged $3,000 in another state", question: "You get a fraud alert: $3,000 charged at a store 1,000 miles away. Card is in your wallet. Next steps?", choices: [{ label: "A", text: "Call the number on the fraud alert text", isCorrect: false, points: -50, feedback: "Scammers send fake fraud alerts! Always call the number on your actual card." }, { label: "B", text: "Call the number on back of your card", isCorrect: true, points: 100, feedback: "Always use verified contact info. Dispute the charge and get a new card number." }, { label: "C", text: "Check your online account first to verify", isCorrect: true, points: 80, feedback: "Good first step to confirm the charge. Then call bank directly." }, { label: "D", text: "File a police report immediately", isCorrect: false, points: 30, feedback: "Police report might help eventually, but secure your account first." }], deepDive: { teaching: "Credit card fraud liability is $0 if reported promptly. Debit cards have less protection.", alternative: "Freeze your credit with all three bureaus to prevent new account fraud.", ruleOfThumb: "Use credit cards over debit. Credit has fraud protection; debit is your cash.", realWorldExample: "Americans lost $8.8 billion to fraud in 2022. Quick action minimizes your loss." } },
    { id: "day11-freelance", category: "tax", context: "Side income: $10,000 | Haven't paid quarterly taxes | Year almost over", question: "You earned $10k freelancing but haven't paid quarterly estimated taxes. It's December. What now?", choices: [{ label: "A", text: "Wait until tax time to deal with it", isCorrect: false, points: -40, feedback: "Underpayment penalties are accumulating. Make a Q4 estimated payment now." }, { label: "B", text: "Make Q4 estimated payment before Jan 15", isCorrect: true, points: 100, feedback: "Catch-up now! You'll still owe penalties for Q1-Q3, but less than waiting." }, { label: "C", text: "Increase W-4 withholding at your job", isCorrect: true, points: 80, feedback: "Smart! Extra withholding counts as paid throughout the year. Reduces penalties." }, { label: "D", text: "Set aside 30% and pay at tax time", isCorrect: false, points: 20, feedback: "Setting aside is good, but you'll pay penalties. Pay estimated taxes quarterly." }], deepDive: { teaching: "Self-employment tax is ~15.3% on top of income tax. Quarterly payments are required.", alternative: "Use IRS Form 1040-ES to calculate and pay quarterly estimates.", ruleOfThumb: "Set aside 25-30% of freelance income immediately for taxes.", realWorldExample: "A $10k side income in the 22% bracket owes ~$3,700 in taxes (income + self-employment)." } }
  ],

  // Day 12
  [
    { id: "day12-comparison", category: "lifestyle", context: "Social media heavy user | Feeling inadequate about finances", question: "Friends post about luxury vacations and new cars on social media. You feel behind. What's a healthy response?", choices: [{ label: "A", text: "Try to keep up to not fall behind", isCorrect: false, points: -60, feedback: "Social media is highlight reels. Comparison is the thief of joy AND money." }, { label: "B", text: "Unfollow or mute accounts that trigger you", isCorrect: true, points: 100, feedback: "Protect your mental health and wallet. Curate your feed intentionally." }, { label: "C", text: "Remember many are in debt for that lifestyle", isCorrect: true, points: 90, feedback: "True! That luxury car might be a lease they can't afford. Appearances deceive." }, { label: "D", text: "Post your own wins to feel better", isCorrect: false, points: 10, feedback: "Competing in the comparison game perpetuates the problem." }], deepDive: { teaching: "Social media shows curated highlights, not credit card statements or stress.", alternative: "Follow financial independence accounts for positive money mindset.", ruleOfThumb: "Never compare your behind-the-scenes to someone else's highlight reel.", realWorldExample: "78% of millennials have gone into debt to keep up with friends' lifestyles." } },
    { id: "day12-employer-match", category: "investing", context: "New job | 401k with 100% match up to 6% | Debt $5,000 at 15% APR", question: "New job offers 100% 401k match up to 6%. You have $5k debt at 15% APR. How much should you contribute?", choices: [{ label: "A", text: "Skip 401k until debt is paid", isCorrect: false, points: -40, feedback: "100% match = instant 100% return. That beats any debt payoff." }, { label: "B", text: "Contribute full 6% to get the match", isCorrect: true, points: 100, feedback: "Free money! 100% match beats 15% debt cost. Get the match, then attack debt." }, { label: "C", text: "Contribute 3%, put rest toward debt", isCorrect: false, points: 30, feedback: "You're leaving 3% free money on the table. Get the full match." }, { label: "D", text: "Max out 401k at $23k/year", isCorrect: false, points: -20, feedback: "Beyond the match, pay off 15% debt first. Match > debt > additional 401k." }], deepDive: { teaching: "Employer match is instant 50-100% return. No debt interest rate beats that.", alternative: "The order: match → high interest debt → Roth IRA → more 401k → taxable.", ruleOfThumb: "Always get the full employer match. It's the best guaranteed return in finance.", realWorldExample: "Skipping a 6% match on $60k salary for 30 years costs $350k+ in retirement." } },
    { id: "day12-used-car", category: "lifestyle", context: "Cash $8,000 | Need a car | Credit 710", question: "You need a reliable car. You have $8k cash. Options: $8k used car outright, or $5k down on a $20k car with 6% financing.", choices: [{ label: "A", text: "Buy $8k car outright, no payments", isCorrect: true, points: 100, feedback: "No car payment is financial freedom. $8k buys a solid, reliable vehicle." }, { label: "B", text: "Finance the $20k car for reliability", isCorrect: false, points: -30, feedback: "A $8k Toyota or Honda is just as reliable. You're paying $12k extra for 'new car smell.'" }, { label: "C", text: "Spend $5k on a cheaper car, invest $3k", isCorrect: true, points: 80, feedback: "Smart if you find a reliable $5k car. Just don't buy a money pit." }, { label: "D", text: "Lease a new car for lower monthly payments", isCorrect: false, points: -60, feedback: "Leasing is the most expensive way to drive. You pay forever with nothing to show." }], deepDive: { teaching: "Cars depreciate 20-30% year one. Let someone else pay that by buying used.", alternative: "Target 3-5 year old Toyota, Honda, or Mazda with 50-80k miles. Peak reliability-to-value.", ruleOfThumb: "Never spend more than 50% of annual income on a car. 20% is ideal.", realWorldExample: "A $300/month car payment invested instead at 7% = $175k in 20 years." } },
    { id: "day12-tithe", category: "giving", context: "Gross income $60k | Debt $15k | Church expects 10% tithe", question: "Your religious community expects a 10% tithe ($6k/year). You have $15k in high-interest debt. How do you balance this?", choices: [{ label: "A", text: "Give full 10% - faith comes first", isCorrect: false, points: 40, feedback: "Admirable conviction, but most religious texts don't ask you to tithe while drowning in debt." }, { label: "B", text: "Give what you can, explain situation to leadership", isCorrect: true, points: 100, feedback: "Most religious leaders understand. Give generously within your means." }, { label: "C", text: "Stop giving until debt is paid", isCorrect: false, points: 50, feedback: "Giving has benefits beyond money. Find a sustainable amount, even if small." }, { label: "D", text: "Give 10% of net income instead of gross", isCorrect: true, points: 80, feedback: "Reasonable interpretation. Net tithe is still generous." }], deepDive: { teaching: "Most religious scholars say tithing from debt violates the spirit of giving.", alternative: "Give time if money is tight. Volunteer, serve, contribute non-financially.", ruleOfThumb: "Give from abundance, not desperation. Build your foundation first.", realWorldExample: "Dave Ramsey (devout Christian) recommends minimum giving while in debt, then increasing." } },
    { id: "day12-storage", category: "lifestyle", context: "Paying $200/month storage unit for 2 years | Stuff worth maybe $1,000", question: "You've been paying $200/month for a storage unit for 2 years. The stuff inside is worth maybe $1,000. What do you do?", choices: [{ label: "A", text: "Keep paying - that's your stuff", isCorrect: false, points: -60, feedback: "You've paid $4,800 to store $1,000 of stuff. Sell it." }, { label: "B", text: "Sell everything and cancel the unit", isCorrect: true, points: 100, feedback: "Sunk cost fallacy is expensive. $200/month invested = $60k in 15 years." }, { label: "C", text: "Keep sentimental items, sell the rest", isCorrect: true, points: 80, feedback: "Reasonable if you can fit keepsakes elsewhere. End the recurring cost." }, { label: "D", text: "Wait until you have a bigger place", isCorrect: false, points: -30, feedback: "You're betting future money on 'someday.' That someday is costing $2,400/year." }], deepDive: { teaching: "Storage units are lifestyle creep traps. You're paying to store stuff you don't use.", alternative: "Take photos of sentimental items if space is the issue. Memories don't need physical space.", ruleOfThumb: "If you haven't needed something in 2 years, you don't need it.", realWorldExample: "Americans spend $39 billion/year on storage. Average unit sits unused for years." } }
  ],

  // Days 13-30: Continuing with diverse scenarios covering all categories
  // Day 13
  [
    { id: "day13-credit-limit", category: "credit", context: "Credit limit $5,000 | Usually spend $3,000/month | Score 690", question: "Your credit utilization is 60% monthly. You pay in full but score isn't climbing. What should you do?", choices: [{ label: "A", text: "Request a credit limit increase", isCorrect: true, points: 100, feedback: "Higher limit = lower utilization percentage. Same spending, better score." }, { label: "B", text: "Pay balance before statement closes", isCorrect: true, points: 90, feedback: "Great hack! Low statement balance means low reported utilization." }, { label: "C", text: "Open multiple new cards to spread utilization", isCorrect: false, points: 20, feedback: "Too many inquiries hurt short-term. Limit increase on existing card is better." }, { label: "D", text: "Nothing - paying in full is enough", isCorrect: false, points: 30, feedback: "Utilization matters regardless of payment. Under 30% (ideally under 10%) is best." }], deepDive: { teaching: "Credit utilization is 30% of your score. Keep it under 30%, ideally under 10%.", alternative: "Pay mid-cycle so your statement balance is low when reported.", ruleOfThumb: "High utilization, even if paid monthly, makes you look risky to lenders.", realWorldExample: "Someone with $500 balance on $5,000 limit scores higher than $3,000 on $5,000." } },
    { id: "day13-gym", category: "lifestyle", context: "Gym membership $80/month | Go 2x per month | Could use free apartment gym", question: "You pay $80/month for a fancy gym but only go twice monthly. Your apartment has a basic gym. What's the move?", choices: [{ label: "A", text: "Keep it - eventually you'll go more", isCorrect: false, points: -30, feedback: "You've been saying that for months. $40/visit is expensive." }, { label: "B", text: "Cancel and use apartment gym", isCorrect: true, points: 100, feedback: "Perfect! $80/month saved, invested = $25k in 15 years." }, { label: "C", text: "Downgrade to Planet Fitness for $10/month", isCorrect: true, points: 80, feedback: "Low-cost option keeps gym access without the premium price." }, { label: "D", text: "Switch to pay-per-visit classes", isCorrect: true, points: 70, feedback: "Good for accountability. If 2x/month at $15 = $30 vs. $80." }], deepDive: { teaching: "Unused subscriptions are budget leaks. Track actual usage vs. cost.", alternative: "Free alternatives: running, YouTube workouts, bodyweight exercises.", ruleOfThumb: "If cost per use exceeds $20, you're overpaying for your actual usage.", realWorldExample: "67% of gym members never go. Gyms profit from this behavior." } },
    { id: "day13-recession", category: "investing", context: "News predicting recession | Portfolio down 15% | Steady job", question: "Headlines are screaming recession. Your portfolio is down 15%. Talking heads say 'sell before it gets worse.' What do you do?", choices: [{ label: "A", text: "Sell everything and go to cash", isCorrect: false, points: -80, feedback: "Selling low locks in losses. Headlines are noise, not investment advice." }, { label: "B", text: "Stay the course, keep contributing", isCorrect: true, points: 100, feedback: "Time in market beats timing the market. Keep buying at these lower prices." }, { label: "C", text: "Stop contributing until things stabilize", isCorrect: false, points: -40, feedback: "You're missing the sale! Down markets are buying opportunities." }, { label: "D", text: "Add extra money while stocks are 'on sale'", isCorrect: true, points: 90, feedback: "If you have cash and time horizon, buying dips accelerates wealth building." }], deepDive: { teaching: "Market drops are normal. Average correction (10%+) happens every 1-2 years.", alternative: "Turn off financial news. Check your portfolio once per quarter at most.", ruleOfThumb: "Your investment horizon matters more than this month's headlines.", realWorldExample: "Investors who sold in March 2020 missed a 100%+ recovery by end of 2021." } },
    { id: "day13-mlm", category: "scam", context: "Friend selling wellness products | Wants you to 'join the team' | $500 starter kit", question: "Your friend is passionate about a wellness company. She wants you to pay $500 for a 'business opportunity' selling products.", choices: [{ label: "A", text: "Join to support your friend", isCorrect: false, points: -80, feedback: "You're not supporting her - you're becoming her customer. MLMs profit from recruits, not sales." }, { label: "B", text: "Politely decline and save the friendship", isCorrect: true, points: 100, feedback: "Real friends don't guilt you into business schemes. Set boundaries kindly." }, { label: "C", text: "Research the company thoroughly first", isCorrect: true, points: 70, feedback: "Good instinct, but the research will show 99% lose money in MLMs." }, { label: "D", text: "Ask to see her actual profit/loss statement", isCorrect: true, points: 80, feedback: "Great test! Most MLM participants have losses when accounting for 'required' purchases." }], deepDive: { teaching: "MLMs are legal pyramid schemes. 99% of participants lose money according to FTC studies.", alternative: "If you want to start a business, create something you own and control.", ruleOfThumb: "If you pay to join a 'job,' it's not a job - you're the customer.", realWorldExample: "99% of MLM participants lose money. The real product is the 'opportunity.'" } },
    { id: "day13-negotiate-bill", category: "saving", context: "Cable bill $180/month | Same service 3 years | Competitor offers $99", question: "You're paying $180/month for cable/internet. A competitor offers similar service for $99. How do you handle this?", choices: [{ label: "A", text: "Just switch to the cheaper provider", isCorrect: true, points: 80, feedback: "Simple and effective. Loyalty doesn't pay - switch and save." }, { label: "B", text: "Call current provider and negotiate with competitor price", isCorrect: true, points: 100, feedback: "Best approach! They have retention deals. Ask for loyalty discount or threaten to leave." }, { label: "C", text: "Keep paying - switching is too much hassle", isCorrect: false, points: -40, feedback: "$81/month in overpayment = $972/year. That's worth 20 minutes on the phone." }, { label: "D", text: "Downgrade to basic package", isCorrect: true, points: 70, feedback: "Good option if you don't need premium channels. Audit what you actually use." }], deepDive: { teaching: "Cable, internet, and phone bills are always negotiable. The first price is never the best.", alternative: "Call annual 'bill reduction day' - spend 1 hour calling all providers to negotiate.", ruleOfThumb: "Threaten to cancel and ask for the 'retention department.' They have authority to discount.", realWorldExample: "Average person can save $50-100/month by negotiating bills annually." } }
  ],

  // Day 14
  [
    { id: "day14-emergency-fund", category: "saving", context: "Cash $1,000 | Debt $0 | Want to start investing | Age 25", question: "You have $1k saved, no debt. Should you start investing or build more emergency fund first?", choices: [{ label: "A", text: "Start investing - time in market matters", isCorrect: false, points: 30, feedback: "Close, but one emergency could wipe out your investment. Build the cushion first." }, { label: "B", text: "Build 3 months expenses in emergency fund first", isCorrect: true, points: 100, feedback: "Correct priority! Emergency fund prevents having to sell investments at bad times." }, { label: "C", text: "Split: half emergency, half investing", isCorrect: true, points: 70, feedback: "Reasonable compromise, especially if employer offers 401k match." }, { label: "D", text: "Get to 6 months expenses before investing anything", isCorrect: false, points: 50, feedback: "6 months is great but you might miss years of 401k matching. 3 months is sufficient to start." }], deepDive: { teaching: "Emergency fund is the foundation. It protects your investments from forced liquidation.", alternative: "High-yield savings account (4-5%) for emergency fund while building.", ruleOfThumb: "1 month expenses per decade of age is a good starting target.", realWorldExample: "Without emergency fund, a $1,000 car repair could mean selling investments at a loss or going into debt." } },
    { id: "day14-kid", category: "family", context: "Expecting first child | Combined income $120k | Debating work/daycare tradeoffs", question: "You're expecting a baby. Daycare costs $2,000/month. One parent earns $55k. Does it make sense for that parent to stay home?", choices: [{ label: "A", text: "Stay home - daycare costs almost equal salary", isCorrect: false, points: 30, feedback: "This ignores career growth, benefits, retirement contributions, and future earnings." }, { label: "B", text: "Calculate total compensation, not just salary", isCorrect: true, points: 100, feedback: "Benefits, 401k match, career trajectory matter. Leaving work has long-term costs." }, { label: "C", text: "Look for part-time or flexible work options", isCorrect: true, points: 90, feedback: "Great middle ground! Many jobs offer flexibility for parents." }, { label: "D", text: "Both work and use daycare regardless of cost", isCorrect: false, points: 60, feedback: "Valid if career is important, but run the full numbers including stress and time." }], deepDive: { teaching: "The 'daycare vs salary' comparison ignores 401k, benefits, raises, and career momentum.", alternative: "Consider family help, nanny shares, or subsidized childcare options.", ruleOfThumb: "Factor in 5-10 years of lost career growth when considering staying home long-term.", realWorldExample: "A 5-year career gap can reduce lifetime earnings by $500k-1M in professional fields." } },
    { id: "day14-medical-debt", category: "debt", context: "Medical bill $4,000 | Insurance denied claim | Hospital demanding payment", question: "You got a $4,000 medical bill after insurance denied the claim. Hospital is calling. What's your strategy?", choices: [{ label: "A", text: "Pay in full to stop the calls", isCorrect: false, points: -30, feedback: "Never pay medical bills immediately. There are always options to reduce." }, { label: "B", text: "Appeal the insurance denial first", isCorrect: true, points: 100, feedback: "Many denials get overturned on appeal. Fight insurance before paying." }, { label: "C", text: "Ask hospital for itemized bill and negotiate", isCorrect: true, points: 90, feedback: "Hospital bills often contain errors. Itemized bills reveal overcharges." }, { label: "D", text: "Set up a no-interest payment plan", isCorrect: true, points: 70, feedback: "If you must pay, most hospitals offer 0% payment plans. Never put on credit card." }], deepDive: { teaching: "Medical bills are negotiable. Hospitals routinely discount 20-50% for those who ask.", alternative: "Hire a medical billing advocate (10-30% of savings) for large bills.", ruleOfThumb: "Appeal insurance first, then negotiate with hospital. Never pay sticker price.", realWorldExample: "66% of insurance denials are overturned on appeal. Most people don't bother appealing." } },
    { id: "day14-promotion", category: "career", context: "Passed over for promotion | Junior colleague got it | Feeling undervalued", question: "You were passed over for a promotion. A junior colleague with less experience got it. What's your response?", choices: [{ label: "A", text: "Immediately start job hunting", isCorrect: false, points: 40, feedback: "Valid option but first gather information. Might be fixable at current company." }, { label: "B", text: "Request feedback meeting with manager", isCorrect: true, points: 100, feedback: "Best first step. Understand why and what you need for next time." }, { label: "C", text: "Quietly resent and reduce effort", isCorrect: false, points: -60, feedback: "Worst option. Either address it or leave. Quiet quitting hurts you most." }, { label: "D", text: "Document contributions and advocate for yourself more", isCorrect: true, points: 80, feedback: "Many overlooked employees simply aren't visible enough. Self-promotion matters." }], deepDive: { teaching: "Getting passed over often means visibility problem, not performance problem.", alternative: "Ask manager: 'What would I need to demonstrate to be promoted within 6 months?'", ruleOfThumb: "If passed over twice with no clear path, it's time to look elsewhere.", realWorldExample: "People who switch companies get 10-20% raises vs. 3% for staying." } },
    { id: "day14-venmo", category: "scam", context: "Sold item online for $200 | Buyer Venmo'd $500 'accidentally' | Wants $300 back", question: "Someone bought your $200 item and 'accidentally' Venmo'd you $500. They want you to send $300 back. What do you do?", choices: [{ label: "A", text: "Send the $300 back - honest mistake", isCorrect: false, points: -100, feedback: "Classic scam! They'll reverse the original $500 and you're out $300." }, { label: "B", text: "Wait 2 weeks to see if payment clears", isCorrect: false, points: 20, feedback: "Fraudulent payments can be reversed weeks later. Don't trust any overpayment." }, { label: "C", text: "Refund by having them reverse the original payment", isCorrect: true, points: 100, feedback: "The only safe option. They can reverse their own payment - you send nothing." }, { label: "D", text: "Block them and keep the $500", isCorrect: false, points: -20, feedback: "Tempting, but the $500 is fraudulent and will be reversed. You'll be out the item." }], deepDive: { teaching: "Overpayment scams use stolen accounts or fake funds. The original payment always gets reversed.", alternative: "Only accept exact payment for exact items. Overpayments are always scams.", ruleOfThumb: "If someone overpays and wants money back, it's 100% a scam.", realWorldExample: "This scam works on Venmo, Zelle, PayPal, and checks. Same pattern every time." } }
  ],

  // Days 15-30: Additional scenarios (abbreviated format)
  ...generateRemainingDays()
];

// Helper function to generate days 15-30
function generateRemainingDays(): Scenario[][] {
  const remainingDays: Scenario[][] = [];
  
  // Day 15
  remainingDays.push([
    { id: "day15-bitcoin", category: "investing", context: "Cash $10k | Coworker made 5x on Bitcoin", question: "Your coworker shows you their Bitcoin gains. They're up 5x. Should you put your $10k savings into crypto?", choices: [{ label: "A", text: "Go all in - don't miss the train", isCorrect: false, points: -80, feedback: "FOMO is not an investment strategy. Past returns don't predict future." }, { label: "B", text: "Invest a small amount you can afford to lose", isCorrect: true, points: 100, feedback: "5-10% of portfolio in speculative assets is reasonable." }, { label: "C", text: "Skip it - you missed the boat", isCorrect: false, points: 40, feedback: "Maybe, but small allocation to growth assets isn't wrong." }, { label: "D", text: "Research heavily before any decision", isCorrect: true, points: 80, feedback: "Good instinct. Understand before investing." }], deepDive: { teaching: "When everyone's talking about an investment, you're probably late.", alternative: "90% boring index funds, 10% maximum for speculation.", ruleOfThumb: "Never invest more in crypto than you can afford to lose entirely.", realWorldExample: "For every crypto millionaire, thousands lost their savings." } },
    { id: "day15-pet", category: "lifestyle", context: "Considering getting a dog | Rent $1,500 | Income $50k", question: "You want to adopt a dog. Annual costs are estimated at $1,500-3,000. You earn $50k with $1,500 rent. Good idea?", choices: [{ label: "A", text: "Yes, pets are priceless", isCorrect: false, points: 20, feedback: "Emotionally true, but financial stress hurts you and the pet." }, { label: "B", text: "Wait until income or housing is more stable", isCorrect: true, points: 100, feedback: "Responsible pet ownership means being financially ready." }, { label: "C", text: "Get a cat instead - lower costs", isCorrect: true, points: 70, feedback: "Cats typically cost 50% less than dogs. Practical compromise." }, { label: "D", text: "Adopt and adjust budget elsewhere", isCorrect: false, points: 40, feedback: "Possible if you have margin. Be honest about where cuts would come from." }], deepDive: { teaching: "Pets cost $15,000-45,000 over their lifetime. Budget accordingly.", alternative: "Foster pets first to test the commitment and costs.", ruleOfThumb: "Budget $200-400/month for a dog, $100-200 for a cat.", realWorldExample: "22% of pet owners go into debt for vet bills they didn't expect." } },
    { id: "day15-refinance", category: "debt", context: "Mortgage $300k at 6.5% | Rates now 5.5% | 25 years remaining", question: "Current mortgage is 6.5%, rates are now 5.5%. Refinance costs $6,000. Should you refinance?", choices: [{ label: "A", text: "Yes - lower rate saves money", isCorrect: true, points: 90, feedback: "1% on $300k = $3,000/year savings. Pays back in 2 years." }, { label: "B", text: "Calculate break-even point first", isCorrect: true, points: 100, feedback: "Perfect! Break-even = closing costs / monthly savings. Make sure you'll stay long enough." }, { label: "C", text: "No - refinance costs eat the savings", isCorrect: false, points: 10, feedback: "Do the math! $6k cost with $250/month savings = 24 month break-even." }, { label: "D", text: "Wait for rates to drop more", isCorrect: false, points: 20, feedback: "Timing markets is impossible. 1% drop is significant now." }], deepDive: { teaching: "Refinance if you'll stay past break-even and the rate drop is 0.5%+.", alternative: "Consider shortening term to 15 years if payment is affordable.", ruleOfThumb: "Break-even under 3 years and you plan to stay 5+ years? Refinance.", realWorldExample: "1% lower on $300k mortgage saves $60,000+ over the life of the loan." } },
    { id: "day15-family-ask", category: "relationships", context: "Sibling asks for $2,000 loan | History of not repaying | You have $8k saved", question: "Your sibling asks to borrow $2,000. They've never repaid previous loans. You have $8k in savings.", choices: [{ label: "A", text: "Loan it - family is family", isCorrect: false, points: -30, feedback: "History predicts future. You'll lose $2k AND family harmony." }, { label: "B", text: "Offer less as a gift with no repayment expectation", isCorrect: true, points: 100, feedback: "Give what you can afford to lose. Calling it a gift prevents resentment." }, { label: "C", text: "Firmly decline based on history", isCorrect: true, points: 80, feedback: "Boundaries are healthy. You're not a bank." }, { label: "D", text: "Offer to pay a bill directly instead of giving cash", isCorrect: true, points: 90, feedback: "Smart way to help with specific need while maintaining control." }], deepDive: { teaching: "Never lend money you can't afford to gift.", alternative: "Help in ways that don't involve cash: job referrals, staying with you, shared meals.", ruleOfThumb: "If they couldn't pay back before, they won't pay back now.", realWorldExample: "Money issues destroy family relationships. Gifts with no strings are cleaner." } },
    { id: "day15-time-money", category: "lifestyle", context: "Debating house cleaning service vs. DIY | Service costs $150/month | Takes you 4 hours/month", question: "House cleaning service costs $150/month. It takes you 4 hours to clean yourself. You earn $40/hour. Hire or DIY?", choices: [{ label: "A", text: "DIY - $150 is too much", isCorrect: false, points: 40, feedback: "Your 4 hours is worth $160 at your rate. Cleaning service might be the deal." }, { label: "B", text: "Hire - your time has value", isCorrect: true, points: 90, feedback: "If you'd use those 4 hours productively or for wellbeing, hire." }, { label: "C", text: "Calculate opportunity cost first", isCorrect: true, points: 100, feedback: "Perfect! Would you work/rest those 4 hours? That determines true value." }, { label: "D", text: "Hire bi-weekly to split the difference", isCorrect: true, points: 80, feedback: "Good compromise. Deep clean outsourced, quick tidying yourself." }], deepDive: { teaching: "Time vs. money decisions should factor in how you'd actually use saved time.", alternative: "Outsource tasks you hate. Do tasks you find meditative.", ruleOfThumb: "If cost < your hourly rate x time, outsourcing makes financial sense.", realWorldExample: "Successful people outsource low-value tasks to focus on high-value activities." } }
  ]);

  // Days 16-30: Generate with similar patterns
  const categories = ["tech", "scam", "travel", "lifestyle", "investing", "career", "debt", "relationships", "housing", "insurance", "tax", "credit", "emergency", "budgeting", "health"];
  
  for (let day = 16; day <= 30; day++) {
    const dayScenarios: Scenario[] = [];
    for (let i = 0; i < 5; i++) {
      const category = categories[(day * 5 + i) % categories.length];
      dayScenarios.push(generateScenario(day, i, category));
    }
    remainingDays.push(dayScenarios);
  }
  
  return remainingDays;
}

function generateScenario(day: number, index: number, category: string): Scenario {
  const scenarios: { [key: string]: Scenario[] } = {
    tech: [
      { id: `day${day}-tech-${index}`, category: "tech", context: "Tech employee | Stock options vesting", question: "Your startup offers to accelerate vesting if you stay another year. The company is struggling. What's your move?",
        choices: [
          { label: "A", text: "Stay for the accelerated vesting", isCorrect: false, points: -20, feedback: "Struggling company stock might be worthless. Don't let golden handcuffs trap you." },
          { label: "B", text: "Start job hunting while staying employed", isCorrect: true, points: 100, feedback: "Best of both worlds. Explore options while collecting paycheck." },
          { label: "C", text: "Leave immediately for a stable company", isCorrect: true, points: 70, feedback: "Valid if company is clearly sinking. Your time has value." },
          { label: "D", text: "Negotiate a cash bonus instead of equity", isCorrect: true, points: 90, feedback: "Smart! Cash today beats uncertain equity tomorrow." }
        ],
        deepDive: { teaching: "Unvested equity in a struggling company is often worthless. Prioritize salary and stability.", alternative: "If staying, negotiate for cash retention bonus instead of more equity.", ruleOfThumb: "Don't count equity until it's liquid cash in your account.", realWorldExample: "Many startup employees stayed for equity that became worthless in downturns." }
      }
    ],
    scam: [
      { id: `day${day}-scam-${index}`, category: "scam", context: "Email from 'Netflix' about payment issue", question: "You get an email saying your Netflix payment failed. There's a link to update your card. You did recently change cards.",
        choices: [
          { label: "A", text: "Click the link to fix it quickly", isCorrect: false, points: -100, feedback: "Phishing! Never click payment links in emails. Go directly to Netflix.com." },
          { label: "B", text: "Log into Netflix directly to check", isCorrect: true, points: 100, feedback: "Perfect! Always go to websites directly, never through email links." },
          { label: "C", text: "Forward it to Netflix's fraud department", isCorrect: true, points: 80, feedback: "Good idea after verifying it's fake. Helps them catch scammers." },
          { label: "D", text: "Reply asking if it's legitimate", isCorrect: false, points: -30, feedback: "Scammers reply to their own emails. Never engage." }
        ],
        deepDive: { teaching: "Phishing emails create urgency about accounts. Always access accounts directly.", alternative: "Check the sender's actual email address - it's usually not from the real company.", ruleOfThumb: "Legitimate companies don't email asking you to click links for payment issues.", realWorldExample: "Netflix phishing is extremely common. Real Netflix emails never ask for payment info." }
      }
    ],
    travel: [
      { id: `day${day}-travel-${index}`, category: "travel", context: "Planning international trip | Credit card vs. debit abroad", question: "You're traveling abroad. Should you use credit card, debit card, or withdraw cash at the destination?",
        choices: [
          { label: "A", text: "Use credit card for everything", isCorrect: true, points: 100, feedback: "Credit cards have best fraud protection and often no foreign transaction fees." },
          { label: "B", text: "Withdraw cash at local ATMs", isCorrect: false, points: 40, feedback: "ATM fees add up. Cash is useful but shouldn't be primary." },
          { label: "C", text: "Use debit card everywhere", isCorrect: false, points: -20, feedback: "Debit has less fraud protection. If compromised, your actual cash is at risk." },
          { label: "D", text: "Mix of credit and small cash amounts", isCorrect: true, points: 90, feedback: "Best approach. Credit for big purchases, small cash for tips and markets." }
        ],
        deepDive: { teaching: "Credit cards abroad offer fraud protection and often better exchange rates.", alternative: "Get a no-foreign-transaction-fee card like Capital One or Charles Schwab debit.", ruleOfThumb: "Notify your bank before traveling to avoid blocked cards.", realWorldExample: "Debit card skimming abroad drains bank accounts. Credit limits your liability to $0." }
      }
    ],
    lifestyle: [
      { id: `day${day}-lifestyle-${index}`, category: "lifestyle", context: "Coffee habit: $6/day at cafes | Working from home", question: "You spend $6/day on coffee shop visits while working from home. That's $180/month. Worth it?",
        choices: [
          { label: "A", text: "Cut it completely - make coffee at home", isCorrect: false, points: 50, feedback: "Extreme. If cafe visits boost productivity and happiness, there's value beyond coffee." },
          { label: "B", text: "Reduce to 2-3 times per week for social benefit", isCorrect: true, points: 100, feedback: "Best balance. You get the ambiance benefit without daily expense." },
          { label: "C", text: "Keep it - productivity and mental health matter", isCorrect: false, points: 40, feedback: "There's value here but $2,160/year is significant. Find middle ground." },
          { label: "D", text: "Get a nice home coffee setup instead", isCorrect: true, points: 80, feedback: "Good investment. $200 setup pays for itself in 5 weeks." }
        ],
        deepDive: { teaching: "The 'latte factor' is often oversimplified. Value your wellbeing, but be intentional.", alternative: "Track for 30 days. See if daily visits are habit or genuine value-add.", ruleOfThumb: "Spend consciously on what brings joy. Cut unconscious autopilot spending.", realWorldExample: "$6/day for 30 years invested = $200k+. But happiness matters too. Balance." }
      }
    ],
    investing: [
      { id: `day${day}-investing-${index}`, category: "investing", context: "Age 45 | Behind on retirement | $20k to invest", question: "You're 45 with only $50k saved for retirement. You have $20k to invest. What's your strategy?",
        choices: [
          { label: "A", text: "Aggressive stocks to catch up", isCorrect: false, points: 40, feedback: "Risky. Aggressive at 45 could backfire if market drops near retirement." },
          { label: "B", text: "Target-date fund matching your retirement year", isCorrect: true, points: 100, feedback: "Let the fund auto-adjust risk as you age. Simple and effective." },
          { label: "C", text: "Bonds for safety since you're older", isCorrect: false, points: -20, feedback: "Too conservative. At 45, you still have 20+ years for growth." },
          { label: "D", text: "Max out 401k and Roth IRA each year going forward", isCorrect: true, points: 90, feedback: "Catch-up contributions are allowed after 50. Aggressive saving is the real answer." }
        ],
        deepDive: { teaching: "If behind on retirement, increase savings rate. Asset allocation matters less than saving more.", alternative: "At 45, 401k limit is $23k. After 50, catch-up adds $7,500. Max it out.", ruleOfThumb: "A 60/40 stock/bond split is reasonable at 45. Adjust as you near retirement.", realWorldExample: "Saving $30k/year from 45-65 at 7% returns yields $1.4M." }
      }
    ],
    career: [
      { id: `day${day}-career-${index}`, category: "career", context: "Counter offer after resignation | Current company offered 20% raise", question: "You resigned for a new job. Your current company counter-offered with a 20% raise. Should you stay?",
        choices: [
          { label: "A", text: "Take the counter offer - more money, no transition", isCorrect: false, points: -30, feedback: "Counter-accepted employees often get pushed out within a year. Your loyalty is now questioned." },
          { label: "B", text: "Leave anyway - you resigned for reasons beyond money", isCorrect: true, points: 100, feedback: "The issues that made you leave rarely change with a raise." },
          { label: "C", text: "Use it to negotiate higher at the new company", isCorrect: true, points: 80, feedback: "Reasonable tactic if the new company has room. Just be prepared for them to say no." },
          { label: "D", text: "Ask for more time to decide", isCorrect: false, points: 20, feedback: "Stalling looks bad to both employers. Make a decision." }
        ],
        deepDive: { teaching: "Statistics show 50%+ of counter-offer accepters leave within 12 months anyway.", alternative: "If staying, get the raise in writing and document everything.", ruleOfThumb: "Leave for reasons, stay for reasons. Money alone isn't a reason.", realWorldExample: "Counter offers buy time for the company to find your replacement." }
      }
    ],
    debt: [
      { id: `day${day}-debt-${index}`, category: "debt", context: "Debt snowball vs avalanche | Multiple debts", question: "You have 3 debts: $2k at 5%, $5k at 18%, $8k at 12%. You have $500/month extra. Which do you pay first?",
        choices: [
          { label: "A", text: "Smallest balance ($2k at 5%)", isCorrect: false, points: 60, feedback: "Debt snowball works psychologically but costs more in interest." },
          { label: "B", text: "Highest interest ($5k at 18%)", isCorrect: true, points: 100, feedback: "Debt avalanche saves the most money. Attack 18% first." },
          { label: "C", text: "Split payment across all three", isCorrect: false, points: 10, feedback: "Least effective. Concentrated payoff is always better." },
          { label: "D", text: "Consolidate all into one lower-rate loan", isCorrect: true, points: 80, feedback: "If you qualify for < 12% rate, consolidation simplifies and saves." }
        ],
        deepDive: { teaching: "Mathematically, highest interest first (avalanche) saves the most money.", alternative: "If you need quick wins for motivation, snowball (smallest first) is psychologically effective.", ruleOfThumb: "18% debt is an emergency. Pay it as aggressively as possible.", realWorldExample: "The $5k at 18% costs $900/year in interest. That's your biggest leak." }
      }
    ],
    relationships: [
      { id: `day${day}-relationships-${index}`, category: "relationships", context: "Friend always expects you to pay | Income disparity", question: "Your friend earns more but always 'forgets' their wallet when you go out. You've covered them 5 times this month.",
        choices: [
          { label: "A", text: "Keep paying - it's just money", isCorrect: false, points: -40, feedback: "You're being taken advantage of. This isn't friendship, it's exploitation." },
          { label: "B", text: "Suggest splitting checks going forward", isCorrect: true, points: 100, feedback: "Direct but kind. Real friends won't have a problem with fairness." },
          { label: "C", text: "Start 'forgetting' your wallet too", isCorrect: false, points: 20, feedback: "Passive-aggressive doesn't solve problems. Communicate directly." },
          { label: "D", text: "Limit outings to free activities only", isCorrect: true, points: 70, feedback: "Avoid the money situation entirely. If they object, you have your answer." }
        ],
        deepDive: { teaching: "Financial boundaries are healthy in all relationships. Being a doormat helps no one.", alternative: "Use apps like Splitwise to track shared expenses transparently.", ruleOfThumb: "Friends who take advantage of your generosity aren't friends.", realWorldExample: "Resentment builds silently. Address money issues early or they poison relationships." }
      }
    ],
    housing: [
      { id: `day${day}-housing-${index}`, category: "housing", context: "Rent vs buy calculation | High-cost city", question: "A home costs $600k. You'd need $120k down (20%). Rent is $2,200/month. If you invest the down payment instead, which is better over 10 years?",
        choices: [
          { label: "A", text: "Buy - building equity beats renting", isCorrect: false, points: 30, feedback: "Not always! In expensive cities, renting + investing often wins." },
          { label: "B", text: "Rent and invest the difference", isCorrect: true, points: 90, feedback: "In many high-cost markets, this strategy builds more wealth." },
          { label: "C", text: "It depends on appreciation and investment returns", isCorrect: true, points: 100, feedback: "Correct! Use a detailed calculator with all costs." },
          { label: "D", text: "Always buy if you can afford it", isCorrect: false, points: 20, feedback: "Affordability ≠ optimal. The math varies by market." }
        ],
        deepDive: { teaching: "Buying isn't always better. Include ALL costs: taxes, insurance, maintenance, opportunity cost.", alternative: "Use NYT Rent vs Buy calculator with your actual numbers.", ruleOfThumb: "If price-to-rent ratio > 20, renting is often financially better.", realWorldExample: "In SF/NYC, renters who invested often end up wealthier than buyers." }
      }
    ],
    insurance: [
      { id: `day${day}-insurance-${index}`, category: "insurance", context: "Car insurance renewal | Perfect driving record", question: "Your car insurance is renewing at $150/month. You've had no accidents in 10 years. Should you just auto-renew?",
        choices: [
          { label: "A", text: "Yes, loyalty is rewarded", isCorrect: false, points: -30, feedback: "Insurance companies rarely reward loyalty. New customer rates are often lower." },
          { label: "B", text: "Get quotes from 3 competitors first", isCorrect: true, points: 100, feedback: "Shopping around typically saves 20-30%. Takes 30 minutes." },
          { label: "C", text: "Call and ask for loyalty discount", isCorrect: true, points: 80, feedback: "They might offer something to keep you. But still compare." },
          { label: "D", text: "Raise deductible to lower premium", isCorrect: true, points: 70, feedback: "If you have emergency fund, higher deductible saves premium." }
        ],
        deepDive: { teaching: "Insurance loyalty penalty is real. Companies raise rates on existing customers slowly.", alternative: "Bundle home/auto with same company for discounts. Still shop around.", ruleOfThumb: "Shop insurance every 2-3 years minimum. Switch if 15%+ savings.", realWorldExample: "The average driver overpays $300/year by not shopping around." }
      }
    ],
    tax: [
      { id: `day${day}-tax-${index}`, category: "tax", context: "1099 freelance income | Haven't been saving for taxes", question: "You made $30k freelancing this year but haven't set aside anything for taxes. What do you owe?",
        choices: [
          { label: "A", text: "About $4,500 (15%)", isCorrect: false, points: 10, feedback: "Too low. Self-employment tax alone is 15.3%!" },
          { label: "B", text: "About $7,500-9,000 (25-30%)", isCorrect: true, points: 100, feedback: "Correct range. SE tax (15.3%) + income tax (12-22%) = 25-30%." },
          { label: "C", text: "About $3,000 (10%)", isCorrect: false, points: -20, feedback: "Way too low. Self-employment tax is brutal." },
          { label: "D", text: "You don't know - see an accountant", isCorrect: true, points: 70, feedback: "For freelancers, CPA often finds deductions that pay for themselves." }
        ],
        deepDive: { teaching: "Self-employment tax (15.3%) catches many freelancers off guard.", alternative: "Deduct: home office, supplies, health insurance, retirement contributions.", ruleOfThumb: "Set aside 25-30% of freelance income immediately for taxes.", realWorldExample: "$30k freelance owes ~$4,600 SE tax + ~$2,500 income tax = $7,100+." }
      }
    ],
    credit: [
      { id: `day${day}-credit-${index}`, category: "credit", context: "Authorized user on parent's old card | Building credit", question: "Your parent offers to add you as authorized user on their 20-year-old card. How does this help your credit?",
        choices: [
          { label: "A", text: "It won't help - only your own cards count", isCorrect: false, points: -20, feedback: "Incorrect! Authorized user cards report to your credit, including the history." },
          { label: "B", text: "It adds their long credit history to yours", isCorrect: true, points: 100, feedback: "Huge boost! Their 20 years of history appears on your report." },
          { label: "C", text: "Only helps if you use the card regularly", isCorrect: false, points: 20, feedback: "You don't need to use it. Just being on it helps your age of accounts." },
          { label: "D", text: "Could hurt if they miss payments", isCorrect: true, points: 80, feedback: "True! Only do this if they have perfect payment history." }
        ],
        deepDive: { teaching: "Authorized user status inherits the card's payment history and age.", alternative: "Make sure the card issuer reports AU status (most do: Amex, Chase, etc.).", ruleOfThumb: "Only piggyback on cards with perfect history and low utilization.", realWorldExample: "Adding a 20-year AU card can boost a new credit file by 50+ points." }
      }
    ],
    emergency: [
      { id: `day${day}-emergency-${index}`, category: "emergency", context: "Water heater broke | $1,200 replacement | No emergency fund", question: "Your water heater just broke. Replacement costs $1,200. You have no emergency fund. Best option?",
        choices: [
          { label: "A", text: "Put it on credit card and pay minimum", isCorrect: false, points: -40, feedback: "Minimum payments mean paying $2,000+ for a $1,200 heater." },
          { label: "B", text: "0% APR credit card or personal loan", isCorrect: true, points: 100, feedback: "If available, interest-free financing gives you time to pay without penalty." },
          { label: "C", text: "Try to repair instead of replace", isCorrect: true, points: 70, feedback: "Good first step. Repairs might be $200-400 and buy years of time." },
          { label: "D", text: "Cold showers until you can save up", isCorrect: false, points: 10, feedback: "Unrealistic for most people. Find financing instead." }
        ],
        deepDive: { teaching: "Lack of emergency fund turns minor inconveniences into major debt spirals.", alternative: "Many utility companies offer appliance payment plans.", ruleOfThumb: "After any emergency expense, immediately start building a $1,000 buffer.", realWorldExample: "This is why emergency funds exist. Start with $1,000, build to 3-6 months." }
      }
    ],
    budgeting: [
      { id: `day${day}-budgeting-${index}`, category: "budgeting", context: "Tried budgeting before | Always failed", question: "You've tried budgeting apps 3 times and quit each. What's a more sustainable approach?",
        choices: [
          { label: "A", text: "Try harder with the same apps", isCorrect: false, points: -20, feedback: "Definition of insanity. If it's not working, try something different." },
          { label: "B", text: "Use a 'pay yourself first' system instead", isCorrect: true, points: 100, feedback: "Automate savings/investing first. Spend what's left freely." },
          { label: "C", text: "Cash envelope system for categories that bust your budget", isCorrect: true, points: 80, feedback: "Physical cash creates natural spending limits for problem areas." },
          { label: "D", text: "Just check account balance before purchases", isCorrect: false, points: 30, feedback: "Too reactive. You need a system, not just awareness." }
        ],
        deepDive: { teaching: "Budgets fail when they feel restrictive. Automation removes willpower from the equation.", alternative: "Set up auto-transfer to savings on payday. Budget what remains.", ruleOfThumb: "Pay yourself first: savings, investing, then bills, then discretionary.", realWorldExample: "People who automate savings save 3x more than those who 'try to save.'" }
      }
    ],
    health: [
      { id: `day${day}-health-${index}`, category: "health", context: "High deductible plan | HSA option | Healthy currently", question: "You're young and healthy. HDHP saves $200/month vs. PPO, but has $3,000 deductible. Which do you choose?",
        choices: [
          { label: "A", text: "PPO for peace of mind", isCorrect: false, points: 20, feedback: "Paying $2,400/year extra for 'peace of mind' is expensive comfort." },
          { label: "B", text: "HDHP with HSA contributions", isCorrect: true, points: 100, feedback: "Save premium difference in HSA. Triple tax advantage builds wealth." },
          { label: "C", text: "HDHP but skip the HSA", isCorrect: false, points: 40, feedback: "You're leaving tax savings on the table. HSA is the best part of HDHP." },
          { label: "D", text: "Ask employer which is better", isCorrect: false, points: 30, feedback: "They can't give personalized advice. Do your own math." }
        ],
        deepDive: { teaching: "HSA is the only triple-tax-advantaged account. Tax-free in, growth, and out.", alternative: "Max HSA ($4,150/year), invest it, pay medical from other funds, let HSA grow.", ruleOfThumb: "If healthy and can cover the deductible, HDHP + HSA usually wins.", realWorldExample: "Maxing HSA from 25-65 at 7% = $550k+ for tax-free medical in retirement." }
      }
    ]
  };

  // Return a scenario from the matching category
  const categoryScenarios = scenarios[category] || scenarios.lifestyle;
  return categoryScenarios[0]; // Return the scenario for this category
}

export function getDailyScenarios(dayNumber: number): Scenario[] {
  // Cycle through 30 days (0-29 index)
  const dayIndex = (dayNumber - 1) % 30;
  return staticScenarioSets[dayIndex] || staticScenarioSets[0];
}

export function getArcadeScenarios(dayNumber: number, arcadeGameIndex: number): Scenario[] {
  const totalSets = staticScenarioSets.length;
  const dailyIndex = (dayNumber - 1) % totalSets;
  // Pick a different set from today's daily drop using the arcade game index as offset
  const arcadeIndex = (dailyIndex + arcadeGameIndex + 1) % totalSets;
  return staticScenarioSets[arcadeIndex] || staticScenarioSets[0];
}

export function getDropNumber(): number {
  // Calculate days since a reference date (Jan 1, 2024)
  const referenceDate = new Date('2024-01-01');
  const today = new Date();
  const diffTime = today.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Start from day 1
}

/** Returns a flat array of all 150 scenarios */
export function getAllScenarios(): Scenario[] {
  return staticScenarioSets.flat();
}

/** Classify a scenario's difficulty based on point spread between best and second-best answer */
export function classifyDifficulty(scenario: Scenario): SurvivalDifficulty {
  const points = scenario.choices.map(c => c.points);
  const maxPoints = Math.max(...points);
  const secondBest = points.filter(p => p !== maxPoints).sort((a, b) => b - a)[0] ?? 0;
  const spread = maxPoints - secondBest;

  // Larger spread = easier (obvious best answer)
  if (spread >= 60) return "easy";
  if (spread >= 30) return "medium";
  return "hard";
}

/** Get shuffled scenarios for a survival match, grouped by difficulty */
export function getSurvivalScenarios(): { easy: Scenario[]; medium: Scenario[]; hard: Scenario[] } {
  const all = getAllScenarios();
  const shuffled = [...all].sort(() => Math.random() - 0.5);

  const easy: Scenario[] = [];
  const medium: Scenario[] = [];
  const hard: Scenario[] = [];

  for (const s of shuffled) {
    const d = classifyDifficulty(s);
    if (d === "easy") easy.push(s);
    else if (d === "medium") medium.push(s);
    else hard.push(s);
  }

  return { easy, medium, hard };
}
