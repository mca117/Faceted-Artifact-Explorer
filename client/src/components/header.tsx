import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X,
  User,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between py-3">
        <div className="flex items-center space-x-2 mb-3 md:mb-0 w-full md:w-auto justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 12h3v9h16v-9h3L12 2zm0 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
            </svg>
            <h1 className="text-2xl font-serif font-bold text-primary-500">Faceted Artifact Explorer</h1>
          </Link>
          
          <button 
            className="md:hidden text-neutral-600"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`w-full md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="mt-3 mb-3">
            <SearchBar />
          </div>
          
          <div className="flex flex-col space-y-2">
            <Link href="/" className={`px-3 py-2 rounded-md ${location === '/' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}>
              Collections
            </Link>
            <Link href="/about" className={`px-3 py-2 rounded-md ${location === '/about' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}>
              About
            </Link>
            {user && (
              <Link href="/add-artifact" className={`px-3 py-2 rounded-md ${location === '/add-artifact' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}>
                Add Artifact
              </Link>
            )}
            
            {user ? (
              <div className="border-t border-neutral-200 pt-2 mt-2">
                <div className="px-3 py-1 text-sm text-neutral-500">
                  Signed in as <span className="font-medium">{user.username}</span>
                </div>
                <button
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md flex items-center"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth" className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center space-x-4 w-full justify-between">
          <SearchBar className="w-full max-w-md" />
          
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <Link href="/" className={`text-neutral-600 hover:text-primary-500 ${location === '/' && 'font-medium text-primary-500'}`}>
              Collections
            </Link>
            <Link href="/about" className={`text-neutral-600 hover:text-primary-500 ${location === '/about' && 'font-medium text-primary-500'}`}>
              About
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
