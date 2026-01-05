'use client';

import { useEffect } from 'react';

// 扩展 Window 接口以支持 Matomo Tag Manager
declare global {
  interface Window {
    _mtm?: Array<any>;
  }
}

interface MatomoTrackerProps {
  containerUrl?: string;
}

export default function MatomoTracker({ containerUrl }: MatomoTrackerProps) {
  useEffect(() => {
    if (!containerUrl) {
      console.warn('Matomo 容器 URL 未配置');
      return;
    }

    // 初始化 Matomo Tag Manager
    const _mtm = (window._mtm = window._mtm || []);
    _mtm.push({ 'mtm.startTime': new Date().getTime(), event: 'mtm.Start' });
    
    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    
    g.async = true;
    g.src = containerUrl;
    if (s.parentNode) {
      s.parentNode.insertBefore(g, s);
    }
  }, [containerUrl]);

  return null;
}

