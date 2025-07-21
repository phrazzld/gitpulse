import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ActivityMode } from './ui/ModeSelector';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';

export type Organization = {
  id: number;
  login: string;
  type: string;
  avatarUrl?: string;
};

export interface OrganizationPickerProps {
  organizations: Organization[];
  selectedOrganizations: string[];
  onSelectionChange: (selectedOrgs: string[]) => void;
  mode: ActivityMode;
  disabled?: boolean;
  isLoading?: boolean;
  currentUsername?: string;
}

// Debounce delay for organization selection changes (in milliseconds)
const ORG_DEBOUNCE_DELAY = 500;

export default function OrganizationPicker({
  organizations,
  selectedOrganizations,
  onSelectionChange,
  mode,
  disabled = false,
  isLoading = false,
  currentUsername
}: OrganizationPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  // Internal state for immediate UI feedback
  const [internalSelection, setInternalSelection] = useState<string[]>(selectedOrganizations);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Support multi-select only for team-activity mode
  const multiSelect = mode === 'team-activity';

  // Update internal state when props change
  useEffect(() => {
    setInternalSelection(selectedOrganizations);
  }, [selectedOrganizations]);

  // Create debounced selection change handler (500ms delay)
  const { callback: debouncedOnSelectionChange, pending: isDebouncing } = useDebounceCallback(
    onSelectionChange,
    ORG_DEBOUNCE_DELAY
  );

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter(org => 
    org.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection for an organization
  const toggleSelection = useCallback((login: string) => {
    if (disabled || isLoading) return;

    // If multiSelect is false, replace selection
    if (!multiSelect) {
      const newSelection = [login];
      setInternalSelection(newSelection);
      debouncedOnSelectionChange(newSelection);
      setShowDropdown(false);
      return;
    }

    // Otherwise toggle in the multiselect
    if (internalSelection.includes(login)) {
      const newSelection = internalSelection.filter(o => o !== login);
      setInternalSelection(newSelection);
      debouncedOnSelectionChange(newSelection);
    } else {
      const newSelection = [...internalSelection, login];
      setInternalSelection(newSelection);
      debouncedOnSelectionChange(newSelection);
    }
  }, [disabled, isLoading, multiSelect, debouncedOnSelectionChange, internalSelection]);

  // Select/deselect all organizations
  const selectAll = useCallback((select: boolean) => {
    if (disabled || isLoading) return;
    
    if (select) {
      const newSelection = filteredOrganizations.map(org => org.login);
      setInternalSelection(newSelection);
      debouncedOnSelectionChange(newSelection);
    } else {
      setInternalSelection([]);
      debouncedOnSelectionChange([]);
    }
  }, [disabled, isLoading, filteredOrganizations, debouncedOnSelectionChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const handleDropdownToggle = useCallback(() => {
    if (disabled || isLoading) return;
    
    if (!showDropdown && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
    
    setShowDropdown(prev => !prev);
  }, [disabled, isLoading, showDropdown, hasBeenOpened]);

  // Check if the component should be visible based on mode
  const shouldDisplay = mode === 'my-work-activity' || mode === 'team-activity';
  if (!shouldDisplay) return null;

  // Combined loading state (API loading or debouncing)
  const isProcessing = isLoading || isDebouncing;

  return (
    <Card 
      className={`bg-slate-900/70 backdrop-blur-sm transition-colors duration-200 ${isDebouncing ? 'border-green-500' : 'border-blue-500'}`}
      ref={dropdownRef}
    >
      <div className={`p-3 border-b transition-colors duration-200 ${isDebouncing ? 'border-green-500' : 'border-blue-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 transition-colors duration-200 ${isDebouncing ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <h3 className={`text-sm uppercase transition-colors duration-200 ${isDebouncing ? 'text-green-500' : 'text-blue-500'}`}>
              {multiSelect ? 'ORGANIZATIONS' : 'ORGANIZATION'}
            </h3>
          </div>
          
          {/* Debounce indicator */}
          {isDebouncing && (
            <div className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1 text-green-500" />
              <span className="text-xs text-green-500">UPDATING</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs mb-2 text-blue-500">
          {multiSelect ? 'SELECT ORGANIZATIONS' : 'SELECT ORGANIZATION'}
        </div>
        
        {/* Selection button */}
        <Button
          type="button"
          onClick={handleDropdownToggle}
          disabled={disabled || isProcessing || organizations.length === 0}
          variant="outline"
          className={`w-full justify-between text-sm ${internalSelection.length === 0 ? 'text-blue-500 border-blue-500' : 'text-green-500 border-green-500'}`}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            {internalSelection.length === 0 ? (
              <span className="flex items-center">
                <Plus className="h-3 w-3 mr-1" />
                {multiSelect ? 'Select organizations' : 'Select organization'}
              </span>
            ) : (
              <>
                {internalSelection.length > 2 ? (
                  <span>{internalSelection.length} organizations selected</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {internalSelection.map((login, index) => (
                      <span key={login} className="flex items-center">
                        {index > 0 && <span>, </span>}
                        <span className="truncate max-w-[120px]">{login}</span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </Button>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            <span>Loading organizations...</span>
          </div>
        )}
        
        {/* No organizations message */}
        {!isLoading && organizations.length === 0 && (
          <div className="mt-2 text-xs text-foreground">
            No organizations available. Install the GitHub App to access more accounts.
          </div>
        )}
        
        {/* Dropdown menu */}
        {showDropdown && organizations.length > 0 && (
          <div className="mt-2 rounded-md shadow-lg max-h-96 overflow-hidden flex flex-col border border-muted bg-background">
            {/* Search input */}
            <div className="p-2 border-b border-muted">
              <Input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            
            {/* Multi-select controls */}
            {multiSelect && organizations.length > 1 && (
              <div className="flex justify-between p-2 border-b border-muted text-xs">
                <Button
                  onClick={() => selectAll(true)}
                  disabled={isDebouncing}
                  variant="outline"
                  size="sm"
                  className="text-green-500 border-green-500"
                >
                  SELECT ALL
                </Button>
                <Button
                  onClick={() => selectAll(false)}
                  disabled={isDebouncing}
                  variant="outline"
                  size="sm"
                  className="text-blue-500 border-blue-500"
                >
                  CLEAR ALL
                </Button>
              </div>
            )}
            
            {/* Organization list */}
            <div className="overflow-y-auto max-h-64">
              {filteredOrganizations.length > 0 ? (
                <div className="py-1">
                  {filteredOrganizations.map(org => (
                    <div 
                      key={org.id}
                      onClick={() => toggleSelection(org.login)}
                      className={`flex items-center px-3 py-2 hover:opacity-80 cursor-pointer text-foreground transition-colors ${
                        internalSelection.includes(org.login) ? 'bg-green-500/10' : 'bg-transparent'
                      } ${isDebouncing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {org.avatarUrl ? (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden">
                            <Image
                              src={org.avatarUrl}
                              alt={org.login}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                            {org.login.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="text-sm font-medium flex items-center">
                          {org.login}
                          {currentUsername && org.login === currentUsername && (
                            <Badge variant="outline" className="ml-2 text-xs text-green-500 border-green-500">
                              YOU
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {org.type}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-2">
                        <input
                          type={multiSelect ? "checkbox" : "radio"}
                          name="organization-selection"
                          checked={internalSelection.includes(org.login)}
                          onChange={() => {}} // Handled by the parent div click
                          onClick={(e) => e.stopPropagation()} // Prevent double-triggering
                          className="h-4 w-4 accent-green-500"
                          disabled={isDebouncing}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 px-3 text-center text-foreground">
                  No organizations match your search
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}