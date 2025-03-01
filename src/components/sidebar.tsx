'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Trash2 } from 'lucide-react';

interface SavedContent {
  id: string;
  title: string;
  timestamp: number;
  data: Record<string, unknown>;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectContent: (content: Record<string, unknown>) => void;
}

export default function Sidebar({ isOpen, onToggle, onSelectContent }: SidebarProps) {
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);

  useEffect(() => {
    // Load saved contents from localStorage when component mounts
    const loadSavedContents = () => {
      try {
        const stored = localStorage.getItem('euron-saved-contents');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSavedContents(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Error loading saved contents:', error);
      }
    };

    loadSavedContents();
    
    // Add event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'euron-saved-contents') {
        loadSavedContents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDeleteContent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    
    try {
      const filtered = savedContents.filter(content => content.id !== id);
      localStorage.setItem('euron-saved-contents', JSON.stringify(filtered));
      setSavedContents(filtered);
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Sidebar toggle button (visible when sidebar is closed) */}
      {!isOpen && (
        <button 
          className="fixed left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-lg bg-blue-600 p-2 text-white shadow-md hover:bg-blue-700"
          onClick={onToggle}
          aria-label="Open sidebar"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-30 h-full w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Saved Content</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggle}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Saved content list */}
          <div className="flex-1 overflow-y-auto p-4">
            {savedContents.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No saved content yet</p>
            ) : (
              <ul className="space-y-3">
                {savedContents.map((content) => (
                  <li 
                    key={content.id}
                    className="cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30"
                    onClick={() => onSelectContent(content.data)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">{content.title}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-500 dark:text-gray-400"
                        onClick={(e) => handleDeleteContent(content.id, e)}
                        aria-label="Delete content"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDate(content.timestamp)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Overlay - close sidebar when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50" 
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
} 