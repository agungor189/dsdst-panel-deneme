// server/utils/normalizeProductFields.ts

export function normalizeMaterial(material: string | null | undefined, product?: any): string | null {
  const checkStr = [material, product?.material, product?.category, product?.name, product?.title].filter(Boolean).join(' ').toLowerCase();

  if (checkStr.includes('alumin') || checkStr.includes('alümin')) return 'Alüminyum';
  if (checkStr.includes('cast iron') || checkStr.includes('demir döküm') || checkStr.includes('iron') || checkStr.includes('demir')) return 'Demir Döküm';
  if (checkStr.includes('carbon steel') || checkStr.includes('karbon çelik') || checkStr.includes('steel') || checkStr.includes('çelik')) return 'Karbon Çelik';
  if (checkStr.includes('ppr') || checkStr.includes('plastik') || checkStr.includes('plastic')) return 'PPR';

  return material || null;
}

export function normalizeModel(model: string | null | undefined, product?: any): string | null {
  const checkStr = [model, product?.model, product?.name, product?.title].filter(Boolean).join(' ').toLowerCase();
  
  if (checkStr.includes('5 yollu') || checkStr.includes('5 way')) return '5 Way';
  if (checkStr.includes('6 yollu') || checkStr.includes('6 way')) return '6 Way';
  if (checkStr.includes('büyük 4 yollu') || checkStr.includes('big 4 way')) return 'Big 4 Way';
  if (checkStr.includes('4 yollu') || checkStr.includes('4 way') || checkStr.includes('4-way')) return '4 Way';
  if (checkStr.includes('3 yollu') || checkStr.includes('3 way') || checkStr.includes('3-way')) return '3 Way';
  if (checkStr.includes('uzun t') || checkStr.includes('long tee')) return 'Long Tee';
  if (checkStr.includes('45°') || checkStr.includes('45 derece')) return '45° Tee';
  if (checkStr === 't' || checkStr === 'tee' || checkStr.includes('t bağlantı') || checkStr.includes(' tee') || checkStr.endsWith('tee')) return 'Tee';
  if (checkStr.includes('dirsek') || checkStr.includes('elbow')) return 'Elbow';
  if (checkStr.includes('çapraz') || checkStr.includes('cross')) return 'Cross';
  if (checkStr.includes('düz ek vidalı') || checkStr.includes('coupling with screw')) return 'Coupling (Screw)';
  if (checkStr.includes('düz ek') || checkStr.includes('coupling')) return 'Coupling';
  if (checkStr.includes('base') || checkStr.includes('base flange') || checkStr.includes('taban')) return 'Base';
  
  return model || null;
}

export function normalizeSize(size: string | null | undefined, product?: any): string | null {
  const checkStr = [size, product?.size, product?.pipe_size, product?.name].filter(Boolean).join(' ').toLowerCase();

  // Try to use normalizePipeSize on checkStr
  return size || null;
}

export function normalizePipeSize(size: string | null | undefined, product?: any): string {
  let s = [size, product?.pipe_size, product?.size, product?.name].filter(Boolean).join(' ').toLowerCase();
  if (!s) return 'Bilinmiyor';

  // Kare profil ölçüleri (örn: 20x20, 25*25, 30 x 30, 40X40)
  const squareMatch = s.match(/(?:^|\s|_)(\d+)\s*[xX*]\s*(\d+)/);
  if (squareMatch) {
    return `${squareMatch[1]}x${squareMatch[2]} mm`;
  }

  // İnç ölçüler (örn: 1/2, 1/2", 1/2 inch, 1 1/4, 1-1/2)
  const fractionInchMatch = s.match(/(?:^|\s|-)(\d+[- ]\d+\/\d+|\d+\/\d+)\s*(?:"|inch|inç|inc)?/i);
  if (fractionInchMatch) {
     let val = fractionInchMatch[1].replace('-', ' ');
     return `${val} inch`;
  }
  
  // Tam inç ölçüler (örn: 1", 2 inch) but no fraction
  const inchMatch = s.match(/(?:^|\s|-)(\d+)\s*(?:"|inch|inç|inc)/i);
  if (inchMatch) {
    return `${inchMatch[1]} inch`;
  }

  // Yuvarlak milimetre ölçüleri (örn: 20, 20 mm, 20mm, Ø20, çap 20)
  const mmMatch = s.match(/(?:ø|çap|cap)?\s*(\d{1,3})\s*(?:mm)/i);
  if (mmMatch) {
    return `${mmMatch[1]} mm`;
  }

  return size ? size.trim() : 'Bilinmiyor';
}

export function generateNormalizedFields(product: any) {
  const pipe_size_raw = product.pipe_size || product.size;
  return {
    normalized_material: normalizeMaterial(product.material, product) || 'Bilinmiyor',
    normalized_model: normalizeModel(product.model, product) || 'Bilinmiyor',
    normalized_size: normalizeSize(product.size, product) || 'Bilinmiyor',
    normalized_tube_type: product.category?.toLowerCase().includes('kare') || product.name?.toLowerCase().includes('square') || product.title?.toLowerCase().includes('square') ? 'Kare' : 
                          (product.category?.toLowerCase().includes('yuvarlak') || product.name?.toLowerCase().includes('round') || product.title?.toLowerCase().includes('round') ? 'Yuvarlak' : 'Bilinmiyor'),
    normalized_pipe_size: normalizePipeSize(pipe_size_raw, product)
  };
}
