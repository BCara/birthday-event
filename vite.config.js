import { defineConfig } from 'vite';
import os from 'os';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    // Skip virtual, vpn, and loopback interfaces
    if (
      lowerName.includes('virtual') ||
      lowerName.includes('vmware') ||
      lowerName.includes('vbox') ||
      lowerName.includes('tailscale') ||
      lowerName.includes('vpn') ||
      lowerName.includes('pseudo')
    ) {
      continue;
    }
    
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }
  
  // Prioritize physical adapters like Ethernet or Wi-Fi
  const preferred = candidates.find(c => {
    const name = c.name.toLowerCase();
    return (
      name.includes('ethernet') ||
      name.includes('wi-fi') ||
      name.includes('wifi') ||
      name.includes('wireless') ||
      name.includes('lan')
    );
  });
  
  if (preferred) {
    return preferred.address;
  }
  
  if (candidates.length > 0) {
    return candidates[0].address;
  }
  
  return 'localhost';
}

export default defineConfig({
  server: {
    host: true // Expose the server to the local network automatically
  },
  define: {
    'import.meta.env.VITE_DEV_IP': JSON.stringify(getLocalIp())
  }
});
