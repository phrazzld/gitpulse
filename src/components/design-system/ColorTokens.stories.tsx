import type { Meta, StoryObj } from '@storybook/react';
import { colors, type BrandColor, type SemanticColor } from '@/lib/design-tokens/colors';

const meta: Meta = {
  title: 'Design System/Color Tokens',
  parameters: {
    docs: {
      description: {
        component: `
# GitPulse Color Token System

A comprehensive, WCAG AA compliant color system organized by atomic design principles.

## Color Categories

- **Brand Colors**: Core visual identity colors that define the GitPulse brand
- **Semantic Colors**: Intent-based colors for consistent user experience
- **Component Colors**: Specific color schemes for UI components

All colors meet WCAG 2.1 AA accessibility standards with documented contrast ratios.

## Usage

Import colors from the design token system:

\`\`\`typescript
import { colors } from '@/lib/design-tokens/colors';

// Use semantic colors for intent-based styling
const primaryColor = colors.semantic.primary;
const successColor = colors.semantic.success;

// Use component-specific color schemes
const buttonColors = colors.components.button.primary;

// Generate CSS custom property references
const cssVar = colors.utils.getCSSVar('--color-primary', '#fallback');
\`\`\`

## Accessibility

All color combinations have been tested and approved for WCAG 2.1 AA compliance:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum  
- UI elements: 3:1 contrast ratio minimum

See [APPROVED_COLOR_PAIRINGS.md](/?path=/docs/accessibility-approved-color-pairings--docs) for detailed compliance information.
        `,
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component to display color swatches
const ColorSwatch: React.FC<{
  name: string;
  color: string;
  description?: string;
  contrastInfo?: string;
  usage?: string;
  textColor?: string;
}> = ({ name, color, description, contrastInfo, usage, textColor = '#ffffff' }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
    <div 
      className="h-24 flex items-center justify-center text-sm font-medium"
      style={{ backgroundColor: color, color: textColor }}
    >
      {color}
    </div>
    <div className="p-3 bg-white">
      <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
      {description && (
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      )}
      {contrastInfo && (
        <p className="text-xs text-green-700 mt-1 font-medium">{contrastInfo}</p>
      )}
      {usage && (
        <p className="text-xs text-blue-700 mt-1 italic">{usage}</p>
      )}
    </div>
  </div>
);

// Helper component for component color schemes
const ComponentColorScheme: React.FC<{
  title: string;
  scheme: any;
  variant?: string;
}> = ({ title, scheme, variant = '' }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <h4 className="font-semibold text-gray-900 mb-3">
      {title} {variant && <span className="text-sm text-gray-500">({variant})</span>}
    </h4>
    <div className="grid grid-cols-2 gap-2">
      <div 
        className="h-12 flex items-center justify-center text-xs font-medium rounded"
        style={{ 
          backgroundColor: scheme.background, 
          color: scheme.text,
          border: `1px solid ${scheme.border}`
        }}
      >
        Default State
      </div>
      {scheme.hover && (
        <div 
          className="h-12 flex items-center justify-center text-xs font-medium rounded"
          style={{ 
            backgroundColor: scheme.hover.background, 
            color: scheme.hover.text,
            border: `1px solid ${scheme.hover.border}`
          }}
        >
          Hover State
        </div>
      )}
    </div>
    <div className="mt-2 text-xs text-gray-600">
      <div>Background: {scheme.background}</div>
      <div>Text: {scheme.text}</div>
      <div>Border: {scheme.border}</div>
    </div>
  </div>
);

export const BrandColors: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Brand Colors</h2>
        <p className="text-gray-600 mb-8">
          Core visual identity colors that define the GitPulse cybernetic theme. 
          Use sparingly for accent and emphasis.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ColorSwatch
            name="Dark Slate"
            color={colors.brand.darkSlate}
            description="Main background color"
            contrastInfo="13.82:1 with white text"
            usage="Backgrounds, containers"
          />
          <ColorSwatch
            name="Accessible Green"
            color={colors.brand.accessibleGreen}
            description="WCAG AA compliant green"
            contrastInfo="3.51:1 for large text"
            usage="Success states, large text"
            textColor={colors.brand.darkSlate}
          />
          <ColorSwatch
            name="Electric Blue"
            color={colors.brand.electricBlue}
            description="WCAG AA compliant blue"
            contrastInfo="4.90:1 contrast ratio"
            usage="Links, interactive elements"
          />
          <ColorSwatch
            name="Dark Blue"
            color={colors.brand.darkBlue}
            description="High contrast blue"
            contrastInfo="7.54:1 with white text"
            usage="Button backgrounds"
          />
          <ColorSwatch
            name="Accessible Yellow"
            color={colors.brand.accessibleYellow}
            description="WCAG AA warning color"
            contrastInfo="4.69:1 contrast ratio"
            usage="Warning messages"
            textColor="#ffffff"
          />
          <ColorSwatch
            name="Accessible Red"
            color={colors.brand.accessibleRed}
            description="WCAG AA error color"
            contrastInfo="5.32:1 contrast ratio"
            usage="Error states, alerts"
          />
          <ColorSwatch
            name="Neon Green"
            color={colors.brand.neonGreen}
            description="Legacy brand green"
            contrastInfo="Decorative use only"
            usage="Glows, effects (not text)"
            textColor="#000000"
          />
          <ColorSwatch
            name="White"
            color={colors.brand.white}
            description="Pure white"
            contrastInfo="Maximum contrast"
            usage="Text on dark backgrounds"
            textColor="#000000"
          />
        </div>
      </div>
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Semantic Colors</h2>
        <p className="text-gray-600 mb-8">
          Intent-based colors that provide meaning and ensure consistent user experience.
          These should be your primary choice for component styling.
        </p>
        
        <div className="space-y-8">
          {/* State Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">State Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorSwatch
                name="Success"
                color={colors.semantic.success}
                description="Positive actions, completion"
                contrastInfo="3.51:1 for large text"
                usage="Success messages, checkmarks"
                textColor={colors.brand.darkSlate}
              />
              <ColorSwatch
                name="Warning"
                color={colors.semantic.warning}
                description="Caution, attention needed"
                contrastInfo="4.69:1 contrast ratio"
                usage="Warning alerts, validation"
                textColor="#ffffff"
              />
              <ColorSwatch
                name="Error"
                color={colors.semantic.error}
                description="Errors, destructive actions"
                contrastInfo="5.32:1 contrast ratio"
                usage="Error messages, delete buttons"
              />
              <ColorSwatch
                name="Info"
                color={colors.semantic.info}
                description="Informational content"
                contrastInfo="4.90:1 contrast ratio"
                usage="Info alerts, links"
              />
            </div>
          </div>

          {/* Text Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorSwatch
                name="Primary Text"
                color={colors.semantic.textPrimary}
                description="Main body text"
                contrastInfo="13.82:1 contrast"
                usage="Headings, body text"
                textColor="#000000"
              />
              <ColorSwatch
                name="Secondary Text"
                color={colors.semantic.textSecondary}
                description="Supporting text"
                contrastInfo="4.90:1 contrast"
                usage="Descriptions, captions"
              />
              <ColorSwatch
                name="Muted Text"
                color={colors.semantic.textMuted}
                description="Less important text"
                contrastInfo="3.51:1 for large text"
                usage="Timestamps, metadata"
                textColor={colors.brand.darkSlate}
              />
            </div>
          </div>

          {/* Interactive Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorSwatch
                name="Link"
                color={colors.semantic.link}
                description="Default link color"
                contrastInfo="4.90:1 contrast"
                usage="Hyperlinks, clickable text"
              />
              <ColorSwatch
                name="Link Hover"
                color={colors.semantic.linkHover}
                description="Link hover state"
                contrastInfo="3.51:1 for large text"
                usage="Hovered links"
                textColor={colors.brand.darkSlate}
              />
              <ColorSwatch
                name="Focus Ring"
                color={colors.semantic.focus}
                description="Focus indicator"
                contrastInfo="3:1 minimum contrast"
                usage="Keyboard focus outlines"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ComponentColors: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Component Colors</h2>
        <p className="text-gray-600 mb-8">
          Pre-defined color schemes for specific UI components. These ensure consistency
          and accessibility across all component instances.
        </p>
        
        <div className="space-y-8">
          {/* Button Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ComponentColorScheme
                title="Primary Button"
                variant="High emphasis"
                scheme={colors.components.button.primary}
              />
              <ComponentColorScheme
                title="Secondary Button"
                variant="Medium emphasis"
                scheme={colors.components.button.secondary}
              />
              <ComponentColorScheme
                title="Outline Button"
                variant="Low emphasis"
                scheme={colors.components.button.outline}
              />
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ComponentColorScheme
                title="Success Status"
                scheme={colors.components.status.success}
              />
              <ComponentColorScheme
                title="Warning Status"
                scheme={colors.components.status.warning}
              />
              <ComponentColorScheme
                title="Error Status"
                scheme={colors.components.status.error}
              />
              <ComponentColorScheme
                title="Info Status"
                scheme={colors.components.status.info}
              />
            </div>
          </div>

          {/* Form Colors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Elements</h3>
            <div className="max-w-md">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-semibold text-gray-900 mb-3">Input Field Colors</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.components.input.label }}>
                      Example Label
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder text"
                      className="w-full px-3 py-2 rounded border"
                      style={{
                        backgroundColor: colors.components.input.background,
                        color: colors.components.input.text,
                        borderColor: colors.components.input.border,
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Focused state"
                      className="w-full px-3 py-2 rounded border-2"
                      style={{
                        backgroundColor: colors.components.input.background,
                        color: colors.components.input.text,
                        borderColor: colors.components.input.borderFocus,
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Error state"
                      className="w-full px-3 py-2 rounded border-2"
                      style={{
                        backgroundColor: colors.components.input.background,
                        color: colors.components.input.text,
                        borderColor: colors.components.input.borderError,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <div>Background: {colors.components.input.background}</div>
                  <div>Text: {colors.components.input.text}</div>
                  <div>Border: {colors.components.input.border}</div>
                  <div>Focus: {colors.components.input.borderFocus}</div>
                  <div>Error: {colors.components.input.borderError}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ContrastRatios: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">WCAG Contrast Compliance</h2>
        <p className="text-gray-600 mb-8">
          All color combinations in the GitPulse design system meet or exceed WCAG 2.1 AA 
          accessibility standards. Below are the documented contrast ratios for each approved pairing.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Approved Color Pairings</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-semibold text-gray-900">Color Combination</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Contrast Ratio</th>
                    <th className="text-left py-2 font-semibold text-gray-900">WCAG Level</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Usage</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">White on Dark Blue</td>
                    <td className="py-3 font-medium text-green-600">7.54:1</td>
                    <td className="py-3">AA (Normal)</td>
                    <td className="py-3">Primary buttons, high emphasis</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.darkBlue, color: colors.brand.white }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">White on Electric Blue</td>
                    <td className="py-3 font-medium text-green-600">5.17:1</td>
                    <td className="py-3">AA (Normal)</td>
                    <td className="py-3">Secondary buttons, medium emphasis</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.electricBlue, color: colors.brand.white }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">Electric Blue on Light Gray</td>
                    <td className="py-3 font-medium text-green-600">4.90:1</td>
                    <td className="py-3">AA (Normal)</td>
                    <td className="py-3">Links, interactive text</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.lightGray, color: colors.brand.electricBlue }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">Accessible Green on Light Gray</td>
                    <td className="py-3 font-medium text-green-600">3.51:1</td>
                    <td className="py-3">AA (Large)</td>
                    <td className="py-3">Large text, success indicators</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.lightGray, color: colors.brand.accessibleGreen }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">Accessible Yellow on Dark Slate</td>
                    <td className="py-3 font-medium text-green-600">4.69:1</td>
                    <td className="py-3">AA (Normal)</td>
                    <td className="py-3">Warning messages, caution text</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.darkSlate, color: colors.brand.accessibleYellow }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Accessible Red on Light Gray</td>
                    <td className="py-3 font-medium text-green-600">5.32:1</td>
                    <td className="py-3">AA (Normal)</td>
                    <td className="py-3">Error messages, destructive actions</td>
                    <td className="py-3">
                      <div 
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.brand.lightGray, color: colors.brand.accessibleRed }}
                      >
                        Sample Text
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">WCAG 2.1 Standards</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• <strong>Normal text (AA):</strong> 4.5:1 contrast ratio minimum</li>
            <li>• <strong>Large text (AA):</strong> 3:1 contrast ratio minimum</li>
            <li>• <strong>Normal text (AAA):</strong> 7:1 contrast ratio minimum</li>
            <li>• <strong>Large text (AAA):</strong> 4.5:1 contrast ratio minimum</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

export const Usage: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Use Color Tokens</h2>
        
        <div className="space-y-8">
          {/* Import Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Color Tokens</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { colors } from '@/lib/design-tokens/colors';

// Access different color categories
const brandColors = colors.brand;
const semanticColors = colors.semantic;
const componentColors = colors.components;`}
            </pre>
          </div>

          {/* CSS Variables Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Using CSS Custom Properties</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`/* Use semantic color tokens in CSS */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border: 1px solid var(--color-border);
}

/* Button component example */
.my-button {
  background-color: var(--brand-dark-blue);
  color: var(--brand-white);
  /* 7.54:1 contrast ratio - WCAG AA compliant */
}

/* Status indicator example */
.success-message {
  background-color: var(--color-success);
  color: var(--color-success-text);
  /* 3.51:1 contrast for large text */
}`}
            </pre>
          </div>

          {/* Component Usage */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">React Component Usage</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { colors } from '@/lib/design-tokens/colors';

// Using component color schemes
const MyButton: React.FC = () => {
  const buttonColors = colors.components.button.primary;
  
  return (
    <button
      style={{
        backgroundColor: buttonColors.background,
        color: buttonColors.text,
        border: \`1px solid \${buttonColors.border}\`
      }}
    >
      Click me
    </button>
  );
};

// Using semantic colors
const StatusMessage: React.FC<{ type: 'success' | 'error' }> = ({ type }) => {
  const bgColor = type === 'success' 
    ? colors.semantic.success 
    : colors.semantic.error;
  const textColor = type === 'success'
    ? colors.semantic.successText
    : colors.semantic.errorText;
    
  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {type === 'success' ? 'Operation completed!' : 'Error occurred!'}
    </div>
  );
};`}
            </pre>
          </div>

          {/* Utility Functions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Utility Functions</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { colors } from '@/lib/design-tokens/colors';

// Generate CSS variable with fallback
const primaryColor = colors.utils.getCSSVar('--color-primary', '#1b2b34');
// Returns: 'var(--color-primary, #1b2b34)'

// Get component color schemes
const buttonScheme = colors.utils.getComponentColors('button');
// Returns: entire button color configuration

// Check accessibility information
const greenInfo = colors.utils.getAccessibilityInfo(colors.brand.accessibleGreen);
// Returns: { wcagCompliant: true, recommendedUse: '...', contrastNote: '...' }`}
            </pre>
          </div>

          {/* Best Practices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Practices</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong>Use semantic colors first:</strong> Choose semantic colors for most use cases 
                  (success, error, primary) rather than brand colors directly.
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong>Leverage component schemes:</strong> Use pre-defined component color schemes 
                  for consistent styling across similar UI elements.
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong>Always verify accessibility:</strong> All color combinations in this system 
                  are WCAG AA compliant, but verify when creating custom combinations.
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong>Use CSS custom properties:</strong> Prefer CSS variables for better theme 
                  support and easier maintenance.
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <strong>Reference documentation:</strong> See APPROVED_COLOR_PAIRINGS.md for 
                  detailed accessibility compliance information.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};