// neo-backend/src/config/api.ts - Backend API Konfigürasyonu
export const API_CONFIG = {
  // Ana IP adresi - sadece burayı değiştir!
  BASE_IP: '10.241.81.212',
  PORT: '4000',
  
  // Otomatik URL oluşturma
  get BASE_URL() {
    return `http://${this.BASE_IP}:${this.PORT}`;
  }
};

// Backend için API URL
export const API_BASE_URL = API_CONFIG.BASE_URL;
export default API_CONFIG;