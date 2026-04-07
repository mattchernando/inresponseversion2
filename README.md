# InResponse v2

**MTG Card Price Intelligence App**

A mobile-first Magic: The Gathering card price intelligence app that helps casual players make informed buying decisions and track their collection value.

## Phase 2 Features

### Core Functionality
- **Card Search**: Fast search by name with set filtering
- **Card Details**: Comprehensive card information with pricing
- **Printings Comparison**: View all available printings of a card
- **Price History**: Visual price trends and historical data
- **Buy/Wait Recommendations**: AI-powered recommendations based on market data

### Portfolio Management (Phase 2)
- **User Authentication**: Secure email/password auth with Supabase
- **Portfolio Tracking**: Add, edit, and delete card holdings
- **Portfolio Dashboard**: Complete overview of portfolio performance
- **Historical Tracking**: Daily portfolio value snapshots
- **Gain/Loss Analysis**: Real-time profit/loss calculations
- **Future Projections**: Lightweight portfolio outlook predictions
- **Holding Recommendations**: Personalized buy/sell signals for owned cards

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Supabase Auth
- **Data Source**: Scryfall API
- **Charts**: Recharts
- **Validation**: Zod
- **State Management**: React hooks + TanStack Query ready

## Architecture

### Clean Separation of Concerns
- **External Services**: `src/lib/scryfall/` - Scryfall API integration
- **Data Layer**: `src/lib/db/` - Database service layer
- **Business Logic**: `src/lib/portfolio/`, `src/lib/recommendations/`, `src/lib/projections/`
- **Auth Layer**: `src/lib/auth/` - Authentication service
- **UI Layer**: `src/components/` - Presentation components
- **API Layer**: `src/app/api/` - Next.js API routes

### Extensible Design
The architecture is designed for easy extraction into a Juniper API:
- All business logic lives in reusable service modules
- UI components are pure presentation layers
- API routes can be easily extracted to separate services

## Quick Start

### 1. Environment Setup

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Scryfall API (no key required)
SCRYFALL_API_BASE_URL=https://api.scryfall.com

# Auth Configuration (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the schema migration in your Supabase SQL editor:

```sql
-- Copy and execute the contents of supabase/schema.sql
```

This creates:
- User profiles and portfolios
- Card holdings with purchase tracking
- Portfolio value snapshots
- Proper RLS policies for security

### 3. Install Dependencies

```bash
npm install
```

### 4. Data Synchronization

Sync the initial data from Scryfall:

```bash
# Sync all MTG sets (takes ~1 minute)
npm run sync:sets

# Sync all cards (takes 10-30 minutes depending on connection)
npm run sync:cards

# Create initial price snapshots
npm run snapshot:prices
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## User Guide

### Getting Started
1. **Sign Up**: Create an account with email/password
2. **Search Cards**: Use the search bar to find MTG cards
3. **Add to Portfolio**: Click "Add to Portfolio" on any card
4. **Track Performance**: View your portfolio dashboard

### Portfolio Features
- **Holdings**: Track quantity, purchase price, and current value
- **Gain/Loss**: Real-time profit/loss calculations
- **Recommendations**: Personalized buy/sell signals
- **Historical Tracking**: Daily portfolio value snapshots
- **Projections**: Lightweight future outlook predictions

### Card Analysis
- **Market Recommendations**: General buy/sell signals
- **Price History**: Visual charts showing price trends
- **Printings Comparison**: Compare different set versions
- **Personal Context**: See how your position compares to market signals

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                 # API routes
      auth/              # Authentication endpoints
      portfolio/          # Portfolio management
      cards/             # Card data endpoints
      sets/              # Set data endpoints
    auth/                # Login/signup page
    portfolio/           # Portfolio dashboard
    card/[id]/           # Card detail page
    page.tsx             # Homepage/search
  components/            # React components
    search/             # Search functionality
    cards/              # Card detail components
    portfolio/          # Portfolio components
    ui/                 # shadcn/ui components
  lib/                   # Utility libraries
    scryfall/           # Scryfall API integration
    recommendations/     # Buy/sell recommendation engine
    projections/        # Portfolio projection engine
    portfolio/          # Portfolio business logic
    auth/               # Authentication service
    db/                 # Database service layer
    types/              # TypeScript type definitions
    supabase/           # Supabase client configuration
scripts/                # Data synchronization scripts
supabase/              # Database schema and migrations
```

## API Endpoints

### Authentication
- `POST /api/auth` - Sign up/sign in
- `POST /api/auth/signout` - Sign out

### Portfolio Management
- `GET /api/portfolio` - Get portfolio summary and projection
- `GET /api/portfolio/holdings` - Get all holdings
- `POST /api/portfolio/holdings` - Create new holding
- `PATCH /api/portfolio/holdings/[id]` - Update holding
- `DELETE /api/portfolio/holdings/[id]` - Delete holding

### Cards
- `GET /api/cards/search?q=lightning+bolt&set=lea` - Search cards
- `GET /api/cards/[id]` - Get card details with recommendations

### Sets
- `GET /api/sets` - Get all sets
- `GET /api/sets/[code]` - Get set details

## Data Model

### Core Tables
- **cards**: Canonical card identities
- **sets**: MTG set information
- **card_printings**: Specific card printings with pricing
- **price_snapshots**: Historical price data

### Portfolio Tables
- **profiles**: User profile information
- **portfolios**: User portfolios (default created automatically)
- **portfolio_holdings**: Individual card holdings
- **portfolio_snapshots**: Historical portfolio values
- **holding_snapshots**: Historical holding values

## Recommendation Engine

The recommendation system uses heuristics based on:
- Current price vs historical average
- Short-term price trends
- Volatility metrics
- Set age and rarity
- Number of available printings

**Recommendation Types:**
- `buy_now` - Good value opportunity
- `wait` - Price likely to decrease
- `fair_price` - Reasonable current price
- `buy_below_target` - Wait for specific price

## Projection Engine

Lightweight projection system for portfolio outlook:
- **Direction**: up, flat, down, uncertain
- **Confidence**: low, medium, high
- **Factors**: Trend analysis, volatility, concentration
- **Scope**: Portfolio-level and individual holding projections

## Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Data Management
npm run sync:sets    # Sync MTG sets from Scryfall
npm run sync:cards   # Sync all cards from Scryfall
npm run snapshot:prices  # Create daily price snapshots
npm run snapshot:portfolio  # Create portfolio value snapshots
npm run snapshot:user <user_id>  # Snapshot specific user portfolio
```

## Security

- **Row Level Security**: All user data protected with RLS policies
- **Authentication**: Supabase Auth with secure session handling
- **Input Validation**: Zod schemas for all API inputs
- **User Ownership**: All operations verify user ownership of data

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Future Compatibility

### Phase 3 Ready Architecture
The codebase is designed to easily support:
- **Alerts/Notifications**: Email/SMS alerts for price changes
- **Watchlists**: Track cards without owning them
- **Advanced Analytics**: Deeper portfolio insights
- **AI Assistant**: Chat interface for portfolio advice
- **MCP Integration**: Wrapper for AI workflows
- **Juniper API**: Extract business logic to separate service
- **Premium Features**: Subscription tiers and advanced features

### MCP Wrapper Ready
All business logic is in reusable service modules:
- `PortfolioService` - Portfolio operations
- `RecommendationEngine` - Buy/sell signals
- `ProjectionEngine` - Future outlook
- `AuthService` - User management

These can be easily extracted to a separate MCP-compatible API.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Maintain clean separation of concerns
- Add proper error handling
- Include loading states for user operations

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/your-org/inresponse-v2/issues)
- Review the API documentation in the codebase
- Join our [Discord Community](https://discord.gg/your-server)

---

**Built with MTG players in mind.**
