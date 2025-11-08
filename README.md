# LoL Analytics

A comprehensive League of Legends analytics platform that provides detailed player statistics, match analysis, champion mastery tracking, and AI-powered insights. Built with Next.js, React, and TypeScript.

![LoL Analytics](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🎮 Features

### Core Features
- **Player Statistics Dashboard** - Comprehensive player profile with ranked stats, win rates, and performance metrics
- **Match History Analysis** - Detailed match breakdowns with KDA, damage dealt, vision score, and more
- **Champion Mastery Tracking** - Track mastery points, levels, and progress across all champions
- **Ranked Statistics** - View ranked solo/duo and flex queue statistics with LP tracking
- **Live Game Spectator** - Real-time game information for players currently in-game
- **Challenges & Achievements** - Track challenge progress and achievements
- **Clash Tournament Support** - View Clash tournament information and team statistics

### Advanced Features
- **AI-Powered Insights** - Get personalized recommendations and performance analysis using Amazon Bedrock
- **Performance Analytics** - Advanced charts and graphs showing trends over time
- **Champion Tier List** - See your best performing champions ranked by performance
- **Strengths & Weaknesses Analysis** - Identify areas for improvement
- **Death Location Heatmap** - Visualize where you die most frequently on the map
- **Match Filtering** - Filter matches by queue type, champion, result, date range, and more
- **Export & Share** - Export your statistics and share with others

### UI/UX Features
- **Modern, Responsive Design** - Beautiful UI with animated backgrounds
- **Dark Theme** - Easy on the eyes with a sleek dark color scheme
- **Real-time Updates** - Live data fetching and updates
- **Mobile-Friendly** - Fully responsive design for all devices
- **Fast Performance** - Optimized for speed with Next.js 15

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & APIs
- **Express.js** - Backend server for Riot API proxy
- **Riot Games API** - Official League of Legends API
- **Amazon Bedrock** - AI-powered insights and recommendations
- **AWS Lambda** - Serverless functions for AI processing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Riot Games API Key** (get one from [Riot Developer Portal](https://developer.riotgames.com/))
- **AWS Account** (optional, for AI features)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/apislol.git
   cd apislol/lol-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Riot API Configuration
   NEXT_PUBLIC_RIOT_API_KEY=your_riot_api_key_here
   NEXT_PUBLIC_RIOT_CLIENT_ID=your_riot_client_id_here

   # Backend Configuration
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

   # AWS Configuration (for AI features)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

4. **Set up the backend server**
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend server will run on `http://localhost:3001` by default.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### Backend Configuration

The backend server requires Riot API credentials. Configure them via:

1. **API Key Method**: Set `NEXT_PUBLIC_RIOT_API_KEY` in environment variables
2. **Cookies Method**: Use the `/auth/configure` endpoint to set cookies

### Region Configuration

The application supports multiple regions:
- **Americas**: NA, BR, LAN, LAS, OCE
- **Europe**: EUW, EUN, TR, RU
- **Asia**: KR, JP, PH, SG, TH, TW, VN

## 📖 Usage

### Searching for a Player

1. Navigate to the home page
2. Enter a Riot ID in the format: `GameName#TAG`
3. Select your region
4. Click "Search" or press Enter

### Player Dashboard

The player dashboard provides:
- **Overview Tab**: Quick stats, recent games, and performance summary
- **Matches Tab**: Filterable match history with detailed statistics
- **Champions Tab**: Champion performance analysis
- **Mastery Tab**: Champion mastery progress
- **Challenges Tab**: Challenge progress and achievements
- **Live Game Tab**: Real-time game information (if player is in-game)

### AI Dashboard

Access the AI-powered dashboard from the player page to get:
- Personalized performance insights
- Champion recommendations
- Improvement roadmaps
- Strength and weakness analysis

## 📁 Project Structure

```
lol-analytics/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── player/            # Player dashboard pages
│   │   ├── ai-dashboard/      # AI insights pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ai/                # AI-related components
│   │   ├── analytics/         # Analytics components
│   │   ├── match/             # Match-related components
│   │   └── ui/                # UI primitives
│   ├── lib/                   # Utility libraries
│   │   ├── api/               # API client code
│   │   ├── ai/                # AI integration
│   │   └── utils/             # Helper functions
│   └── types/                 # TypeScript type definitions
├── backend/                   # Express.js backend server
├── public/                    # Static assets
└── scripts/                   # Utility scripts
```

## 🔌 API Endpoints

### Frontend API Routes

- `GET /api/player/[gameName]/[tagLine]` - Get player data
- `GET /api/player/[gameName]/[tagLine]/matches` - Get paginated matches
- `GET /api/live-game/[gameName]/[tagLine]` - Get live game data
- `GET /api/challenges/[gameName]/[tagLine]` - Get challenge data
- `POST /api/ai/chat` - AI chat endpoint
- `GET /api/backend-test` - Test backend connectivity

### Backend API Routes

The backend server proxies Riot API requests. See `backend/README.md` for full documentation.

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format code with Prettier
npm run type-check      # Run TypeScript type checking

# Testing
npm run preview         # Build and preview production build
```

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Follow the existing code style and run `npm run lint:fix` before committing.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy!

### AWS Amplify

1. Connect your repository
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Riot Games** - For providing the League of Legends API
- **Next.js Team** - For the amazing framework
- **Recharts** - For the charting library
- **Radix UI** - For accessible components

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

## 🔮 Roadmap

- [ ] Real-time match tracking
- [ ] Team statistics and analysis
- [ ] Advanced machine learning predictions
- [ ] Mobile app version
- [ ] Social features and sharing
- [ ] Tournament bracket visualization
- [ ] More AI-powered insights

---

**Note**: This project is not affiliated with or endorsed by Riot Games. League of Legends is a trademark of Riot Games, Inc.

