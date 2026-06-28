// Geo-Blocking Bypass Module
// Provides alternative streaming methods to bypass geographic restrictions

const GeoBypass = (function() {
  // Proxy services that can bypass geo-blocking
  const proxyServices = [
    {
      name: 'CORS Proxy 1',
      format: 'https://cors-anywhere.herokuapp.com/',
      prefix: true
    },
    {
      name: 'Cloudflare Worker',
      format: 'https://api.allorigins.win/raw?url=',
      prefix: true
    },
    {
      name: 'Worker Bypass',
      format: 'https://worker-bypass.herokuapp.com/?url=',
      prefix: true
    },
    {
      name: 'Direct Stream',
      format: null,
      prefix: false
    }
  ];

  // List of known geo-restricted domains
  const geoRestrictedDomains = [
    'bbc.co.uk',
    'youtube.com',
    'netflix.com',
    'hotstar.com',
    'zee.com',
    'sony.com',
    'discovery.com'
  ];

  /**
   * Check if URL is geo-restricted
   */
  function isGeoRestricted(url) {
    if (!url) return false;
    return geoRestrictedDomains.some(domain => url.includes(domain));
  }

  /**
   * Get user's approximate country based on IP
   */
  async function detectCountry() {
    try {
      const response = await fetch('https://ipapi.co/json/', { mode: 'no-cors' });
      const data = await response.json();
      return data.country_code || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate bypassed URL using proxy service
   */
  function generateBypassedUrl(originalUrl, proxyIndex = 0) {
    if (proxyIndex >= proxyServices.length) {
      return originalUrl; // fallback to original
    }

    const proxy = proxyServices[proxyIndex];
    
    if (!proxy.format) {
      return originalUrl;
    }

    try {
      if (proxy.prefix) {
        return proxy.format + encodeURIComponent(originalUrl);
      } else {
        return proxy.format + originalUrl;
      }
    } catch (e) {
      console.warn(`Failed to generate bypass URL with proxy ${proxy.name}`, e);
      return generateBypassedUrl(originalUrl, proxyIndex + 1);
    }
  }

  /**
   * Test if a URL is accessible
   */
  async function testUrlAccess(url, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Find working proxy for a URL
   */
  async function findWorkingProxy(originalUrl) {
    console.log(`[GeoBypass] Finding working proxy for: ${originalUrl}`);

    // Test original URL first
    if (await testUrlAccess(originalUrl)) {
      console.log(`[GeoBypass] Original URL is accessible`);
      return { url: originalUrl, proxy: 'direct', working: true };
    }

    // Try each proxy service
    for (let i = 0; i < proxyServices.length; i++) {
      const bypassUrl = generateBypassedUrl(originalUrl, i);
      if (bypassUrl === originalUrl) continue; // skip if same as original

      console.log(`[GeoBypass] Testing proxy: ${proxyServices[i].name}`);
      
      if (await testUrlAccess(bypassUrl)) {
        console.log(`[GeoBypass] Working proxy found: ${proxyServices[i].name}`);
        return {
          url: bypassUrl,
          proxy: proxyServices[i].name,
          working: true
        };
      }
    }

    // Return original as fallback
    return {
      url: originalUrl,
      proxy: 'none',
      working: false
    };
  }

  /**
   * Enable VPN mode indicator
   */
  function enableVpnMode() {
    const banner = document.createElement('div');
    banner.id = 'vpn-mode-banner';
    banner.style.cssText = `
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #1a5f1a 0%, #2d8a2d 100%);
      color: #fff;
      padding: 8px 16px;
      text-align: center;
      font-family: 'Rajdhani', sans-serif;
      font-size: 0.85rem;
      letter-spacing: 1px;
      border-bottom: 2px solid #00ff00;
      box-shadow: 0 2px 8px rgba(0, 255, 0, 0.3);
      z-index: 99;
      animation: vpnPulse 2s infinite;
    `;
    banner.innerHTML = '🔒 GEO-BYPASS ACTIVE | Routing through secure proxy...';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes vpnPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(banner, document.body.firstChild);

    return banner;
  }

  /**
   * Apply bypass to a channel
   */
  async function bypassChannel(channel) {
    if (!channel || !channel.url) {
      return channel;
    }

    const isRestricted = isGeoRestricted(channel.url);
    
    if (isRestricted) {
      console.log(`[GeoBypass] Channel "${channel.name}" appears geo-restricted`);
      const result = await findWorkingProxy(channel.url);
      
      return {
        ...channel,
        original_url: channel.url,
        url: result.url,
        proxy_method: result.proxy,
        geo_bypass: true,
        working: result.working
      };
    }

    return channel;
  }

  /**
   * Batch bypass multiple channels
   */
  async function bypassChannels(channelsArray) {
    const bypassed = [];
    
    for (const channel of channelsArray) {
      const bypassedChannel = await bypassChannel(channel);
      bypassed.push(bypassedChannel);
    }
    
    return bypassed;
  }

  /**
   * Get bypass status UI element
   */
  function getBypassStatusElement(channel) {
    if (!channel.geo_bypass) return null;

    const status = document.createElement('div');
    status.className = 'geo-bypass-status';
    status.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 255, 0, 0.8);
      color: #000;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.65rem;
      font-weight: 600;
      font-family: 'Rajdhani', sans-serif;
      letter-spacing: 1px;
    `;
    status.textContent = '🔓 BYPASS';
    
    return status;
  }

  // Public API
  return {
    isGeoRestricted,
    detectCountry,
    generateBypassedUrl,
    testUrlAccess,
    findWorkingProxy,
    enableVpnMode,
    bypassChannel,
    bypassChannels,
    getBypassStatusElement,
    proxyServices
  };
})();

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeoBypass;
}
