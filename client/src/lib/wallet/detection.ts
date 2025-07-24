// MetaMask detection and installation utilities

import type { MetaMaskProvider } from './types';

export const detectMetaMask = (): MetaMaskProvider | null => {
  if (typeof window === 'undefined') return null;
  
  const { ethereum } = window;
  
  if (ethereum && ethereum.isMetaMask) {
    return ethereum;
  }
  
  return null;
};

export const isMetaMaskInstalled = (): boolean => {
  return detectMetaMask() !== null;
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isMetaMaskMobile = (): boolean => {
  const userAgent = navigator.userAgent;
  return userAgent.includes('MetaMaskMobile');
};

export const getMetaMaskInstallUrl = (): string => {
  if (isMobileDevice()) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return 'https://apps.apple.com/app/metamask/id1438144202';
    } else {
      return 'https://play.google.com/store/apps/details?id=io.metamask';
    }
  }
  
  return 'https://metamask.io/download/';
};

export const createMetaMaskDeepLink = (dappUrl: string): string => {
  return `https://metamask.app.link/dapp/${dappUrl}`;
};

export const openMetaMaskMobile = (dappUrl?: string): void => {
  if (isMobileDevice() && !isMetaMaskMobile()) {
    const deepLink = createMetaMaskDeepLink(dappUrl || window.location.host);
    window.location.href = deepLink;
  }
};

export const waitForMetaMask = (timeout = 3000): Promise<MetaMaskProvider> => {
  return new Promise((resolve, reject) => {
    if (isMetaMaskInstalled()) {
      resolve(detectMetaMask()!);
      return;
    }

    let attempts = 0;
    const maxAttempts = timeout / 100;

    const checkForMetaMask = () => {
      if (isMetaMaskInstalled()) {
        resolve(detectMetaMask()!);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        reject(new Error('MetaMask not found'));
        return;
      }

      setTimeout(checkForMetaMask, 100);
    };

    checkForMetaMask();
  });
};