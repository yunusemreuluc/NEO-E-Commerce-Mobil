// neo-backend/src/routes/ai.ts
import express, { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../db';
import { parseUserQueryWithOllama } from '../services/ollamaService';

const router = express.Router();

interface AISearchRequest {
  query: string;
  user_id?: number;
}

// Gemini ile akıllı ürün arama
async function searchProductsWithGemini(parsedQuery: any): Promise<any[]> {
  try {
    console.log('🤖 Gemini analiz sonucu:', parsedQuery);
    
    let sql = `
      SELECT 
        p.id, p.name, p.price, p.old_price, p.image_url, p.brand, 
        p.description, p.short_description, p.discount_percentage, p.category_id
      FROM products p
      WHERE p.is_active = 1
    `;
    
    const queryParams: any[] = [];
    
    // Akıllı fiyat filtresi
    if (parsedQuery.priceFilter) {
      const pf = parsedQuery.priceFilter;
      
      switch (pf.type) {
        case 'under':
          sql += ' AND p.price <= ?';
          queryParams.push(pf.max);
          break;
        case 'over':
          sql += ' AND p.price >= ?';
          queryParams.push(pf.max);
          break;
        case 'between':
          sql += ' AND p.price BETWEEN ? AND ?';
          queryParams.push(pf.min, pf.max);
          break;
        case 'exact':
          // ±%20 tolerans
          const tolerance = pf.value * 0.2;
          sql += ' AND p.price BETWEEN ? AND ?';
          queryParams.push(pf.value - tolerance, pf.value + tolerance);
          break;
      }
    }
    
    sql += ' ORDER BY p.id DESC LIMIT 20';
    
    console.log('📝 SQL:', sql);
    console.log('📊 Params:', queryParams);
    
    const [rows] = await db.execute<RowDataPacket[]>(sql, queryParams);
    console.log('✅ DB\'den gelen ürün sayısı:', rows.length);
    
    // Client-side filtreleme - Kategori önce
    let filteredRows = [...rows];
    let hasAnyFilter = false;
    
    // Kategori filtresi (ana filtre) - Önce bu çalışsın
    if (parsedQuery.category) {
      
      // "Genel" kategorisi için özel durum - tüm ürünleri döndür
      if (parsedQuery.category === 'genel') {
        // Sadece fiyat filtresi varsa onu uygula, yoksa tüm ürünleri döndür
        // filteredRows zaten tüm ürünleri içeriyor
      } else {
        filteredRows = filteredRows.filter(product => {
          const productText = (product.name || '').toLowerCase();
          const descText = (product.description || '').toLowerCase();
          const brandText = (product.brand || '').toLowerCase();
          
          // Kategori eşleştirme tablosu
          const categoryMatches: { [key: string]: string[] } = {
            'telefon': ['iphone', 'phone', 'telefon', 'samsung', 'xiaomi', 'huawei'],
            'bilgisayar': ['notebook', 'laptop', 'bilgisayar', 'macbook', 'pc'],
            'televizyon': ['televizyon', 'tv', 'qled', 'led', 'oled'],
            'kulaklık': ['kulaklık', 'headphone', 'bluetooth'],
            'saat': ['saat', 'watch'],
            'şarj': ['powerbank', 'şarj', 'power'],
            'yazıcı': ['yazıcı', 'printer', 'epson'],
            'kitap': ['kitap', 'yayın'],
            'mobilya': ['mobilya', 'masa', 'sandalye', 'sofrası'],
            'avize': ['avize', 'lamba', 'led']
          };
          
          const searchTerms = categoryMatches[parsedQuery.category] || [parsedQuery.category];
          const allText = `${productText} ${descText} ${brandText}`;
          
          const matches = searchTerms.some((term: string) => allText.includes(term));
          return matches;
        });
      }
      
      hasAnyFilter = true;
    }
    
    // Anahtar kelime filtresi (ek filtre) - Sadece kategori bulamazsa
    if (parsedQuery.keywords && parsedQuery.keywords.length > 0 && filteredRows.length === 0) {
      filteredRows = [...rows].filter(product => {
        const searchText = [
          product.name || '',
          product.description || '',
          product.brand || ''
        ].join(' ').toLowerCase();
        
        return parsedQuery.keywords.some((keyword: string) => 
          keyword.length > 2 && searchText.includes(keyword.toLowerCase())
        );
      });
      hasAnyFilter = true;
    }
    
    // Marka filtresi (ek filtre)
    if (parsedQuery.brand) {
      filteredRows = filteredRows.filter(product => {
        const brandText = (product.brand || '').toLowerCase();
        return brandText.includes(parsedQuery.brand.toLowerCase());
      });
      hasAnyFilter = true;
    }
    
    // Renk filtresi (ek filtre)
    if (parsedQuery.color) {
      filteredRows = filteredRows.filter(product => {
        const searchText = [
          product.name || '',
          product.description || ''
        ].join(' ').toLowerCase();
        return searchText.includes(parsedQuery.color.toLowerCase());
      });
      hasAnyFilter = true;
    }
    
    // Eğer hiç filtre uygulanmadıysa ve arama terimi varsa, boş döndür
    if (!hasAnyFilter && (parsedQuery.keywords?.length > 0 || parsedQuery.category || parsedQuery.brand || parsedQuery.color)) {
      filteredRows = [];
    }
    
    console.log('🎯 Filtrelenmiş ürün sayısı:', filteredRows.length);
    return filteredRows.slice(0, 10);
    
  } catch (error) {
    console.error('❌ Gemini arama hatası:', error);
    return [];
  }
}

// AI yanıt oluştur (Akıllı Öneriler ile)
function generateAIResponseWithGemini(query: string, parsedQuery: any, products: any[]): string {
  let response = '';
  
  // Özel durum: "Pahalı" veya "ucuz" ama ürün yok
  if (products.length === 0) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('pahalı') || lowerQuery.includes('pahali') || lowerQuery.includes('expensive')) {
      response += `💰 "${query}" için fiyat aralığı önerileri:\n\n`;
      response += `🔥 Premium Seçenekler:\n`;
      response += `• 5000-10000 TL: Orta segment kaliteli ürünler\n`;
      response += `• 10000-20000 TL: Yüksek performans ürünleri\n`;
      response += `• 20000+ TL: En üst segment ürünler\n\n`;
      response += `💡 Öneri: "10000 TL üstü ${parsedQuery.category || 'ürün'}" şeklinde arama yapın!`;
      return response;
    }
    
    if (lowerQuery.includes('ucuz') || lowerQuery.includes('uygun') || lowerQuery.includes('ekonomik')) {
      response += `💰 "${query}" için uygun fiyat aralığı önerileri:\n\n`;
      response += `💚 Ekonomik Seçenekler:\n`;
      response += `• 500-1000 TL: Giriş seviyesi ürünler\n`;
      response += `• 1000-2500 TL: Orta kalite ürünler\n`;
      response += `• 2500-5000 TL: İyi kalite ürünler\n\n`;
      response += `💡 Öneri: "2000 TL altı ${parsedQuery.category || 'ürün'}" şeklinde arama yapın!`;
      return response;
    }
    
    // Normal "ürün bulunamadı" mesajı
    response += `😔 "${query}" için ürün bulamadım.\n\n`;
    response += `💡 Öneriler:\n`;
    response += `• Farklı fiyat aralığı deneyin\n`;
    response += `• Kategori adını değiştirin\n`;
    response += `• Daha genel terimler kullanın`;
    return response;
  }
  
  // Ürün bulundu durumu
  if (products.length > 0) {
    response += `🎯 "${query}" aramanız için ${products.length} ürün buldum!\n\n`;
    
    // Fiyat filtresi açıklaması
    if (parsedQuery.priceFilter) {
      const pf = parsedQuery.priceFilter;
      switch (pf.type) {
        case 'under':
          response += `💰 ${pf.max} TL altındaki ürünler:\n`;
          break;
        case 'over':
          response += `💰 ${pf.max} TL üstündeki ürünler:\n`;
          break;
        case 'between':
          response += `💰 ${pf.min}-${pf.max} TL arasındaki ürünler:\n`;
          break;
        case 'exact':
          response += `💰 ${pf.value} TL civarındaki ürünler:\n`;
          break;
      }
    }
    
    // İlk 3 ürünü listele
    products.slice(0, 3).forEach((product, index) => {
      const price = Number(product.price);
      const oldPrice = product.old_price ? Number(product.old_price) : null;
      
      response += `${index + 1}. ${product.name} - `;
      
      if (oldPrice && oldPrice > price) {
        response += `~~${oldPrice} TL~~ ${price} TL`;
        if (product.discount_percentage) {
          response += ` (${product.discount_percentage}% indirim!)`;
        }
      } else {
        response += `${price} TL`;
      }
      response += '\n';
    });
    
    if (products.length > 3) {
      response += `\n+${products.length - 3} ürün daha var!\n`;
    }
  } else {
    response += `😔 "${query}" için ürün bulamadım.\n\n`;
    response += `💡 Öneriler:\n`;
    response += `• Farklı fiyat aralığı deneyin\n`;
    response += `• Kategori adını değiştirin\n`;
    response += `• Daha genel terimler kullanın`;
    return response;
  }
  
  response += '\n📱 Ürünlere tıklayarak detaylarını inceleyebilir ve sepete ekleyebilirsiniz!';
  return response;
}

// AI arama endpoint'i (Basit Fallback ile)
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query }: AISearchRequest = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Arama sorgusu gerekli'
      });
    }
    
    console.log('🤖 Ollama AI Arama:', query);
    
    // Ollama ile sorguyu analiz et (önce Ollama dene)
    let parsedQuery;
    try {
      parsedQuery = await parseUserQueryWithOllama(query);
      console.log('📊 Ollama analiz sonucu:', parsedQuery);
    } catch (error) {
      console.log('⚠️ Ollama başarısız, fallback kullanılıyor');
      parsedQuery = parseQueryFallback(query);
      console.log('📊 Fallback analiz sonucu:', parsedQuery);
    }
    
    // Akıllı ürün arama
    const products = await searchProductsWithGemini(parsedQuery);
    console.log('🎯 Bulunan ürün sayısı:', products.length);
    
    // Ürünleri frontend formatına çevir
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      oldPrice: product.old_price ? Number(product.old_price) : undefined,
      image: product.image_url || 'https://via.placeholder.com/300x300?text=NEO',
      category: 'Genel',
      description: product.description,
      rating: 4.5,
      reviewCount: Math.floor(Math.random() * 100) + 10,
    }));
    
    // AI yanıtı oluştur
    const aiResponse = generateAIResponseWithGemini(query, parsedQuery, products);
    
    res.json({
      success: true,
      data: {
        ai_response: aiResponse,
        products: formattedProducts,
        analysis: parsedQuery,
        ai_used: parsedQuery.ai_used || false,
        total_results: products.length
      }
    });
    
  } catch (error) {
    console.error('AI arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'AI arama sırasında bir hata oluştu'
    });
  }
});

interface ParsedQuery {
  priceFilter: {
    type: 'exact' | 'under' | 'over' | 'between';
    min?: number;
    max?: number;
    value?: number;
  } | null;
  category: string | null;
  brand: string | null;
  color: string | null;
  keywords: string[];
  intent: string;
  ai_used: boolean;
}

// Basit parsing fonksiyonu (Gemini olmadan)
function parseQueryFallback(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  
  // Gelişmiş fiyat analizi
  let priceFilter = null;
  const priceMatches = query.match(/(\d+)\s*(tl|lira|₺)/gi);
  
  if (priceMatches) {
    const price = parseInt(priceMatches[0].replace(/[^\d]/g, ''));
    
    // Önce "üstü/üzeri" kontrol et (Türkçe karakter sorunları için alternatifler)
    if (lowerQuery.includes('üstü') || lowerQuery.includes('üzeri') || lowerQuery.includes('fazla') || 
        lowerQuery.includes('yukarı') || lowerQuery.includes('ust') || lowerQuery.includes('�st�') ||
        lowerQuery.includes('uzeri') || lowerQuery.includes('�zeri')) {
      priceFilter = { type: 'over' as const, max: price };
    } 
    // Sonra "altı/az" kontrol et (Türkçe karakter sorunları için alternatifler)
    else if (lowerQuery.includes('altı') || lowerQuery.includes('az') || lowerQuery.includes('aşağı') || 
             lowerQuery.includes('düşük') || lowerQuery.includes('alti') || lowerQuery.includes('�lti') ||
             lowerQuery.includes('asagi') || lowerQuery.includes('dusuk')) {
      priceFilter = { type: 'under' as const, max: price };
    } 
    // Aralık kontrolü
    else if (lowerQuery.includes('arası') || lowerQuery.includes('-') || lowerQuery.includes('ile')) {
      const allPrices = query.match(/(\d+)/g);
      if (allPrices && allPrices.length >= 2) {
        const min = parseInt(allPrices[0]);
        const max = parseInt(allPrices[1]);
        priceFilter = { type: 'between' as const, min, max };
      }
    } 
    // Varsayılan: yaklaşık fiyat (±%20)
    else {
      priceFilter = { type: 'exact' as const, value: price };
    }
  }
  
  // Fiyat ipuçları (pahalı, ucuz, vs.) - Türkçe karakter sorunları için alternatifler
  if (lowerQuery.includes('pahalı') || lowerQuery.includes('pahali') || lowerQuery.includes('expensive') ||
      lowerQuery.includes('pahali') || lowerQuery.includes('�ahali')) {
    // Eğer fiyat belirtilmemişse, yüksek fiyat filtresi ekle
    if (!priceFilter) {
      priceFilter = { type: 'over' as const, max: 3000 }; // 3000 TL üstü = pahalı
    }
  }
  
  if (lowerQuery.includes('ucuz') || lowerQuery.includes('cheap') || lowerQuery.includes('uygun') ||
      lowerQuery.includes('ucuz') || lowerQuery.includes('�cuz')) {
    // Eğer fiyat belirtilmemişse, düşük fiyat filtresi ekle
    if (!priceFilter) {
      priceFilter = { type: 'under' as const, max: 1000 }; // 1000 TL altı = ucuz
    }
  }
  
  // Gelişmiş kategori belirleme
  const categories = {
    'telefon': ['telefon', 'phone', 'iphone', 'samsung', 'xiaomi', 'huawei', 'akıllı telefon'],
    'bilgisayar': ['bilgisayar', 'laptop', 'notebook', 'macbook', 'pc', 'computer'],
    'televizyon': ['televizyon', 'tv', 'smart tv', 'led', 'qled', 'oled'],
    'kulaklık': ['kulaklık', 'headphone', 'earphone', 'bluetooth kulaklık'],
    'saat': ['saat', 'watch', 'akıllı saat', 'smart watch'],
    'şarj': ['şarj', 'powerbank', 'power bank', 'şarj cihazı', 'pil'],
    'yazıcı': ['yazıcı', 'printer', 'tarayıcı', 'scanner'],
    'kitap': ['kitap', 'book', 'roman', 'yayın'],
    'mobilya': ['mobilya', 'masa', 'sandalye', 'dolap', 'koltuk'],
    'avize': ['avize', 'lamba', 'aydınlatma', 'led']
  };
  
  let category = null;
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  // Renk ve marka
  const colors = ['siyah', 'beyaz', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'pembe', 'mor', 'gri', 'kahverengi'];
  const color = colors.find(c => lowerQuery.includes(c)) || null;
  
  const brands = ['apple', 'samsung', 'xiaomi', 'huawei', 'nike', 'adidas', 'beko', 'casper', 'epson', 'anker'];
  const brand = brands.find(b => lowerQuery.includes(b)) || null;
  
  return {
    priceFilter,
    category,
    brand,
    color,
    keywords: query.split(' ').filter(w => w.length > 2),
    intent: query,
    ai_used: false
  };
}

// Test endpoint'i
router.get('/test', async (_req: Request, res: Response) => {
  try {
    const [products] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
    );
    
    // İlk 3 ürünü de getir
    const [sampleProducts] = await db.execute<RowDataPacket[]>(
      'SELECT id, name, brand FROM products WHERE is_active = 1 LIMIT 3'
    );
    
    res.json({
      success: true,
      message: 'AI sistemi çalışıyor',
      data: {
        active_products: products[0].count,
        sample_products: sampleProducts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test endpoint hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı bağlantı hatası',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

// Debug endpoint - basit ürün listesi
router.get('/debug-products', async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT p.id, p.name, p.brand, p.category_id, p.price 
       FROM products p 
       WHERE p.is_active = 1 LIMIT 10`
    );
    
    // Ürün isimlerini de göster
    const productNames = rows.map(p => p.name);
    
    res.json({
      success: true,
      data: {
        products: rows,
        product_names: productNames,
        count: rows.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

// Debug parsing endpoint
router.post('/debug-parse', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const parsed = parseQueryFallback(query);
    
    res.json({
      success: true,
      data: {
        original_query: query,
        parsed_result: parsed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

export default router;