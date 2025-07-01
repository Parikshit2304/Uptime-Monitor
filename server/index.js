const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { sendEmailAlert } = require('./notification'); // Import the email notification function
const statusTickCache = new Map();
const axios = require('axios');
const statusCache = new Map();

const app = express();
const prisma = new PrismaClient();
require('dotenv').config();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Get all websites
app.get('/api/websites', async (req, res) => {
  try {
    const websites = await prisma.website.findMany({
      include: {
        downtimeLogs: {
          orderBy: { startTime: 'desc' },
          take: 5
        }
      }
    });

    // Calculate uptime statistics for each website
    const websitesWithStats = await Promise.all(websites.map(async (website) => {
      const stats = await calculateUptimeStats(website.id);
      return {
        ...website,
        ...stats
      };
    }));

    res.json(websitesWithStats);
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// Add new website
app.post('/api/websites', async (req, res) => {
  try {
    const { name, url, email } = req.body;

    if (!name || !url || !email) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const website = await prisma.website.create({
      data: { name, url, email }
    });

    res.status(201).json(website);
  } catch (error) {
    console.error('Error creating website:', error);
    if (error.code === 'P200c2') {
      res.status(400).json({ error: 'URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create website' });
    }
  }
});

// Update website
app.put('/api/websites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, email, isActive } = req.body;

    const website = await prisma.website.update({
      where: { id },
      data: { name, url, email, isActive }
    });

    res.json(website);
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).json({ error: 'Failed to update website' });
  }
});

// Delete website
app.delete('/api/websites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.website.delete({
      where: { id }
    });

    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
});

// Get website statistics
app.get('/api/websites/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await calculateUptimeStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
app.get('/api/websites/:id/ticks', (req, res) => {
  const { id } = req.params;
  const ticks = statusTickCache.get(id) || [];
  res.json(ticks);
});
// Helper function to calculate uptime statistics
async function calculateUptimeStats(websiteId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const downtimeLogs = await prisma.downtimeLog.findMany({
    where: {
      websiteId,
      startTime: { gte: thirtyDaysAgo }
    }
  });

  let totalDowntime = 0;
  downtimeLogs.forEach(log => {
    const endTime = log.endTime || now;
    const downtime = endTime.getTime() - log.startTime.getTime();
    totalDowntime += downtime;
  });

  const totalTime = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  const uptime = totalTime - totalDowntime;
  const uptimePercentage = (uptime / totalTime) * 100;

  return {
    uptimePercentage: Math.max(0, uptimePercentage),
    totalDowntime: totalDowntime,
    downtimeCount: downtimeLogs.length
  };
}
function updateStatusTicks(websiteId, isUp) {
  const ticks = statusTickCache.get(websiteId) || [];

  const newTick = {
    status: isUp ? 'up' : 'down',
    timestamp: new Date()
  };

  // Maintain only the last 30 ticks
  const updated = [...ticks, newTick];
  if (updated.length > 30) updated.shift();

  statusTickCache.set(websiteId, updated);
}
// Monitoring function
async function checkWebsite(website) {
  try {
    console.log(`Checking ${website.name} (${website.url})`);
    const startTime = Date.now();

    const response = await axios.head(website.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      validateStatus: (status) => status >= 200 && status <= 299
    });

    const responseTime = Date.now() - startTime;
    const isUp = response.status >= 200 && response.status <= 299;

    updateStatusTicks(website.id, isUp);


    const newStatus = isUp ? 'up' : 'down';
    const previousStatus = statusCache.get(website.id) || 'unknown';

    if (newStatus === 'up' && previousStatus === 'down') {
      console.log(`✅ ${website.name} is back up`);
      // await sendEmailAlert(
      //   website.email,
      //   `🚀 ${website.name} is BACK UP`,
      //   `URL: ${website.url} is back up at ${new Date().toLocaleString()}`
      // );
    }

    statusCache.set(website.id, newStatus);

    await prisma.website.update({
      where: { id: website.id },
      data: {
        status: newStatus,
        lastChecked: new Date(),
        responseTime: responseTime
      }
    });

    if (!isUp) {
      await handleDowntime(website.id, `HTTP ${response.status}`);
    } else {
      await handleUptime(website.id);
    }

  } catch (error) {
    console.error(`Error checking ${website.name}:`, error.message);

    const newStatus = 'down';
    const previousStatus = statusCache.get(website.id) || 'unknown';

    if (newStatus === 'down' && previousStatus !== 'down') {
      console.log(`🔔 Alert: ${website.name} went down`);
      // await sendEmailAlert(
      //   website.email,
      //   `🚨 ${website.name} is DOWN`,
      //   `URL: ${website.url} went down at ${new Date().toLocaleString()}`
      // );
    }
    updateStatusTicks(website.id, false);


    statusCache.set(website.id, newStatus);

    await prisma.website.update({
      where: { id: website.id },
      data: {
        status: 'down',
        lastChecked: new Date(),
        responseTime: null
      }
    });

    await handleDowntime(website.id, error.message);
  }
}


async function handleDowntime(websiteId, reason) {
  // Check if there's an ongoing downtime log
  const ongoingDowntime = await prisma.downtimeLog.findFirst({
    where: {
      websiteId,
      endTime: null
    }
  });

  // If no ongoing downtime, create a new log
  if (!ongoingDowntime) {
    await prisma.downtimeLog.create({
      data: {
        websiteId,
        startTime: new Date(),
        reason
      }
    });

    await prisma.website.update({
      where: { id: websiteId },
      data: { lastDowntime: new Date() }
    });


  }
}

async function handleUptime(websiteId) {
  // Close any ongoing downtime logs
  const ongoingDowntime = await prisma.downtimeLog.findFirst({
    where: {
      websiteId,
      endTime: null
    }
  });

  if (ongoingDowntime) {
    await prisma.downtimeLog.update({
      where: { id: ongoingDowntime.id },
      data: { endTime: new Date() }



    });
  }
}

// Monitor all active websites every 2 seconds in parallel
setInterval(async () => {
  try {
    const activeWebsites = await prisma.website.findMany({
      where: { isActive: true }
    });

    // Check all websites in parallel
    await Promise.all(
      activeWebsites.map(async (website) => {
        try {
          await checkWebsite(website);
        } catch (err) {
          console.error(`Error checking ${website.name}:`, err.message);
        }
      })
    );
  } catch (error) {
    console.error('Error in monitoring loop:', error.message);
  }
}, 60 * 1000); // <-- every 2 seconds

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Monitoring service started - checking websites every 1 minute');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});