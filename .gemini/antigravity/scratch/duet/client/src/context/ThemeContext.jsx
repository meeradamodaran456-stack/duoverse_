import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('couple-theme') || 'ROMANTIC');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('couple-accent') || '#EC4899');
  const [wallpaperUrl, setWallpaperUrl] = useState(localStorage.getItem('couple-wallpaper') || '');
  const [fontName, setFontName] = useState(localStorage.getItem('couple-font') || 'Outfit');
  const [secondaryColor, setSecondaryColor] = useState(localStorage.getItem('couple-secondary') || null);
  const [bubbleColor, setBubbleColor] = useState(localStorage.getItem('couple-bubble') || null);
  const [animatedEffect, setAnimatedEffect] = useState(localStorage.getItem('couple-anim') || null);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all previous theme classes
    root.classList.remove('theme-romantic', 'theme-midnight', 'theme-sunset', 'theme-light');
    
    // Add new theme class
    root.classList.add(`theme-${theme.toLowerCase()}`);
    
    // Save locally
    localStorage.setItem('couple-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Set custom CSS variable for accent color
    const root = document.documentElement;
    root.style.setProperty('--accent', accentColor);
    
    // Set lighter accent variant automatically
    const lighter = accentColor + 'cc'; // add opacity
    root.style.setProperty('--accent-light', lighter);

    localStorage.setItem('couple-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    if (wallpaperUrl) {
      root.style.setProperty('--wallpaper-url', `url(${wallpaperUrl})`);
      localStorage.setItem('couple-wallpaper', wallpaperUrl);
    } else {
      root.style.setProperty('--wallpaper-url', 'none');
      localStorage.removeItem('couple-wallpaper');
    }
  }, [wallpaperUrl]);

  useEffect(() => {
    const root = document.documentElement;
    if (fontName) {
      root.style.setProperty('--font-family', `"${fontName}", sans-serif`);
      localStorage.setItem('couple-font', fontName);
    }
  }, [fontName]);

  useEffect(() => {
    const root = document.documentElement;
    if (secondaryColor) {
      root.style.setProperty('--secondary', secondaryColor);
      localStorage.setItem('couple-secondary', secondaryColor);
    } else {
      root.style.setProperty('--secondary', 'var(--primary)');
      localStorage.removeItem('couple-secondary');
    }
  }, [secondaryColor]);

  useEffect(() => {
    const root = document.documentElement;
    if (bubbleColor) {
      root.style.setProperty('--bubble-color', bubbleColor);
      localStorage.setItem('couple-bubble', bubbleColor);
    } else {
      root.style.removeProperty('--bubble-color');
      localStorage.removeItem('couple-bubble');
    }
  }, [bubbleColor]);

  useEffect(() => {
    if (animatedEffect) localStorage.setItem('couple-anim', animatedEffect);
    else localStorage.removeItem('couple-anim');
  }, [animatedEffect]);

  // Load customizations from backend
  const loadCustomizations = (config) => {
    if (config) {
      if (config.themeName) setTheme(config.themeName);
      if (config.accentColor) setAccentColor(config.accentColor);
      if (config.wallpaperUrl !== undefined) setWallpaperUrl(config.wallpaperUrl);
      if (config.fontName) setFontName(config.fontName);
      if (config.secondaryColor !== undefined) setSecondaryColor(config.secondaryColor);
      if (config.bubbleColor !== undefined) setBubbleColor(config.bubbleColor);
      if (config.animatedEffect !== undefined) setAnimatedEffect(config.animatedEffect);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme, setTheme,
        accentColor, setAccentColor,
        wallpaperUrl, setWallpaperUrl,
        fontName, setFontName,
        secondaryColor, setSecondaryColor,
        bubbleColor, setBubbleColor,
        animatedEffect, setAnimatedEffect,
        loadCustomizations
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
