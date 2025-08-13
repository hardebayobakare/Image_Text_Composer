import type { GoogleFont } from '@/lib/types';

const fontsLoaded = new Set<string>();

// Comprehensive fallback fonts for offline use
const FALLBACK_FONTS: GoogleFont[] = [
  // Popular Sans-Serif Fonts
  { family: 'Inter', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['100', '300', '400', '500', '700', '900'], category: 'sans-serif' },
  { family: 'Open Sans', variants: ['300', '400', '600', '700', '800'], category: 'sans-serif' },
  { family: 'Lato', variants: ['100', '300', '400', '700', '900'], category: 'sans-serif' },
  { family: 'Montserrat', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Poppins', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Source Sans Pro', variants: ['200', '300', '400', '600', '700', '900'], category: 'sans-serif' },
  { family: 'Nunito', variants: ['200', '300', '400', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Raleway', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Ubuntu', variants: ['300', '400', '500', '700'], category: 'sans-serif' },
  { family: 'Work Sans', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  
  // Serif Fonts
  { family: 'Playfair Display', variants: ['400', '500', '600', '700', '800', '900'], category: 'serif' },
  { family: 'Merriweather', variants: ['300', '400', '700', '900'], category: 'serif' },
  { family: 'Lora', variants: ['400', '500', '600', '700'], category: 'serif' },
  { family: 'PT Serif', variants: ['400', '700'], category: 'serif' },
  { family: 'Crimson Text', variants: ['400', '600', '700'], category: 'serif' },
  
  // Display Fonts
  { family: 'Oswald', variants: ['200', '300', '400', '500', '600', '700'], category: 'display' },
  { family: 'Bebas Neue', variants: ['400'], category: 'display' },
  { family: 'Abril Fatface', variants: ['400'], category: 'display' },
  { family: 'Righteous', variants: ['400'], category: 'display' },
  
  // Handwriting
  { family: 'Dancing Script', variants: ['400', '500', '600', '700'], category: 'handwriting' },
  { family: 'Pacifico', variants: ['400'], category: 'handwriting' },
  { family: 'Caveat', variants: ['400', '500', '600', '700'], category: 'handwriting' },
  
  // Monospace
  { family: 'Roboto Mono', variants: ['100', '200', '300', '400', '500', '600', '700'], category: 'monospace' },
  { family: 'Source Code Pro', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], category: 'monospace' },
];

export async function loadGoogleFonts(): Promise<GoogleFont[]> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    
    if (!key) {
      console.warn('Google Fonts API key not found, using fallback fonts');
      return FALLBACK_FONTS;
    }

    // Fetch fonts sorted by popularity with no limit to get all fonts
    const response = await fetch(
      `https://webfonts.googleapis.com/v1/webfonts?key=${key}&sort=popularity`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.warn(`Google Fonts API error: ${response.status} ${response.statusText}`);
      return FALLBACK_FONTS;
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      console.warn('Invalid response format from Google Fonts API');
      return FALLBACK_FONTS;
    }

    // Transform and filter the fonts
    const fonts: GoogleFont[] = data.items
      .map((font: any) => ({
        family: font.family,
        variants: font.variants || ['400'],
        category: font.category || 'sans-serif'
      }))
      // Filter out fonts with problematic names or categories
      .filter((font: GoogleFont) => 
        font.family && 
        font.family.trim() !== '' &&
        !font.family.includes('?') // Some fonts have invalid characters
      );

    console.log(`✅ Loaded ${fonts.length} fonts from Google Fonts API`);
    
    // Combine with fallback fonts to ensure popular fonts are always available
    const combinedFonts = [
      ...FALLBACK_FONTS,
      ...fonts.filter(font => 
        !FALLBACK_FONTS.some(fallback => fallback.family === font.family)
      )
    ];

    return combinedFonts;

  } catch (error) {
    console.error('Error loading Google Fonts:', error);
    console.warn('Falling back to offline font list');
    return FALLBACK_FONTS;
  }
}

export const loadFont = async (fontFamily: string): Promise<void> => {
  if (fontsLoaded.has(fontFamily) || isWebSafeFont(fontFamily)) {
    return;
  }

  try {
    // Create unique ID for the font link
    const fontId = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Check if font is already loaded in DOM
    if (document.getElementById(fontId)) {
      fontsLoaded.add(fontFamily);
      return;
    }

    console.log(`Loading font: ${fontFamily}`);

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    // Encode font name properly and load multiple weights
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    
    // Add error handling for link loading
    const fontLoadPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Font loading timeout for ${fontFamily}`));
      }, 8000); // 8 second timeout

      link.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load font CSS for ${fontFamily}`));
      };
    });

    document.head.appendChild(link);
    await fontLoadPromise;

    // Wait for font to be ready for use
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(`16px "${fontFamily}"`);
        await document.fonts.ready;
      } catch (fontError) {
        console.warn(`Font face loading warning for ${fontFamily}:`, fontError);
        // Continue anyway, font might still work
      }
    }

    fontsLoaded.add(fontFamily);
    console.log(`✅ Font loaded successfully: ${fontFamily}`);

  } catch (error) {
    console.error(`❌ Failed to load font ${fontFamily}:`, error);
    // Don't throw error, just log it so the app continues working
  }
};

export async function ensureFontLoaded(family: string, weight: string | number = 400) {
  const w = typeof weight === 'number' ? weight : (weight === 'bold' ? 700 : 400);
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}-${w}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&display=swap`;
    document.head.appendChild(link);
  }
  try {
    await (document as any).fonts.load(`${w} 16px ${family}`);
    await (document as any).fonts.ready;
  } catch {}
}

const isWebSafeFont = (fontFamily: string): boolean => {
  const webSafeFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact'
  ];
  return webSafeFonts.includes(fontFamily);
};

// Utility functions for font management
export const getFontsByCategory = (fonts: GoogleFont[], category: string): GoogleFont[] => {
  return fonts.filter(font => font.category === category);
};

export const searchFonts = (fonts: GoogleFont[], query: string): GoogleFont[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return fonts;
  
  return fonts.filter(font => 
    font.family.toLowerCase().includes(searchTerm) ||
    font.category.toLowerCase().includes(searchTerm)
  );
};

export const getPopularFonts = (fonts: GoogleFont[], limit: number = 20): GoogleFont[] => {
  // Return first N fonts (assuming they're sorted by popularity from API)
  return fonts.slice(0, limit);
};

// Preload most popular fonts for better performance
export const preloadPopularFonts = async (fonts?: GoogleFont[]): Promise<void> => {
  const fontsToPreload = fonts ? getPopularFonts(fonts, 5) : FALLBACK_FONTS.slice(0, 5);
  
  console.log('Preloading popular fonts...');
  
  const preloadPromises = fontsToPreload.map(async (font) => {
    try {
      await loadFont(font.family);
    } catch (error) {
      console.warn(`Failed to preload font ${font.family}:`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
  console.log('✅ Popular fonts preloaded');
};

// Get fonts organized by category for UI
export const getOrganizedFonts = (fonts: GoogleFont[]) => {
  return {
    'sans-serif': getFontsByCategory(fonts, 'sans-serif'),
    'serif': getFontsByCategory(fonts, 'serif'),
    'display': getFontsByCategory(fonts, 'display'),
    'handwriting': getFontsByCategory(fonts, 'handwriting'),
    'monospace': getFontsByCategory(fonts, 'monospace'),
  };
};

const getCommonFonts = (): GoogleFont[] => [
  { family: 'Arial', variants: ['400', '700'], category: 'sans-serif' },
  { family: 'Roboto', variants: ['100', '300', '400', '500', '700', '900'], category: 'sans-serif' },
  { family: 'Open Sans', variants: ['300', '400', '600', '700'], category: 'sans-serif' },
  { family: 'Lato', variants: ['100', '300', '400', '700', '900'], category: 'sans-serif' },
  { family: 'Montserrat', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Poppins', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], category: 'sans-serif' },
  { family: 'Source Sans Pro', variants: ['200', '300', '400', '600', '700', '900'], category: 'sans-serif' },
  { family: 'Oswald', variants: ['200', '300', '400', '500', '600', '700'], category: 'sans-serif' },
];