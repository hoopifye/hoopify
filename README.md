# Hoopifye

A modern calendar and event management application built with Next.js, Prisma, and Better Auth.

**Live at:** [https://hoopifye.pl](https://hoopifye.pl)

## Features

- 📅 Calendar management with multiple calendars
- 👥 Team collaboration with invites and permissions
- 🔐 Secure authentication (email/password, Google OAuth)
- 📧 Email notifications via Resend
- 🌙 Dark/Light mode support

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Better Auth
- **Email:** Resend
- **Styling:** Tailwind CSS + Radix UI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend API key (for emails)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/hoopifye.git
cd hoopifye
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hoopify"
DIRECT_URL="postgresql://user:password@localhost:5432/hoopify"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-generated-secret"
RESEND_API_KEY="your-resend-api-key"
EMAIL_SENDER_NAME="Hoopifye"
EMAIL_SENDER_ADDRESS="noreply@hoopifye.pl"
```

5. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deploy on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/hoopifye)

### Manual Deployment

1. **Push to GitHub** - Ensure your code is pushed to a GitHub repository

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `hoopifye` folder as the root directory

3. **Set up Database:**
   - Use [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com)
   - Get your connection strings

4. **Configure Environment Variables in Vercel Dashboard:**

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your pooled connection string (with `?pgbouncer=true` for Neon/Supabase) |
   | `DIRECT_URL` | Your direct connection string (for migrations) |
   | `NEXT_PUBLIC_APP_URL` | `https://hoopifye.pl` |
   | `BETTER_AUTH_URL` | `https://hoopifye.pl` |
   | `BETTER_AUTH_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `RESEND_API_KEY` | Your Resend API key |
   | `EMAIL_SENDER_NAME` | `Hoopifye` |
   | `EMAIL_SENDER_ADDRESS` | `noreply@hoopifye.pl` |
   | `GOOGLE_CLIENT_ID` | (Optional) Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth client secret |

5. **Add Custom Domain:**
   - Go to Project Settings → Domains
   - Add `hoopifye.pl`
   - Configure DNS records as shown

6. **Run Database Migrations:**
   ```bash
   # Locally with production DATABASE_URL
   npx prisma migrate deploy
   ```

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://hoopifye.pl/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for dev)

### Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (`hoopifye.pl`)
3. Create an API key
4. Add DNS records for email verification

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Project Structure

```
hoopifye/
├── prisma/           # Database schema and migrations
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── generated/    # Generated Prisma client
│   ├── hooks/        # Custom React hooks
│   └── lib/          # Utilities and configurations
└── vercel.json       # Vercel configuration
```

## License

MIT
