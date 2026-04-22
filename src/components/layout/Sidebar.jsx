import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { userRole, userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Define navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'user'] }
    ];

    const superAdminItems = [
      { path: '/users', icon: Users, label: 'All Users', roles: ['super_admin'] },
      { path: '/companies', icon: Building2, label: 'Companies', roles: ['super_admin'] },
      { path: '/users/create', icon: UserPlus, label: 'Create User', roles: ['super_admin', 'admin'] },
      { path: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', roles: ['super_admin'] },
      { path: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin'] }
    ];

    const adminItems = [
      { path: '/users', icon: Users, label: 'My Users', roles: ['admin'] },
      { path: '/users/create', icon: UserPlus, label: 'Create User', roles: ['admin'] }
    ];

    const userItems = [
      { path: '/activity', icon: ClipboardList, label: 'Activity', roles: ['user'] },
      { path: '/notifications', icon: Settings, label: 'Notifications', roles: ['user'] },
      { path: '/help', icon: Shield, label: 'Help', roles: ['user'] }
    ];

    if (userRole === 'super_admin') {
      return [...baseItems, ...superAdminItems];
    } else if (userRole === 'admin') {
      return [...baseItems, ...adminItems];
    } else {
      return [...baseItems, ...userItems];
    }
  };

  const navigationItems = getNavigationItems();

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`
          flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative
          ${isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? item.label : ''}
      >
        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} transition-all`} />
        {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
        
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-800 text-white flex flex-col shadow-2xl z-40
          transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold truncate">License Mgr</h1>
              </div>
            </div>
          )}
          {isCollapsed && (
             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
               <Shield className="w-5 h-5 text-white" />
             </div>
          )}
          
          {/* Toggle Button (Desktop only) */}
          <button 
            onClick={toggleSidebar}
            className={`hidden lg:flex p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors ${isCollapsed ? 'absolute -right-3 top-8 shadow-lg' : ''}`}
          >
             {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Info */}
        {userData && (
          <div className={`p-4 bg-gray-750 border-b border-gray-700 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center shadow cursor-pointer" title={userData.firstName}>
                <span className="text-white font-bold text-xs">
                  {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">
                    {userData.firstName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{userData.role}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-2 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item, index) => (
            <NavLink key={index} item={item} />
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
