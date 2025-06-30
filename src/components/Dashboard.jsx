import React from 'react';
import WebsiteCard from './WebsiteCard';
import { Globe, Zap, TrendingUp } from 'lucide-react';

function Dashboard({ websites, onEditWebsite, onDeleteWebsite }) {
  if (websites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-lg mx-auto">
          <div className="glass-card rounded-3xl p-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center floating-animation">
                <Globe className="h-12 w-12 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No websites to monitor</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Get started by adding your first website to monitor its uptime, performance, and availability in real-time.</p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Performance tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Monitored Websites</h2>
            <p className="text-gray-600">Currently monitoring <span className="font-semibold text-blue-600">{websites.length}</span> websites with real-time updates</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live monitoring active</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {websites.map((website) => (
          <WebsiteCard
            key={website.id}
            website={website}
            onEdit={() => onEditWebsite(website)}
            onDelete={() => onDeleteWebsite(website.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;