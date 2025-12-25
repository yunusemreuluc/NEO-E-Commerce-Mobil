// neo-admin/src/config/api.ts - Admin Panel API Konfigürasyonu
export const API_CONFIG = {
  // Ana IP adresi - sadece burayı değiştir!
  BASE_IP: '10.241.81.212',
  PORT: '4000',
  
  // Otomatik URL oluşturma
  get BASE_URL() {
    return `http://${this.BASE_IP}:${this.PORT}/api`;
  }
};

// Admin panel için API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || API_CONFIG.BASE_URL;
export default API_CONFIG;