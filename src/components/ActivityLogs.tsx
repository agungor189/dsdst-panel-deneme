import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Activity, Clock } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.get('/activity-logs');
      setLogs(data);
    } catch (error) {
      console.error("Failed to load activity logs", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-border-color">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
             <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-main flex items-center tracking-tight">Geçmiş Aktiviteler</h1>
            <p className="text-text-muted mt-1 font-medium">Sistemde yapılan son 100 işlem.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-xl border border-border-color overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted font-bold animate-pulse">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-text-muted font-bold text-lg">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border-color">
                  <th className="pb-4 pt-2 px-4 font-black text-xs text-text-muted uppercase tracking-wider">Tarih</th>
                  <th className="pb-4 pt-2 px-4 font-black text-xs text-text-muted uppercase tracking-wider">İşlem</th>
                  <th className="pb-4 pt-2 px-4 font-black text-xs text-text-muted uppercase tracking-wider">Tür</th>
                  <th className="pb-4 pt-2 px-4 font-black text-xs text-text-muted uppercase tracking-wider">Detaylar</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-text-muted whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-text-main uppercase text-xs">
                      {log.entity_type}
                    </td>
                    <td className="py-4 px-4 text-text-muted text-xs max-w-sm truncate">
                      {log.details ? log.details : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
