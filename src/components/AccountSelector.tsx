import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, Plus } from 'lucide-react';

export type Account = {
  id: number;
  login: string;
  type: string;
  avatarUrl?: string;
};

type AccountSelectorProps = {
  accounts: Account[];
  selectedAccounts: string[];
  onSelectionChange: (selectedAccounts: string[]) => void;
  isLoading?: boolean;
  multiSelect?: boolean;
  showCurrentLabel?: boolean;
  currentUsername?: string;
};

export default function AccountSelector({
  accounts,
  selectedAccounts,
  onSelectionChange,
  isLoading = false,
  multiSelect = true,
  showCurrentLabel = false,
  currentUsername,
}: AccountSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle selection for an account
  const toggleAccountSelection = (login: string) => {
    // If multiSelect is false, replace selection
    if (!multiSelect) {
      onSelectionChange([login]);
      setShowDropdown(false);
      return;
    }

    // Otherwise toggle in the multiselect
    if (selectedAccounts.includes(login)) {
      onSelectionChange(selectedAccounts.filter(a => a !== login));
    } else {
      onSelectionChange([...selectedAccounts, login]);
    }
  };

  // Select/deselect all accounts
  const selectAll = (select: boolean) => {
    if (select) {
      onSelectionChange(filteredAccounts.map(account => account.login));
    } else {
      onSelectionChange([]);
    }
  };

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter(account => 
    account.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.account-selector-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="account-selector-container relative">
      {/* Selected accounts summary button */}
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading || accounts.length === 0}
        variant="outline"
        className={`w-full justify-between text-sm ${selectedAccounts.length === 0 ? 'text-blue-500 border-blue-500' : 'text-green-500 border-green-500'}`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          {selectedAccounts.length === 0 ? (
            <span className="flex items-center">
              <Plus className="h-3 w-3 mr-1 animate-pulse" />
              {multiSelect ? 'Select Accounts' : 'Select Account'}
            </span>
          ) : (
            <>
              {selectedAccounts.length > 3 ? (
                <span>{selectedAccounts.length} accounts selected</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedAccounts.map((login, index) => (
                    <span key={login} className="flex items-center">
                      {index > 0 && <span>, </span>}
                      <span className="truncate max-w-[100px]">{login}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown menu */}
      {showDropdown && (
        <Card className="absolute z-50 mt-1 w-full shadow-lg max-h-96 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-muted">
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Multi-select controls */}
          {multiSelect && accounts.length > 1 && (
            <div className="flex justify-between p-2 border-b border-muted text-xs">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll(true);
                }}
                variant="outline"
                size="sm"
                className="text-green-500 border-green-500"
              >
                SELECT ALL
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll(false);
                }}
                variant="outline"
                size="sm"
                className="text-blue-500 border-blue-500"
              >
                CLEAR ALL
              </Button>
            </div>
          )}

          {/* Account list */}
          <div className="overflow-y-auto max-h-64">
            {filteredAccounts.length > 0 ? (
              <div className="py-1">
                {filteredAccounts.map(account => (
                  <div 
                    key={account.id}
                    onClick={() => toggleAccountSelection(account.login)}
                    className={`flex items-center px-3 py-2 hover:opacity-80 cursor-pointer text-foreground transition-colors ${
                      selectedAccounts.includes(account.login) ? 'bg-green-500/10' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {account.avatarUrl ? (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                          <Image
                            src={account.avatarUrl}
                            alt={account.login}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                          {account.login.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="text-sm font-medium flex items-center">
                        {account.login}
                        {currentUsername && account.login === currentUsername && showCurrentLabel && (
                          <Badge variant="outline" className="ml-2 text-xs text-green-500 border-green-500">
                            YOU
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {account.type}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-2">
                      <input
                        type={multiSelect ? "checkbox" : "radio"}
                        name="account-selection"
                        checked={selectedAccounts.includes(account.login)}
                        onChange={() => {}} // Handled by the parent div click
                        onClick={(e) => e.stopPropagation()} // Prevent double-triggering
                        className="form-checkbox h-4 w-4 accent-green-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 px-3 text-center text-foreground">
                No accounts match your search
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}