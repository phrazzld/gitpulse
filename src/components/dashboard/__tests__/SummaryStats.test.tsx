import React from 'react'
import SummaryStats from '../SummaryStats'
import { CommitSummary } from '@/types/dashboard'

// Create mock element for testing
interface MockElement {
  type: string
  props: Record<string, any>
  children?: MockElement[] | string | number
}

interface MockRenderer {
  render: (component: React.ReactElement) => MockElement
}

const createMockRenderer = (): MockRenderer => {
  return {
    render: (component: React.ReactElement): MockElement => {
      // Extract type and props from component
      const type = component.type
      const props = component.props as Record<string, any>

      let renderedType = ''
      if (typeof type === 'string') {
        renderedType = type
      } else if (typeof type === 'function') {
        // For function components, use the name
        renderedType = type.name || 'Unknown'
      } else {
        renderedType = 'Unknown'
      }

      let children: MockElement[] | string | number | undefined

      // Handle children prop
      if (props.children) {
        if (Array.isArray(props.children)) {
          children = props.children.map((child: any) => {
            if (React.isValidElement(child)) {
              // @ts-ignore - We know the render method exists on our renderer
              return this.render(child)
            }
            return child
          })
        } else if (React.isValidElement(props.children)) {
          // @ts-ignore - We know the render method exists on our renderer
          children = this.render(props.children)
        } else {
          children = props.children
        }
      }

      // Create the rendered element
      const renderedElement: MockElement = {
        type: renderedType,
        props: { ...props, children: undefined },
      }

      if (children !== undefined) {
        renderedElement.children = children
      }

      return renderedElement
    },
  }
}

describe('SummaryStats', () => {
  // Test data
  const mockSummary: CommitSummary = {
    user: 'testuser',
    commits: [],
    stats: {
      totalCommits: 42,
      repositories: ['repo1', 'repo2', 'repo3'],
      dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'],
    },
  }

  // Create the mock renderer
  const mockRenderer = createMockRenderer()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with the correct metrics overview title', () => {
    const rendered = mockRenderer.render(<SummaryStats summary={mockSummary} />)

    const renderedJson = JSON.stringify(rendered)
    expect(renderedJson).toContain('METRICS OVERVIEW')
  })

  test('displays commit count correctly', () => {
    const rendered = mockRenderer.render(<SummaryStats summary={mockSummary} />)

    const renderedJson = JSON.stringify(rendered)
    expect(renderedJson).toContain('COMMIT COUNT')
    expect(renderedJson).toContain('42') // The total commits value
  })

  test('displays repository count correctly', () => {
    const rendered = mockRenderer.render(<SummaryStats summary={mockSummary} />)

    const renderedJson = JSON.stringify(rendered)
    expect(renderedJson).toContain('REPOSITORIES')
    expect(renderedJson).toContain('3') // The length of the repositories array
  })

  test('displays active days count correctly', () => {
    const rendered = mockRenderer.render(<SummaryStats summary={mockSummary} />)

    const renderedJson = JSON.stringify(rendered)
    expect(renderedJson).toContain('ACTIVE DAYS')
    expect(renderedJson).toContain('4') // The length of the dates array
  })

  test('applies additional className when provided', () => {
    const rendered = mockRenderer.render(
      <SummaryStats summary={mockSummary} className="additional-class" />
    )

    expect(rendered.props.className).toContain('additional-class')
  })

  test('renders with zero values when stats are empty', () => {
    const emptySummary: CommitSummary = {
      user: 'testuser',
      commits: [],
      stats: {
        totalCommits: 0,
        repositories: [],
        dates: [],
      },
    }

    const rendered = mockRenderer.render(<SummaryStats summary={emptySummary} />)

    const renderedJson = JSON.stringify(rendered)
    expect(renderedJson).toContain('0') // The totalCommits value
    expect(renderedJson).toContain('0') // The repositories length (rendered as 0)
    expect(renderedJson).toContain('0') // The dates length (rendered as 0)
  })
})
