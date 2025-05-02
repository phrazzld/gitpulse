import type { Meta, StoryObj } from '@storybook/react';
import OperationsPanel from './OperationsPanel';
import { ActivityMode } from '@/components/ui/ModeSelector';
import { FilterState, Installation } from '@/types/dashboard';

/**
 * OperationsPanel stories showcase a complex organism component that serves as the
 * main control panel for the commit analysis functionality.
 * 
 * Features:
 * - Error display with GitHub App installation prompts
 * - Authentication status indicators
 * - Account/organization selection
 * - Activity mode switching
 * - Filters for repositories and organizations
 * 
 * This component receives data and callbacks via props from a custom hook
 * (useOperationsPanel) in the parent component.
 */
const meta: Meta<typeof OperationsPanel> = {
  title: 'Organisms/OperationsPanel',
  component: OperationsPanel,
  tags: ['autodocs'],
  argTypes: {
    error: {
      description: 'Current error message to display',
      control: 'text',
    },
    loading: {
      description: 'Whether the panel is in a loading state',
      control: 'boolean',
    },
    needsInstallation: {
      description: 'Whether GitHub App installation is needed',
      control: 'boolean',
    },
    authMethod: {
      description: 'Authentication method (github_app or oauth)',
      control: 'select',
      options: ['github_app', 'oauth', null],
    },
    installations: {
      description: 'List of available GitHub App installations',
      control: 'object',
    },
    currentInstallations: {
      description: 'List of current GitHub App installations',
      control: 'object',
    },
    activityMode: {
      description: 'Current activity mode',
      control: 'select',
      options: ['my-activity', 'my-work-activity', 'team-activity'],
    },
    activeFilters: {
      description: 'Current active filters',
      control: 'object',
    },
    userName: {
      description: 'Current user\'s name',
      control: 'text',
    },
    installationUrl: {
      description: 'URL for GitHub App installation',
      control: 'text',
    },
    isGitHubAppAuth: {
      description: 'Whether the authentication method is GitHub App',
      control: 'boolean',
    },
    hasInstallations: {
      description: 'Whether there are available installations',
      control: 'boolean',
    },
    onModeChange: {
      description: 'Function to handle activity mode changes',
      action: 'mode changed',
    },
    onOrganizationChange: {
      description: 'Function to handle organization selection changes',
      action: 'organizations changed',
    },
    onFilterChange: {
      description: 'Function to handle filter changes',
      action: 'filters changed',
    },
    onSwitchInstallations: {
      description: 'Function to switch between GitHub installations',
      action: 'installations switched',
    },
    onSignOut: {
      description: 'Function to sign out',
      action: 'signed out',
    },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1b2b34' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    docs: {
      description: {
        component: 'OperationsPanel is an organism component that provides a centralized control interface for the commit analysis functionality. It displays errors, authentication status, and allows users to select organizations, modes, and filters. This component is a pure presentation component that receives all data and callbacks via props.'
      }
    },
    a11y: {
      config: {
        rules: [
          {
            // Ensure proper contrast ratio
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof OperationsPanel>;

// Mock installation data
const mockInstallations: Installation[] = [
  {
    id: 1,
    account: {
      login: 'acme-org',
      type: 'Organization',
      avatarUrl: 'https://github.com/acme-org.png'
    },
    appSlug: 'gitpulse',
    appId: 12345,
    repositorySelection: 'all',
    targetType: 'Organization'
  },
  {
    id: 2,
    account: {
      login: 'tech-innovators',
      type: 'Organization',
      avatarUrl: 'https://github.com/tech-innovators.png'
    },
    appSlug: 'gitpulse',
    appId: 12345,
    repositorySelection: 'all',
    targetType: 'Organization'
  }
];

// Default active filters
const defaultActiveFilters = {
  contributors: ['me'] as string[],
  organizations: [] as string[],
  repositories: [] as string[]
};

/**
 * Default state of the OperationsPanel with GitHub App authentication and one installation.
 * 
 * This represents the most common state of the panel during normal operation.
 */
export const Default: Story = {
  args: {
    error: null,
    loading: false,
    needsInstallation: false,
    authMethod: 'github_app',
    installations: mockInstallations,
    currentInstallations: [mockInstallations[0]],
    activityMode: 'my-activity',
    activeFilters: defaultActiveFilters,
    userName: 'Developer',
    installationUrl: 'https://github.com/apps/gitpulse/installations/new',
    isGitHubAppAuth: true,
    hasInstallations: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state showing GitHub App authentication with one organization installation. This is the typical state during normal operation with no errors.'
      }
    }
  }
};

/**
 * OperationsPanel in loading state, showing loading indicators.
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state that shows when data is being fetched. The component displays loading indicators and disables interactive elements.'
      }
    }
  }
};

/**
 * OperationsPanel displaying an error message.
 */
export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Unable to fetch repository data. Please try again later.'
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state displayed when there is a problem fetching data. The error message is shown prominently with appropriate styling.'
      }
    }
  }
};

/**
 * OperationsPanel showing GitHub App installation needed error.
 */
export const NeedsInstallation: Story = {
  args: {
    ...Default.args,
    error: 'GitHub App installation required to access repositories.',
    needsInstallation: true,
    hasInstallations: false,
    currentInstallations: []
  },
  parameters: {
    docs: {
      description: {
        story: 'This state is shown when the user needs to install the GitHub App to access repositories. It provides a prompt with an installation link.'
      }
    }
  }
};

/**
 * OperationsPanel with OAuth authentication instead of GitHub App.
 */
export const OAuthAuthentication: Story = {
  args: {
    ...Default.args,
    authMethod: 'oauth',
    isGitHubAppAuth: false,
    installations: [],
    currentInstallations: []
  },
  parameters: {
    docs: {
      description: {
        story: 'State showing OAuth authentication instead of GitHub App. OAuth provides different capabilities and the interface adapts accordingly.'
      }
    }
  }
};

/**
 * OperationsPanel with team activity mode selected.
 */
export const TeamActivityMode: Story = {
  args: {
    ...Default.args,
    activityMode: 'team-activity',
    activeFilters: {
      ...defaultActiveFilters,
      contributors: ['all']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel configured for team activity mode, showing commits from all contributors in the selected organizations.'
      }
    }
  }
};

/**
 * OperationsPanel with active organization filters.
 */
export const WithOrganizationFilters: Story = {
  args: {
    ...Default.args,
    activeFilters: {
      ...defaultActiveFilters,
      organizations: ['acme-org', 'tech-innovators']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with organization filters applied. The panel shows which organizations are currently selected for filtering.'
      }
    }
  }
};

/**
 * OperationsPanel with multiple installations and active repository filters.
 */
export const WithRepositoryFilters: Story = {
  args: {
    ...Default.args,
    currentInstallations: mockInstallations,
    activeFilters: {
      ...defaultActiveFilters,
      repositories: ['acme-org/project-a', 'tech-innovators/api-service']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with multiple installations and repository filters applied. Shows how the panel handles more complex filtering scenarios.'
      }
    }
  }
};

/**
 * OperationsPanel with authentication error requiring sign out.
 */
export const AuthenticationError: Story = {
  args: {
    ...Default.args,
    error: 'Authentication token expired or invalid. Please sign out and sign in again.',
    loading: false,
    needsInstallation: false
  },
  parameters: {
    docs: {
      description: {
        story: 'State showing an authentication error that requires the user to sign out and sign in again. Displays an appropriate error message with action button.'
      }
    }
  }
};

/**
 * OperationsPanel with no installations but GitHub App auth.
 */
export const NoInstallations: Story = {
  args: {
    ...Default.args,
    installations: [],
    currentInstallations: [],
    hasInstallations: false,
    needsInstallation: true,
    error: 'No GitHub App installations found. Please install the app to continue.'
  },
  parameters: {
    docs: {
      description: {
        story: 'State shown when the user has authenticated with GitHub App but has no installations. Prompts the user to install the app in their organizations.'
      }
    }
  }
};