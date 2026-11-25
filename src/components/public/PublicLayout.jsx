import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { themeStyle } from '@/lib/websiteSettings';

export default function PublicLayout() {
  const { settings } = useWebsiteSettings();

  return (
    <div className="min-h-screen bg-background flex flex-col" style={themeStyle(settings)}>
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}