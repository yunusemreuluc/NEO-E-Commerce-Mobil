// config/api.ts - Merkezi API Konfigürasyonu
export const API_CONFIG = {
  // Ana IP adresi - sadece burayı değiştir!
  BASE_IP: '10.77.252.212',
  PORT: '4000',
  
  // Otomatik URL oluşturma
  get BASE_URL() {
    return `http://${this.BASE_IP}:${this.PORT}`;
  },
  
  // Farklı ortamlar için
  get ENVIRONMENTS() {
    return {
      development: `http://${this.BASE_IP}:${this.PORT}`,
      production: 'https://api.neoapp.com', // Canlı ortam için
      local: 'http://localhost:4000'
    };
  },
  
  // Mevcut ortamı belirle
  get CURRENT_URL() {
    // Environment variable varsa onu kullan, yoksa development
    const env = process.env.NODE_ENV || 'development';
    return this.ENVIRONMENTS[env as keyof typeof this.ENVIRONMENTS] || this.BASE_URL;
  }
};

// Kolay kullanım için export
export const API_BASE_URL = API_CONFIG.CURRENT_URL;
export default API_CONFIG;