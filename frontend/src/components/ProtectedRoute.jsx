import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Loading from './Loading';
import { ShieldX } from 'lucide-react';

export default function ProtectedRoute({ roles }) {
  const { user, isSignedIn, loading } = useAppContext();

  if (loading) return <Loading />;
  if (!isSignedIn) return <Navigate to="/" replace />;
  if (roles && !user) return <Loading />;

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-red-50 p-4">
          <ShieldX className="h-12 w-12 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500">You don't have permission to view this page.</p>
        <a
          href="/"
          className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Go Home
        </a>
      </div>
    );
  }

  return <Outlet />;
}