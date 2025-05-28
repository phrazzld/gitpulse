import type { Meta, StoryObj } from '@storybook/react';
import OperationsPanel from './OperationsPanel';
import { ActivityMode } from '@/components/atoms/ModeSelector';
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
 *
 * ## Accessibility Features
 *
 * As a complex organism, OperationsPanel implements comprehensive accessibility patterns:
 *
 * ### Purpose & User Impact
 * The OperationsPanel serves as the primary control interface for data analysis. For users with disabilities, proper accessibility ensures they can configure analysis parameters, understand system status, and navigate complex interactions effectively. Poor implementation can block access to core functionality.
 *
 * ### Landmark Structure
 * - Uses semantic `<section>` with `role="region"` and accessible labels
 * - Provides clear content structure for screen reader navigation
 * - Groups related controls logically
 *
 * ### Dynamic Content Handling
 * - Loading states are announced with `aria-busy` and live regions
 * - Error messages use `role="alert"` for immediate announcement
 * - Status changes are communicated to assistive technology
 *
 * ### Complex Interaction Patterns
 * - Nested form controls maintain proper labeling relationships
 * - Multi-step workflows preserve focus management
 * - Progressive disclosure maintains keyboard navigation flow
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
        component: `OperationsPanel is an organism component that provides a centralized control interface for the commit analysis functionality. It displays errors, authentication status, and allows users to select organizations, modes, and filters.

## Accessibility Implementation

### Keyboard Navigation
| Key | Action | Context |
|-----|--------|---------|
| \`Tab\` | Navigate between controls | Logical order through all interactive elements |
| \`Shift + Tab\` | Navigate backwards | Reverse tab order |
| \`Enter\` / \`Space\` | Activate buttons | Standard button activation |
| \`Arrow Keys\` | Navigate radio groups | Within ModeSelector component |

### Screen Reader Support
- **Region Landmarks**: Uses \`role="region"\` with \`aria-label\` for main control area
- **Error Announcements**: Error messages use \`role="alert"\` for immediate announcement
- **Loading States**: Uses \`aria-busy\` and live regions for status updates
- **Form Labels**: All form controls have proper label associations
- **Group Semantics**: Related controls are grouped with appropriate ARIA attributes

### ARIA Patterns
| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| \`role="region"\` | Main panel container | Identifies control panel landmark |
| \`aria-label\` | Panel and sections | Provides accessible names for regions |
| \`role="alert"\` | Error messages | Immediate screen reader announcement |
| \`aria-busy\` | Loading states | Indicates processing status |
| \`aria-live\` | Status updates | Announces dynamic content changes |

### Focus Management
1. **Error States**: Focus moves to error message when errors occur
2. **Loading States**: Focus remains stable during loading
3. **Dynamic Updates**: Focus preservation during content changes
4. **Modal Interactions**: Proper focus trapping and restoration

### Color Contrast
- All text meets WCAG AA 4.5:1 contrast ratio
- Interactive elements meet 3:1 contrast minimum
- Error states use sufficient contrast for visibility
- Focus indicators meet 3:1 contrast requirements
        `
      }
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'landmark-one-main',
            enabled: true
          },
          {
            id: 'region',
            enabled: true
          },
          {
            id: 'aria-allowed-attr',
            enabled: true
          },
          {
            id: 'aria-required-attr',
            enabled: true
          },
          {
            id: 'button-name',
            enabled: true
          },
          {
            id: 'form-field-multiple-labels',
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