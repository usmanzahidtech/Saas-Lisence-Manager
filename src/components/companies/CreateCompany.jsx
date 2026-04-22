import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createCompany, updateCompany } from '../../utils/CompanyService';
import { createAuditLog } from '../../utils/helpers';
import { uploadCompanyLogo, validateImageFile } from '../../utils/imageUtils';
import { 
  Building2, 
  Globe, 
  Calendar,
  Key,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  Phone,
  Trash2
} from 'lucide-react';
import { generateLicenseKey } from '../../utils/generators';

const CreateCompany = () => {
  const { currentUser, userData, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    uan: '',
    serverUrl: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active'
  });

  const [phoneNumbers, setPhoneNumbers] = useState(['']);
  const [licenseKey, setLicenseKey] = useState('');
  
  // Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    generateNewLicenseKey();
  }, []);

  const generateNewLicenseKey = () => {
    const key = generateLicenseKey();
    setLicenseKey(key);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  const removePhoneNumber = (index) => {
    if (phoneNumbers.length > 1) {
      const newPhones = phoneNumbers.filter((_, i) => i !== index);
      setPhoneNumbers(newPhones);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoError('');
    
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setLogoError(validation.error);
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setLogoFile(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.serverUrl || !formData.expiryDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate at least one phone number
    const validPhones = phoneNumbers.filter(phone => phone.trim() !== '');
    if (validPhones.length === 0) {
      setError('Please enter at least one phone number');
      return;
    }

    // Date validation
    const start = new Date(formData.startDate);
    const expiry = new Date(formData.expiryDate);
    if (expiry <= start) {
      setError('Expiry date must be after start date');
      return;
    }

    setLoading(true);

    try {
      // Create company first to get ID
      const companyData = {
        name: formData.name,
        uan: formData.uan,
        phoneNumbers: validPhones,
        serverUrl: formData.serverUrl,
        startDate: new Date(formData.startDate),
        expiryDate: new Date(formData.expiryDate),
        status: formData.status,
        licenseKey: licenseKey
      };

      const company = await createCompany(companyData);

      // Upload logo if selected
      if (logoFile) {
        try {
          const logoUrl = await uploadCompanyLogo(company.id, logoFile);
          await updateCompany(company.id, { logoUrl });
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError);
          setError('Company created but logo upload failed');
        }
      }

      // Create audit log
      await createAuditLog('create_company', {
        performedBy: currentUser.uid,
        performedByEmail: userData.email,
        message: `Created new company: ${formData.name}`,
        metadata: {
          companyId: company.id,
          companyName: formData.name,
          licenseKey: company.licenseKey
        }
      });

      setSuccess(`Company created successfully! License Key: ${company.licenseKey}`);
      
      setTimeout(() => {
        navigate('/companies');
      }, 2000);
    } catch (error) {
      console.error('Error creating company:', error);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only Super Admins can create companies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Building2 className="w-8 h-8 mr-3 text-blue-600" />
          Create New Company
        </h1>
        <p className="text-gray-600">Add a new company with license management</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card animate-slide-in space-y-6">
        {/* Auto-Generated License Key */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Auto-Generated License Key
            </h3>
            <button
              type="button"
              onClick={generateNewLicenseKey}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerate
            </button>
          </div>
          <div className="bg-white px-3 py-2 rounded border border-blue-300 font-mono text-sm">
            {licenseKey || 'Generating...'}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
            Company Logo (Optional)
          </h3>
          
          <div className="flex items-start space-x-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-32 h-32 rounded-lg object-contain border-2 border-gray-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200">
                <Upload className="w-5 h-5 mr-2" />
                Choose Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Max size 250KB. Supported formats: JPEG, PNG, GIF, WebP.
              </p>
              {logoError && (
                <p className="text-sm text-red-600 mt-2">{logoError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Company Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                required
              />
            </div>

            <div>
              <label htmlFor="uan" className="block text-sm font-semibold text-gray-700 mb-2">
                UAN (Universal Account Number)
              </label>
              <input
                type="text"
                id="uan"
                name="uan"
                value={formData.uan}
                onChange={handleChange}
                placeholder="Enter UAN"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>

            <div>
              <label htmlFor="serverUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                Server URL / Domain *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="serverUrl"
                  name="serverUrl"
                  value={formData.serverUrl}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Numbers * (At least one required)
              </label>
              <div className="space-y-3">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(index, e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                      />
                    </div>
                    {phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneNumber(index)}
                        className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-200 border border-red-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhoneNumber}
                  className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors duration-200 border border-blue-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Phone Number
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* License Configuration */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            License Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Company'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/companies')}
            disabled={loading}
            className="px-6 py-3 border-2 border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompany;
