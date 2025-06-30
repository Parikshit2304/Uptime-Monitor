# Uptime Monitor

A simple yet powerful uptime monitoring tool built with React and Node.js. Monitor your websites' availability, track response times, and get detailed uptime statistics.

## Features

- **Real-time Monitoring**: Automatic checks every minute
- **Website Management**: Add, edit, delete, and pause monitoring
- **Uptime Statistics**: 30-day uptime percentages and incident tracking
- **Response Time Tracking**: Monitor website performance
- **Clean Dashboard**: Modern UI with real-time updates
- **Downtime Logging**: Detailed logs of all incidents

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite with Prisma ORM
- **Monitoring**: Cron jobs with Axios

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:3001

## Usage

1. **Add Websites**: Click "Add Website" to start monitoring a new URL
2. **View Status**: The dashboard shows real-time status of all monitored sites
3. **Manage Sites**: Edit or delete websites using the menu on each card
4. **Monitor Stats**: View uptime percentages, response times, and incident counts

## Database Schema

- **Websites**: Store website information and current status
- **Downtime Logs**: Track all downtime incidents with start/end times

## API Endpoints

- `GET /api/websites` - Get all websites with stats
- `POST /api/websites` - Add new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website
- `GET /api/websites/:id/stats` - Get detailed statistics

## Monitoring Logic

- Checks run every minute via cron job
- Websites with 5xx status codes are considered "down"
- Response times are measured for performance tracking
- Downtime incidents are automatically logged and closed

## Development

- `npm run server` - Start backend only
- `npm run client` - Start frontend only  
- `npm run db:studio` - Open Prisma Studio for database management

## License

MIT License