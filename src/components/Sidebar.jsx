import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/bills', label: 'Bills', icon: '📄' },
  { path: '/bills/new', label: 'New Bill', icon: '➕' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-indigo-400">StockFlow</h1>
        <p className="text-xs text-gray-400 mt-0.5">Bill Management</p>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path) &&
                !(item.path === '/bills' && pathname.startsWith('/bills/new'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        © 2024 StockFlow
      </div>
    </aside>
  );
}
