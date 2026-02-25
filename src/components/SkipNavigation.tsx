/**
 * Skip Navigation Component
 * Accessibility feature for keyboard users to skip to main content
 * WCAG 2.1 Level A requirement
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-[#111827] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111827] transition-all"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '14px'
      }}
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only class for visually hiding content
 * while keeping it accessible to assistive technologies
 */
export const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  .sr-only:not(.focus\\:not-sr-only) {
    position: absolute !important;
  }
  
  .focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;
