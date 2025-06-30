import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWebsiteModal from './components/AddWebsiteModal';
import EditWebsiteModal from './components/EditWebsiteModal';
import { Plus, Activity, Globe, RefreshCw, Zap, TrendingUp, Shield } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

function App() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWebsites();
    // Refresh data every 2 seconds
    const interval = setInterval(fetchWebsites, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchWebsites = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/websites`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWebsites(data);
    } catch (error) {
      console.error('Error fetching websites:', error);
      setError('Failed to fetch websites. Please check if the server is running.');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchWebsites(true);
  };

  const handleAddWebsite = async (websiteData) => {
    try {
      const response = await fetch(`${API_BASE}/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(websiteData)
      });

      if (response.ok) {
        await fetchWebsites();
        setShowAddModal(false);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to add website' };
      }
    } catch (error) {
      console.error('Error adding website:', error);
      return { success: false, error: 'Failed to add website' };
    }
  };

  const handleEditWebsite = async (id, websiteData) => {
    try {
      const response = await fetch(`${API_BASE}/websites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(websiteData)
      });

      if (response.ok) {
        await fetchWebsites();
        setEditingWebsite(null);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update website' };
      }
    } catch (error) {
      console.error('Error updating website:', error);
      return { success: false, error: 'Failed to update website' };
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (window.confirm('Are you sure you want to delete this website? This will also delete all associated downtime logs.')) {
      try {
        const response = await fetch(`${API_BASE}/websites/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchWebsites();
        } else {
          alert('Failed to delete website');
        }
      } catch (error) {
        console.error('Error deleting website:', error);
        alert('Failed to delete website');
      }
    }
  };

  const upWebsites = websites.filter(w => w.status === 'up').length;
  const downWebsites = websites.filter(w => w.status === 'down').length;
  const unknownWebsites = websites.filter(w => w.status === 'unknown').length;
  const avgUptime = websites.length > 0 ? websites.reduce((acc, w) => acc + (w.uptimePercentage || 0), 0) / websites.length : 0;
  const avgResponseTime = websites.length > 0 ? websites.reduce((acc, w) => acc + (w.responseTime || 0), 0) / websites.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading dashboard<span className="loading-dots"></span></p>
          <div className="mt-2 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="glass-card rounded-3xl p-8">
            <div className="text-red-500 mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Connection Error</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={handleRefresh}
              className="modern-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg floating-animation">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Uptime Monitor</h1>
                <p className="text-sm text-gray-500 font-medium">Real-time website monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {/* Stats Overview */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-xl">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold">{upWebsites} Online</span>
                </div>
                <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-xl">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">{downWebsites} Offline</span>
                </div>
                {unknownWebsites > 0 && (
                  <div className="flex items-center space-x-3 bg-yellow-50 px-4 py-2 rounded-xl">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700 font-semibold">{unknownWebsites} Unknown</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-semibold">{websites.length} Total</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50 group"
                  title="Refresh"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                </button>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="modern-button"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Website
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {websites.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Uptime</p>
                  <p className="text-3xl font-bold text-green-600">{avgUptime.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-blue-600">{Math.round(avgResponseTime)}ms</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-3xl font-bold text-orange-600">{websites.reduce((acc, w) => acc + (w.downtimeCount || 0), 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monitored Sites</p>
                  <p className="text-3xl font-bold text-purple-600">{websites.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Dashboard 
          websites={websites}
          onEditWebsite={setEditingWebsite}
          onDeleteWebsite={handleDeleteWebsite}
        />
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddWebsiteModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddWebsite}
        />
      )}

      {editingWebsite && (
        <EditWebsiteModal
          website={editingWebsite}
          onClose={() => setEditingWebsite(null)}
          onSubmit={(data) => handleEditWebsite(editingWebsite.id, data)}
        />
      )}
    </div>
  );
}

export default App;