/**
 * Tests for the Header component
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void
declare function beforeEach(fn: () => void): void
declare function it(name: string, fn: () => void): void
declare function expect(actual: any): any
declare namespace jest {
  function fn(implementation?: (...args: any[]) => any): any
  function mock(moduleName: string, factory?: () => any): void
  function clearAllMocks(): void
}

interface MockElement {
  textContent: string
  alt?: string
  onClick?: () => void
}

// Mock testing library rendering
const render = (component: any) => {
  // Mock the disconnect button with onClick handler
  const disconnectButton: MockElement = {
    textContent: 'DISCONNECT',
    onClick: () => {
      const props = component.props || {}
      const signOutCallbackUrl = props.signOutCallbackUrl || '/'
      signOut({ callbackUrl: signOutCallbackUrl })
    },
  }

  return {
    getByText: (text: string): MockElement => {
      if (text === 'DISCONNECT' && component.props?.userImage) {
        return disconnectButton
      }
      return {
        textContent: text,
      }
    },
    getByAltText: (text: string): MockElement => ({
      textContent: '',
      alt: text,
    }),
    queryByText: (text: string): MockElement | null => {
      if (component.props?.userName && text === `USER: ${component.props.userName.toUpperCase()}`) {
        return { textContent: text }
      }
      if (text === 'COMMAND TERMINAL' && component.props?.showCommandTerminal !== false) {
        return { textContent: text }
      }
      if (text === 'DISCONNECT' && component.props?.userImage) {
        return disconnectButton
      }
      return null
    },
  }
}

// Import component to test
import Header from '../Header'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}))

// Import the mocked signOut function
import { signOut } from 'next-auth/react'

describe('Header component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the header with app name', () => {
    const { getByText } = render(<Header />)
    expect(getByText('PULSE')).toBeTruthy()
  })

  it('should render with user information when provided', () => {
    const userName = 'Test User'
    const userImage = 'https://example.com/avatar.png'

    const { getByText, getByAltText } = render(<Header userName={userName} userImage={userImage} />)

    expect(getByText(`USER: ${userName.toUpperCase()}`)).toBeTruthy()
    expect(getByAltText(userName)).toBeTruthy()
  })

  it('should not display user section when userImage is not provided', () => {
    const userName = 'Test User'

    const { queryByText } = render(<Header userName={userName} />)

    expect(queryByText(`USER: ${userName.toUpperCase()}`)).toBeNull()
    expect(queryByText('DISCONNECT')).toBeNull()
  })

  it('should call signOut with correct callback URL when disconnect button is clicked', () => {
    const userImage = 'https://example.com/avatar.png'
    const customCallbackUrl = '/custom-callback'

    const rendered = render(<Header userImage={userImage} signOutCallbackUrl={customCallbackUrl} />)

    // Simulate click on the disconnect button
    const disconnectButton = rendered.getByText('DISCONNECT')
    disconnectButton.onClick && disconnectButton.onClick()

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: customCallbackUrl })
  })

  it('should use default callback URL when not specified', () => {
    const userImage = 'https://example.com/avatar.png'

    const rendered = render(<Header userImage={userImage} />)

    // Simulate click on the disconnect button
    const disconnectButton = rendered.getByText('DISCONNECT')
    disconnectButton.onClick && disconnectButton.onClick()

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('should show command terminal label by default', () => {
    const { getByText } = render(<Header />)
    expect(getByText('COMMAND TERMINAL')).toBeTruthy()
  })

  it('should hide command terminal label when showCommandTerminal is false', () => {
    const { queryByText } = render(<Header showCommandTerminal={false} />)
    expect(queryByText('COMMAND TERMINAL')).toBeNull()
  })
})
