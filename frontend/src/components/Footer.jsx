import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Logo from '/logo-1.jpeg';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50/80">

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Logo + Description */}
        <div className="flex flex-col items-center text-center">
         {/* Logo */}
                 <Link to="/" className="flex items-center">
                   <img
                     src={Logo}
                     alt="Role LMS"
                     className="h-15 w-full"
                   />
          </Link>

          <p className="mt-3 max-w-md text-sm text-gray-500">
            A modern learning management system for students and educators.
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-gray-200/50 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} SkillsUp. All rights reserved.
          </p>

          <p className="flex items-center gap-1 text-xs text-gray-400">
            Made with <Heart className="h-3 w-3 fill-red-400 text-red-400" /> for learners
          </p>
        </div>

      </div>
    </footer>
  );
}