// neo-backend/src/services/ollamaService.ts
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

export async function parseUserQueryWithOllama(query: string): Promise<ParsedQuery> {
  try {
    const prompt = `
Sen bir e-ticaret arama asistanısın. Kullanıcının Türkçe sorgusunu analiz et ve sadece JSON formatında döndür.

Sorgu: "${query}"

Kurallar:
- Sadece JSON döndür, başka açıklama yapma
- Türkçe karakterleri doğru tanı (ü, ö, ç, ş, ğ, ı)
- Fiyat filtreleri: "üstü/üzeri" = over, "altı/aşağı" = under
- Kategoriler: telefon, bilgisayar, televizyon, kulaklık, saat, şarj, yazıcı, kitap, mobilya, avize

JSON formatı:
{
  "priceFilter": {
    "type": "exact|under|over|between",
    "min": sayı,
    "max": sayı,
    "value": sayı
  },
  "category": "kategori_adı_veya_null",
  "brand": "marka_adı_veya_null",
  "color": "renk_adı_veya_null", 
  "keywords": ["anahtar", "kelimeler"],
  "intent": "kullanıcının_ne_aradığının_özeti"
}
`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.response;
    
    console.log('🤖 Ollama yanıtı:', aiResponse);
    
    // JSON'u parse et - daha güçlü parsing
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Alternatif: sadece { ile başlayan kısmı al
      const startIndex = aiResponse.indexOf('{');
      const endIndex = aiResponse.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonMatch = [aiResponse.substring(startIndex, endIndex + 1)];
      }
    }
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.ai_used = true;
        console.log('✅ Ollama başarılı:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse hatası:', parseError);
        throw new Error('JSON parse edilemedi');
      }
    }
    
    throw new Error('JSON bulunamadı');
  } catch (error) {
    console.error('Ollama hatası:', error);
    // Fallback
    return parseQueryFallback(query);
  }
}

// Fallback fonksiyonu (Ollama başarısız olursa)
function parseQueryFallback(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  
  // Gelişmiş fiyat analizi
  let priceFilter = null;
  const priceMatches = query.match(/(\d+)\s*(tl|lira|₺)/gi);
  
  if (priceMatches) {
    const price = parseInt(priceMatches[0].replace(/[^\d]/g, ''));
    
    if (lowerQuery.includes('üstü') || lowerQuery.includes('üzeri') || lowerQuery.includes('fazla') || 
        lowerQuery.includes('yukarı') || lowerQuery.includes('ust') || lowerQuery.includes('�st�') ||
        lowerQuery.includes('uzeri') || lowerQuery.includes('�zeri')) {
      priceFilter = { type: 'over' as const, max: price };
    } 
    else if (lowerQuery.includes('altı') || lowerQuery.includes('az') || lowerQuery.includes('aşağı') || 
             lowerQuery.includes('düşük') || lowerQuery.includes('alti') || lowerQuery.includes('�lti') ||
             lowerQuery.includes('asagi') || lowerQuery.includes('dusuk')) {
      priceFilter = { type: 'under' as const, max: price };
    } 
    else if (lowerQuery.includes('arası') || lowerQuery.includes('-') || lowerQuery.includes('ile')) {
      const allPrices = query.match(/(\d+)/g);
      if (allPrices && allPrices.length >= 2) {
        const min = parseInt(allPrices[0]);
        const max = parseInt(allPrices[1]);
        priceFilter = { type: 'between' as const, min, max };
      }
    } 
    else {
      priceFilter = { type: 'exact' as const, value: price };
    }
  }
  
  // Gelişmiş kategori belirleme
  const categories = {
    'telefon': ['telefon', 'phone', 'iphone', 'samsung', 'xiaomi', 'huawei', 'akıllı telefon', 'cep telefonu'],
    'bilgisayar': ['bilgisayar', 'laptop', 'notebook', 'macbook', 'pc', 'computer', 'gaming pc'],
    'televizyon': ['televizyon', 'tv', 'smart tv', 'led tv', 'qled', 'oled', 'ekran'],
    'kulaklık': ['kulaklık', 'headphone', 'earphone', 'bluetooth kulaklık', 'kablosuz kulaklık'],
    'saat': ['saat', 'watch', 'akıllı saat', 'smart watch', 'apple watch'],
    'şarj': ['şarj', 'powerbank', 'power bank', 'şarj cihazı', 'pil', 'batarya'],
    'yazıcı': ['yazıcı', 'printer', 'tarayıcı', 'scanner', 'çok fonksiyonlu'],
    'kitap': ['kitap', 'book', 'roman', 'yayın', 'edebiyat'],
    'mobilya': ['mobilya', 'masa', 'sandalye', 'dolap', 'koltuk', 'sofrası', 'dekorasyon'],
    'avize': ['avize', 'lamba', 'aydınlatma', 'led avize', 'tavan lambası']
  };
  
  let category = null;
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  // "Eşya" kelimesi için özel durum - tüm kategorilerde ara
  if (lowerQuery.includes('eşya') || lowerQuery.includes('esya') || lowerQuery.includes('ürün') || lowerQuery.includes('urun')) {
    category = 'genel'; // Özel kategori
  }
  
  // Gelişmiş renk ve marka
  const colors = ['siyah', 'beyaz', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'pembe', 'mor', 'gri', 'kahverengi', 'turuncu'];
  const color = colors.find(c => lowerQuery.includes(c)) || null;
  
  const brands = ['apple', 'samsung', 'xiaomi', 'huawei', 'nike', 'adidas', 'beko', 'casper', 'epson', 'anker', 'lg', 'sony'];
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