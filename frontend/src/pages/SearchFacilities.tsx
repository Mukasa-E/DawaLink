import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { facilitiesAPI } from '../services/api';
import type { Facility, FacilityType } from '../types';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  CheckCircle,
  Building2,
  Beaker,
  Heart
} from 'lucide-react';

const SearchFacilities: React.FC = () => {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<FacilityType | ''>('');
  const [selectedCity, setSelectedCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Get unique cities from facilities
  const cities = Array.from(new Set(facilities.map(f => f.city).filter(Boolean)));

  useEffect(() => {
    loadFacilities();
  }, [selectedType, selectedCity, verifiedOnly]);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (selectedType) params.type = selectedType;
      if (selectedCity) params.city = selectedCity;
      if (verifiedOnly) params.verified = true;
      
      const data = await facilitiesAPI.getAll(params);
      setFacilities(data);
    } catch (err: any) {
      console.error('Error loading facilities:', err);
      setError(err.response?.data?.error || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedType) params.type = selectedType;
      if (selectedCity) params.city = selectedCity;
      if (verifiedOnly) params.verified = true;
      
      const data = await facilitiesAPI.getAll(params);
      setFacilities(data);
    } catch (err: any) {
      console.error('Error searching facilities:', err);
      setError(err.response?.data?.error || 'Failed to search facilities');
    } finally {
      setLoading(false);
    }
  };

  const getFacilityIcon = (type: FacilityType) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="h-6 w-6 text-red-500" />;
      case 'clinic':
        return <Heart className="h-6 w-6 text-blue-500" />;
      case 'pharmacy':
        return <Beaker className="h-6 w-6 text-green-500" />;
      case 'health_center':
        return <Heart className="h-6 w-6 text-purple-500" />;
      default:
        return <Building2 className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatOperatingHours = (hours: any) => {
    if (!hours) return 'Hours not specified';
    if (typeof hours === 'string') return hours;
    if (hours.open && hours.close) {
      return `${hours.open} - ${hours.close}`;
    }
    return 'Hours not specified';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('facilities.search.title', 'Find Healthcare Facilities')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('facilities.search.subtitle', 'Search for nearby clinics, pharmacies, and hospitals')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('facilities.search.searchLabel', 'Search by name, address, or city')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('facilities.search.placeholder', 'Search facilities...')}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-7 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('facilities.search.button', 'Search')}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('facilities.search.typeLabel', 'Facility Type')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FacilityType | '')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('facilities.search.allTypes', 'All Types')}</option>
                <option value="hospital">{t('facilities.types.hospital', 'Hospital')}</option>
                <option value="clinic">{t('facilities.types.clinic', 'Clinic')}</option>
                <option value="pharmacy">{t('facilities.types.pharmacy', 'Pharmacy')}</option>
                <option value="health_center">{t('facilities.types.health_center', 'Health Center')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('facilities.search.cityLabel', 'City')}
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('facilities.search.allCities', 'All Cities')}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('facilities.search.verifiedOnly', 'Verified facilities only')}
                </span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('facilities.search.loading', 'Loading facilities...')}
          </p>
        </div>
      )}

      {/* Facilities List */}
      {!loading && (
        <div>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t('facilities.search.results', `Found ${facilities.length} facilities`)}
          </div>

          {facilities.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {t('facilities.search.noResults', 'No facilities found')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('facilities.search.noResultsMessage', 'Try adjusting your search criteria')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getFacilityIcon(facility.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {facility.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {t(`facilities.types.${facility.type}`, facility.type)}
                        </span>
                      </div>
                    </div>
                    {facility.isVerified && (
                      <div title="Verified">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{facility.address}, {facility.city}</span>
                    </div>

                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                      <a href={`tel:${facility.phone}`} className="hover:text-blue-600">
                        {facility.phone}
                      </a>
                    </div>

                    {facility.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                        <a href={`mailto:${facility.email}`} className="hover:text-blue-600 truncate">
                          {facility.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{formatOperatingHours(facility.operatingHours)}</span>
                    </div>
                  </div>

                  {/* Services */}
                  {facility.services && facility.services.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {t('facilities.services', 'Services')}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {facility.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {service}
                          </span>
                        ))}
                        {facility.services.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            +{facility.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {facility._count && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">{facility._count.referralsTo}</span> referrals received
                      </div>
                      <div>
                        <span className="font-medium">{facility._count.records}</span> records
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFacilities;
