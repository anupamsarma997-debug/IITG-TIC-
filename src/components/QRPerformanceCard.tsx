import React, { useState } from 'react';
import { Property } from '../types';
import { store } from '../services/store';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  MessageCircle, 
  Eye, 
  Award, 
  Share2 
} from 'lucide-react';

interface QRPerformanceCardProps {
  property: Property;
  ownerRefId: string;
}

export const QRPerformanceCard: React.FC<QRPerformanceCardProps> = ({
  property,
  ownerRefId,
}) => {
  const [copied, setCopied] = useState(false);
  const { trackingUrl, qrImageUrl } = store.generatePropertyQR(property.id, ownerRefId);

  const visits = store.getVisitsForProperty(property.id);
  const leads = store.getLeadsForProperty(property.id);
  const scansCount = visits.length;
  const leadsCount = leads.length;
  const conversionRate = scansCount > 0 ? ((leadsCount / scansCount) * 100).toFixed(1) : '0.0';
  const isRewardUnlocked = leadsCount >= 5 || property.isFeatured;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `thikana-qr-${property.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(qrImageUrl, '_blank');
    }
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>THIKANA - ${property.title} QR Poster</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px 20px;
              background: #ffffff;
              color: #0f172a;
            }
            .poster {
              max-width: 500px;
              margin: 0 auto;
              border: 3px solid #10b981;
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .badge {
              background: #ecfdf5;
              color: #047857;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 800;
              font-size: 14px;
              display: inline-block;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 28px;
              margin: 0 0 10px 0;
              color: #0f172a;
            }
            p.sub {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 30px;
            }
            .qr-img {
              width: 250px;
              height: 250px;
              border-radius: 16px;
              border: 2px solid #e2e8f0;
              padding: 10px;
            }
            .instructions {
              margin-top: 25px;
              font-size: 16px;
              font-weight: 700;
              color: #047857;
            }
            .owner-info {
              margin-top: 20px;
              font-size: 13px;
              color: #64748b;
              border-top: 1px dashed #cbd5e1;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="poster">
            <div class="badge">🏠 THIKANA DIRECT BOOKING QR</div>
            <h1>${property.title}</h1>
            <p class="sub">📍 ${property.address}, ${property.city}</p>
            <img src="${qrImageUrl}" class="qr-img" alt="Scan QR Code" />
            <div class="instructions">
              📱 Scan with Phone Camera to Book Directly on WhatsApp
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
              ⚡ 0% Brokerage • Direct Host Rates • Fast Response
            </p>
            <div class="owner-info">
              <strong>Host Name:</strong> ${property.ownerName} | <strong>WhatsApp:</strong> ${property.ownerWhatsApp || property.ownerPhone}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      
      {/* Card Top Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              Smart QR & Referral System
            </span>
            {isRewardUnlocked && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                <Award className="w-3 h-3 fill-slate-950" />
                Top Search Unlocked
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
            QR Performance for {property.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Print this QR for your visiting cards, gate poster, or room standees. Every scan tracks real-time customer visits & WhatsApp leads.
          </p>
        </div>

        <button
          onClick={handlePrintPoster}
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Print Gate Poster</span>
        </button>
      </div>

      {/* Main Grid: QR Code Image + Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* QR Code Graphic Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${property.title}`}
              className="w-44 h-44 object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              Unique Property QR
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Ref ID: <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">{ownerRefId}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full pt-1">
            <button
              onClick={handleDownloadQR}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
              title="Test QR Link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Live Performance Stats Cards */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            
            {/* Scans Stat */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-1">
                <Eye className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {scansCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Total Scans / Visits
              </p>
            </div>

            {/* Leads Stat */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <MessageCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {leadsCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                WhatsApp Leads
              </p>
            </div>

            {/* Conversion Rate Stat */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {conversionRate}%
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Conversion Rate
              </p>
            </div>

          </div>

          {/* Reward Milestone Progress */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:to-blue-950/40 p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Referral Reward Goal: 5 WhatsApp Leads
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {leadsCount} / 5 Leads
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min((leadsCount / 5) * 100, 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              {leadsCount >= 5 ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                  🎉 Congratulations! You have unlocked FREE "Top Search Boost" on THIKANA!
                </span>
              ) : (
                <span>
                  Get {5 - leadsCount} more lead{5 - leadsCount > 1 ? 's' : ''} via your QR code or referral link to automatically unlock a <strong>FREE Top Search Boost</strong> for your listing!
                </span>
              )}
            </p>
          </div>

          {/* Shareable URL Copy Bar */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              readOnly
              value={trackingUrl}
              className="flex-1 bg-transparent border-none text-xs text-slate-600 dark:text-slate-300 px-2 focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
