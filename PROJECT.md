# LoL Analytics - Hackathon Project

## Inspiration

I'm a League of Legends player, and honestly? I got tired of having to jump between different websites just to see my stats, match history, and figure out what I'm doing wrong. Most analytics tools out there either show you basic numbers or require you to pay for the good stuff.

I wanted something that actually helps you improve - not just tells you your KDA. What if I could use AI to analyze your gameplay patterns and give you real, actionable advice? What if you could see exactly where you die most on the map? What if the dashboard actually looked good and didn't feel like it was built in 2010?

That's how LoL Analytics was born. I wanted to build the analytics platform I wish existed when I was grinding ranked games.

## What it does

LoL Analytics is a comprehensive dashboard that gives you everything you need to understand and improve your League of Legends gameplay. Here's what players get:

**Core Features:**
- Complete player profile with ranked stats, win rates, and performance metrics
- Detailed match history with filtering by champion, queue type, date, and more
- Champion mastery tracking across all your champions
- Live game spectator mode to see what's happening in real-time
- Challenge progress and achievement tracking
- Clash tournament information and team stats

**The Cool Stuff:**
- **AI-Powered Insights**: I integrated Amazon Bedrock to analyze your gameplay and give personalized recommendations. It actually looks at your patterns and tells you what to work on.
- **Death Location Heatmap**: See exactly where you die most on the map. Turns out that bush isn't as safe as you thought.
- **Performance Analytics**: Charts and graphs showing your trends over time - are you actually improving or just getting lucky?
- **Champion Tier List**: See which champions you perform best with, ranked by actual performance metrics
- **Strengths & Weaknesses Analysis**: Get a breakdown of what you're good at and what needs work

Everything is wrapped in a modern, dark-themed UI that actually looks good and works on mobile too.

## How I built it

I split the work into frontend and backend, with a clear separation of concerns.

**Frontend (Next.js 15 + React 19):**
- Built with Next.js App Router for server-side rendering and API routes
- TypeScript for type safety (saved me from so many bugs)
- Tailwind CSS for styling - I wanted it to look modern without spending days on CSS
- Recharts for data visualization - those performance graphs don't draw themselves
- Radix UI components for accessibility and good UX

**Backend (Express.js):**
- Express server that acts as a proxy to the Riot Games API
- Handles rate limiting and API key management
- Processes and transforms raw Riot API data into something the frontend can actually use

**AI Integration:**
- Amazon Bedrock for the AI analysis
- AWS Lambda functions to handle the heavy AI processing (those insights take 5-15 minutes to generate)
- I had to implement some serious retry logic because AI processing is slow but worth it

**The Flow:**
1. User searches for a player by Riot ID
2. Frontend calls my Next.js API routes
3. API routes proxy requests to my Express backend
4. Backend fetches data from Riot API and transforms it
5. For AI insights, I send player data to AWS Lambda which uses Bedrock
6. Results come back and get displayed in beautiful charts and visualizations

I deployed the frontend on AWS Amplify and the backend on an EC2 instance. The AI stuff runs serverless on Lambda.

## Challenges I ran into

Oh man, where do I start?

**Riot API Rate Limits:**
The Riot API has strict rate limits, and I kept hitting them during development. I had to implement proper request queuing and caching. Also, their API structure is... interesting. Different endpoints use different region formats (platform vs routing region), and I spent way too long debugging why some calls worked and others didn't.

**AI Processing Time:**
The AI analysis takes forever - like 5-15 minutes. AWS Amplify has a 30-second gateway timeout, so I had to configure Next.js API routes with 15-minute timeouts. Then I had to add retry logic with 5-minute delays because the AI needs time to think. I learned that "wait 5 minutes, then retry" is a valid strategy when dealing with AI.

**Data Transformation:**
The Riot API returns data in a format that's not exactly frontend-friendly. I had to write a ton of transformation functions to convert match data, champion stats, mastery points, etc. into something I could actually display. This took longer than I expected.

**TypeScript Errors:**
I love TypeScript, but sometimes it feels like it's working against me. Spent hours fixing type errors, especially with the chart libraries. The Recharts library's types weren't always clear, and I had to do some creative type casting.

**Fetch Configuration Issues:**
I kept getting `UND_ERR_INVALID_ARG` errors when calling the backend. Turns out I was using invalid fetch options like `Keep-Alive: timeout=900` and `cache: 'no-store'` that Node.js fetch doesn't support. Had to strip it down to just the basics.

**State Management:**
Managing pagination state for matches, champions, and mastery across multiple tabs got messy. I had to refactor how I handle "Load More" buttons and make sure the state updates correctly.

## Accomplishments that I'm proud of

**The AI Integration Actually Works:**
Getting Amazon Bedrock integrated and working was a huge win. The AI actually analyzes gameplay patterns and gives useful advice. It's not just generic tips - it looks at your specific matches and tells you what to improve.

**The Death Location Heatmap:**
This was a fun feature to build. I parse all the death events from match data and plot them on a map visualization. It's surprisingly useful - you can literally see where you're making mistakes.

**Performance Under Load:**
I implemented proper pagination and lazy loading. You can load hundreds of matches without the page freezing. The "Load More" functionality works smoothly across all tabs.

**The UI Looks Good:**
I'm a developer, not a designer, but I'm pretty happy with how it turned out. The dark theme, smooth animations, and responsive design make it actually pleasant to use.

**I Actually Finished It:**
For a hackathon project, I built something pretty complete. It's not just a prototype - it's a working application that people could actually use. I have error handling, loading states, retry logic, and all the polish that makes it feel like a real product.

**Type Safety:**
Even though TypeScript gave me headaches, having type safety caught so many bugs before they made it to production. I'm proud that the codebase is fully typed.

## What I learned

**Next.js 15 is Powerful:**
The App Router and API routes made it so much easier to build a full-stack app. Being able to write API endpoints right next to the pages that use them is a game-changer.

**AI Takes Time:**
I learned that AI processing is slow, and that's okay. You can't rush good analysis. I had to build my entire system around the fact that some operations take 15 minutes, and that's fine.

**API Design Matters:**
Spending time on good API design upfront saves so much debugging later. Having clear separation between frontend API routes and backend endpoints made the codebase much more maintainable.

**Error Handling is Critical:**
I spent a lot of time on error handling and retry logic, and it paid off. Users don't see cryptic errors - they see helpful messages that explain what went wrong and what they can do.

**TypeScript is Worth It:**
Even though it slowed me down sometimes, TypeScript caught so many bugs. The type errors that seemed annoying at the time saved me from runtime errors later.

**Rate Limiting is Hard:**
Working with third-party APIs taught me a lot about rate limiting, caching, and request queuing. I had to be smart about how I fetch data to avoid hitting limits.

**Deployment is Complicated:**
Getting everything deployed on AWS Amplify and EC2 taught me about environment variables, build configurations, and the joy of debugging production issues that don't happen locally.

## Methodology: How the Coaching Agent Works

The AI coaching agent analyzes player performance using a multi-stage data processing pipeline that transforms raw match data into actionable insights.

**Data Sources:**
The system aggregates data from multiple Riot Games API endpoints:
- Match history (last 20-30 matches) with detailed participant stats
- Champion mastery levels and points across all champions
- Ranked statistics (solo/duo and flex queue)
- Challenge progress and achievements
- Clash tournament participation and results

**Data Processing:**
Before sending data to the AI, I pre-process and aggregate it:
1. **Match Statistics Extraction**: Calculate averages for KDA, damage dealt, vision score, gold earned, CS, and kill participation across recent matches
2. **Trend Analysis**: Compute 30-day trends for win rate, KDA, and damage output to identify performance patterns
3. **Champion Performance**: Aggregate win rates, average KDA, and mastery levels for each champion played
4. **Role Analysis**: Group performance metrics by role (top, jungle, mid, ADC, support) to identify strengths
5. **Pre-computed Insights**: Calculate key metrics like recent form, consistency scores, and improvement areas

**AI Analysis:**
The aggregated data is sent to Amazon Bedrock (DeepSeek V3.1 model) with a structured prompt that includes:
- Player profile and ranked status
- Performance summary with key metrics
- Champion mastery breakdown
- Recent match details with outcomes
- Role-specific statistics
- Challenge and achievement data

The AI model analyzes this data with a temperature of 0.5 (focused analysis) and generates insights across multiple categories:
- **Match Performance**: Win rate trends, consistency, recent form analysis
- **Champion Mastery**: Pool diversity, top performers, champion recommendations
- **Ranked Progression**: Current rank analysis and improvement pathways
- **Role Performance**: Strengths and weaknesses across different positions
- **KDA & Damage Trends**: Performance patterns over time
- **Vision & Map Control**: Warding habits and map awareness

**Recommendation Logic:**
The AI identifies patterns and generates recommendations by:
1. **Comparative Analysis**: Comparing player metrics against their rank average and identifying outliers
2. **Trend Detection**: Spotting declining or improving performance trends in specific areas
3. **Champion Optimization**: Recommending champions based on win rate, mastery level, and role fit
4. **Role-Specific Insights**: Providing targeted advice for each role (e.g., vision control for supports, CS efficiency for ADCs)
5. **Weakness Identification**: Highlighting areas with below-average performance that need improvement

The system uses a 15-minute timeout to allow the AI sufficient time for comprehensive analysis, with retry logic that waits 5 minutes between attempts to account for AI processing delays.

## What's next for lol-analytics

I have so many ideas for where to take this next:

**Real-time Features:**
- WebSocket integration for live match tracking
- Push notifications when your friends are in-game
- Real-time leaderboards

**More AI Features:**
- Predictive match outcome analysis
- Champion recommendation engine based on your playstyle
- Automated coaching sessions with the AI

**Social Features:**
- Compare stats with friends
- Share your achievements and highlights
- Team statistics and analysis

**Advanced Analytics:**
- Machine learning models to predict your rank progression
- Detailed role-specific analysis (jungle pathing, support positioning, etc.)
- Meta analysis showing which champions/strategies work best in your elo

**Mobile App:**
- Native mobile app so you can check your stats on the go
- Push notifications for match results
- Quick stats widget

**Performance Improvements:**
- Better caching strategies
- Optimistic UI updates
- Service worker for offline functionality

**Tournament Features:**
- Custom tournament bracket visualization
- Team vs team comparisons
- Scouting reports for opponents

I'm excited to keep building and see where this project goes. There's so much potential to make this the go-to analytics platform for League players.

