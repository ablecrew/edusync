import { useEffect, useState, useCallback } from 'react';

const DESKTOP_KEY = 'edusync_sidebar_desktop';
const TABLET_KEY  = 'edusync_sidebar_tablet';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

export function useSidebar() {
  const bp = useBreakpoint();

  // Mobile: drawer open/closed. Not persisted (always starts closed).
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop + tablet: collapsed state, persisted separately per breakpoint.
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(DESKTOP_KEY) === '1'; } catch { return false; }
  });
  const [tabletCollapsed, setTabletCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(TABLET_KEY) !== '0'; } catch { return true; } // default collapsed on tablet
  });

  useEffect(() => { try { localStorage.setItem(DESKTOP_KEY, desktopCollapsed ? '1' : '0'); } catch {} }, [desktopCollapsed]);
  useEffect(() => { try { localStorage.setItem(TABLET_KEY,  tabletCollapsed  ? '1' : '0'); } catch {} }, [tabletCollapsed]);

  // Close mobile drawer when the viewport grows past mobile
  useEffect(() => { if (bp !== 'mobile' && mobileOpen) setMobileOpen(false); }, [bp, mobileOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (bp !== 'mobile') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, bp]);

  // Escape key closes the drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const collapsed = bp === 'desktop' ? desktopCollapsed : bp === 'tablet' ? tabletCollapsed : false;

  const toggleCollapsed = useCallback(() => {
    if (bp === 'desktop') setDesktopCollapsed(x => !x);
    else if (bp === 'tablet') setTabletCollapsed(x => !x);
  }, [bp]);

  const openMobile  = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return {
    bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    collapsed,
    mobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
  };
}