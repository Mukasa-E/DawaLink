import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { referralsAPI } from '../services/api';
import { ArrowLeft, Download, QrCode, FileText, User, Building2, Clock, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Referral } from '../types';
import { format } from 'date-fns';

export const ReferralDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const qrCodeRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReferral = async () => {
      if (!id) return;
      try {
        const data = await referralsAPI.getById(id);
        setReferral(data);
        // Generate QR code URL
        const qrUrl = `${window.location.origin}/referrals/${id}`;
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error fetching referral:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferral();
  }, [id]);

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;
    
    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create an image from the SVG
    const img = new Image();
    img.onload = () => {
      // Set canvas size (add padding for white background)
      const padding = 40;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the QR code image with padding
      ctx.drawImage(img, padding, padding);

      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `referral-${referral?.id}-qr.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      }, 'image/png');

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="card text-center py-12 border border-gray-200">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">Referral not found</p>
        <Link to="/referrals" className="text-primary-600 hover:text-primary-700 mt-4 inline-block font-medium">
          ← Back to Referrals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/referrals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Referral Details
          </h1>
          <p className="text-gray-600 mt-1">Complete information for this referral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-primary-50 rounded-lg">
                <User className="text-primary-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                <p className="text-sm text-gray-600">Details about the patient</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Patient Name
                  </label>
                  <p className="text-gray-900 mt-2 font-semibold">{referral.patientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Status
                  </label>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : referral.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : referral.status === 'accepted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Clinical Information</h2>
                <p className="text-sm text-gray-600">Medical details and recommendations</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide block mb-2">
                  Reason for Referral
                </label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{referral.reason}</p>
              </div>
              {referral.diagnosis && (
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide block mb-2">
                    Diagnosis
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{referral.diagnosis}</p>
                </div>
              )}
              {referral.recommendations && (
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide block mb-2">
                    Recommendations
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{referral.recommendations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Facility Information */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-green-50 rounded-lg">
                <Building2 className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Facility Information</h2>
                <p className="text-sm text-gray-600">Referral routing details</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Referring Facility
                </label>
                <p className="text-gray-900 mt-2 font-semibold">{referral.referringFacility?.name || 'Not specified'}</p>
                {referral.referringFacility?.city && (
                  <p className="text-sm text-gray-600 mt-1">{referral.referringFacility.city}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Referred To Facility
                </label>
                <p className="text-gray-900 mt-2 font-semibold">{referral.receivingFacility?.name || 'General referral'}</p>
                {referral.receivingFacility?.city && (
                  <p className="text-sm text-gray-600 mt-1">{referral.receivingFacility.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
              <div className="p-3 bg-purple-50 rounded-lg">
                <User className="text-purple-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Healthcare Provider</h2>
            </div>
            <p className="text-gray-900 font-semibold">{referral.providerName}</p>
          </div>
        </div>

        {/* Sidebar: QR Code & Timeline */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="card border border-gray-200 text-center">
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-100">
              <QrCode className="text-primary-600" size={20} />
              <h3 className="font-semibold text-gray-900">Digital QR Code</h3>
            </div>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4" ref={qrCodeRef}>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG 
                    value={qrCodeUrl} 
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Share this QR code with receiving facility to verify referral
            </p>
            <button
              onClick={downloadQRCode}
              className="btn-primary w-full flex items-center justify-center space-x-2 px-4 py-2"
            >
              <Download size={18} />
              <span>Download QR</span>
            </button>
          </div>

          {/* Timeline Card */}
          <div className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock size={20} className="text-orange-600" />
              <span>Timeline</span>
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(referral.createdAt), 'PPP HH:mm')}
                  </p>
                </div>
              </div>

              {referral.status === 'accepted' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-gray-200"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Accepted</p>
                    <p className="text-sm text-gray-600">By receiving facility</p>
                  </div>
                </div>
              )}

              {referral.status === 'completed' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Completed</p>
                    <p className="text-sm text-gray-600">Referral process finished</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

