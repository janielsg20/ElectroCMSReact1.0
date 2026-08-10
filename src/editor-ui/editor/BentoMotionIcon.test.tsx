import { render, screen } from '@testing-library/react'
import BentoMotionIcon from './BentoMotionIcon'

vi.mock('lottie-react', () => ({
  default: ({ autoplay, loop }: { readonly autoplay: boolean; readonly loop: boolean }) => (
    <span data-autoplay={String(autoplay)} data-loop={String(loop)} data-testid="lottie-runtime" />
  ),
}))

describe('BentoMotionIcon', () => {
  it('reproduce una sola vez cuando el sistema permite movimiento', () => {
    const originalMatchMedia = window.matchMedia?.bind(window)
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })

    render(<BentoMotionIcon />)

    expect(screen.getByTestId('lottie-runtime')).toHaveAttribute('data-autoplay', 'true')
    expect(screen.getByTestId('lottie-runtime')).toHaveAttribute('data-loop', 'false')
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else Reflect.deleteProperty(window, 'matchMedia')
  })

  it('detiene el autoplay con prefers-reduced-motion', () => {
    const originalMatchMedia = window.matchMedia?.bind(window)
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })

    render(<BentoMotionIcon />)

    expect(screen.getByTestId('lottie-runtime')).toHaveAttribute('data-autoplay', 'false')
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else Reflect.deleteProperty(window, 'matchMedia')
  })
})
