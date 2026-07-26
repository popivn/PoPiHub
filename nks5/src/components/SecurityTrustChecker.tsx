import { useState, useEffect } from 'react';

export interface DeviceAnalysis {
  ip: string;
  isVpn: boolean;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
  timezone: string;
  language: string;
  screenSize: string;
  userAgent: string;
  gps: { latitude: number; longitude: number } | null;
  riskScore: number;
  riskLevel: 'Thấp (An toàn)' | 'Trung bình' | 'Cao (Rủi ro)';
  details: string[];
}

export async function getDeviceFingerprint(): Promise<DeviceAnalysis> {
  const details: string[] = [];
  let score = 0;

  const language = navigator.language || 'N/A';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A';
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  const userAgent = navigator.userAgent;

  details.push(`Timezone hệ thống: ${timezone}`);
  details.push(`Ngôn ngữ trình duyệt: ${language}`);
  details.push(`Màn hình: ${screenSize}`);

  if (timezone.includes('Ho_Chi_Minh') || timezone.includes('Saigon') || timezone.includes('Asia')) {
    score += 20;
    details.push('✅ Timezone phù hợp khu vực Châu Á/Việt Nam (+20)');
  } else {
    details.push('⚠️ Timezone khác biệt (+0)');
  }

  let ip = 'N/A';
  let isVpn = false;
  let city = '';
  let region = '';
  let country = '';
  let lat = 0;
  let lon = 0;

  // Multi-service fallback IP Geo Location
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const ipData = await res.json();
      ip = ipData.ip || '127.0.0.1';
      city = ipData.city || '';
      region = ipData.region || '';
      country = ipData.country_name || '';
      lat = ipData.latitude || 0;
      lon = ipData.longitude || 0;
      if (ipData.country_code === 'VN') {
        score += 20;
        details.push(`✅ IP ở Việt Nam (${ip} - ${city}, ${region}) (+20)`);
      } else {
        isVpn = true;
        details.push(`⚠️ IP ngoài nước / Nghi vấn VPN (${country} - ${ip})`);
      }
    } else {
      throw new Error('ipapi.co rate limit or blocked');
    }
  } catch {
    // Fallback Service 1: ipwho.is (Free without CORS issue)
    try {
      const res2 = await fetch('https://ipwho.is/');
      const data2 = await res2.json();
      if (data2 && data2.success) {
        ip = data2.ip;
        city = data2.city || '';
        region = data2.region || '';
        country = data2.country || '';
        lat = data2.latitude || 0;
        lon = data2.longitude || 0;
        if (data2.country_code === 'VN') {
          score += 20;
          details.push(`✅ IP ở Việt Nam (${ip} - ${city}) (+20)`);
        }
      }
    } catch {
      // Fallback Service 2: ipify
      try {
        const res3 = await fetch('https://api.ipify.org?format=json');
        const data3 = await res3.json();
        ip = data3.ip || '127.0.0.1';
        details.push(`ℹ️ Đã lấy IP thiết bị (${ip})`);
      } catch {
        details.push('⚠️ Không thể kiểm tra VPN qua IP công cộng (+10)');
      }
    }
  }

  let persistentId = localStorage.getItem('__nks5_fp');
  if (!persistentId) {
    persistentId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('__nks5_fp', persistentId);
    score += 15;
    details.push('ℹ️ Thiết bị mới (Khởi tạo Guest Device ID) (+15)');
  } else {
    score += 30;
    details.push(`✅ Trình duyệt quen thuộc (Guest ID: ${persistentId}) (+30)`);
  }

  let gpsLocation: { latitude: number; longitude: number } | null = null;
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      gpsLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      score += 30;
      details.push(`✅ Đã cấp quyền GPS chính xác (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}) (+30)`);
    } catch {
      details.push('ℹ️ Người dùng từ chối / Không bật GPS (+0)');
    }
  }

  let riskLevel: 'Thấp (An toàn)' | 'Trung bình' | 'Cao (Rủi ro)' = 'Trung bình';
  if (score >= 70) {
    riskLevel = 'Thấp (An toàn)';
  } else if (score < 40) {
    riskLevel = 'Cao (Rủi ro)';
  }

  return {
    ip,
    isVpn,
    city,
    region,
    country,
    lat,
    lon,
    timezone,
    language,
    screenSize,
    userAgent,
    gps: gpsLocation,
    riskScore: Math.min(score, 100),
    riskLevel,
    details,
  };
}

export function SecurityTrustChecker() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<DeviceAnalysis | null>(null);

  const analyzeSecurity = async () => {
    setLoading(true);
    const result = await getDeviceFingerprint();
    setAnalysis(result);
    setLoading(false);
  };

  useEffect(() => {
    analyzeSecurity();
  }, []);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl p-3 sm:p-4 text-xs shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 className="font-extrabold text-amber-400 text-sm sm:text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Đánh Giá Độ Tin Cậy Người Dùng (Risk Scoring System)</span>
        </h3>

        <button
          onClick={analyzeSecurity}
          disabled={loading}
          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Đang phân tích...' : 'Phân tích lại'}
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-slate-500">Đang quét tín hiệu thiết bị & vị trí...</div>
      ) : analysis ? (
        <div className="space-y-3">
          {/* Risk Score Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center items-center">
              <span className="text-slate-400 text-[10px]">Điểm Tin Cậy (Risk Score)</span>
              <span className={`text-xl sm:text-2xl font-black ${
                analysis.riskScore >= 70 ? 'text-emerald-400' : analysis.riskScore >= 40 ? 'text-amber-400' : 'text-rose-500'
              }`}>
                {analysis.riskScore} / 100
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center items-center">
              <span className="text-slate-400 text-[10px]">Mức Độ Rủi Ro</span>
              <span className={`text-xs sm:text-sm font-bold ${
                analysis.riskLevel.includes('An toàn') ? 'text-emerald-400' : analysis.riskLevel.includes('Trung bình') ? 'text-amber-400' : 'text-rose-500'
              }`}>
                {analysis.riskLevel}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center items-center">
              <span className="text-slate-400 text-[10px]">Địa Chỉ IP Hiện Tại</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-sky-400 truncate max-w-full">
                {analysis.ip}
              </span>
            </div>
          </div>

          {/* Detailed Signals Table */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-slate-300 text-[11px] mb-1">Chi tiết tín hiệu thu thập được:</h4>
            <ul className="space-y-1 text-[11px]">
              {analysis.details.map((item, idx) => (
                <li key={idx} className="text-slate-300 font-mono flex items-center gap-1.5">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
