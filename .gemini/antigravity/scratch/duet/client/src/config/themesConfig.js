export const THEME_CATEGORIES = [
  'Romantic Themes',
  'Dark Themes',
  'Cute Themes',
  'Nature Themes',
  'Aesthetic Themes',
  'Entertainment Themes',
  'Animated Themes',
  'Couple Exclusive Themes'
];

export const PREBUILT_THEMES = [
  // Romantic Themes
  { id: 'T_ROM_ROSE', category: 'Romantic Themes', name: 'Rose Garden', accentColor: '#E11D48', secondaryColor: '#BE123C', bubbleColor: 'rgba(225, 29, 72, 0.7)', animatedEffect: 'floating_flower_petals' },
  { id: 'T_ROM_HEART', category: 'Romantic Themes', name: 'Heart Rain', accentColor: '#F43F5E', secondaryColor: '#E11D48', bubbleColor: 'rgba(244, 63, 94, 0.8)', animatedEffect: 'falling_hearts' },
  { id: 'T_ROM_LETTERS', category: 'Romantic Themes', name: 'Love Letters', accentColor: '#881337', secondaryColor: '#4C0519', fontName: 'Georgia' },
  { id: 'T_ROM_VELVET', category: 'Romantic Themes', name: 'Red Velvet', accentColor: '#9F1239', secondaryColor: '#881337', bubbleColor: 'rgba(159, 18, 57, 0.9)' },
  { id: 'T_ROM_DATE', category: 'Romantic Themes', name: 'Candlelight Date', accentColor: '#F59E0B', secondaryColor: '#D97706', animatedEffect: 'fireflies' },
  { id: 'T_ROM_FOREVER', category: 'Romantic Themes', name: 'Forever Together', accentColor: '#F472B6', secondaryColor: '#DB2777' },
  
  // Dark Themes
  { id: 'T_DARK_MIDNIGHT', category: 'Dark Themes', name: 'Midnight Black', accentColor: '#1E1E1E', secondaryColor: '#000000', bubbleColor: 'rgba(50,50,50,0.8)' },
  { id: 'T_DARK_NEON', category: 'Dark Themes', name: 'Neon Purple', accentColor: '#8B5CF6', secondaryColor: '#D946EF', bubbleColor: 'rgba(139, 92, 246, 0.6)' },
  { id: 'T_DARK_GALAXY', category: 'Dark Themes', name: 'Dark Galaxy', accentColor: '#312E81', secondaryColor: '#1E1B4B', animatedEffect: 'shooting_stars' },
  { id: 'T_DARK_OCEAN', category: 'Dark Themes', name: 'Ocean Blue', accentColor: '#0369A1', secondaryColor: '#0C4A6E', bubbleColor: 'rgba(3, 105, 161, 0.6)' },
  { id: 'T_DARK_GOLD', category: 'Dark Themes', name: 'Black & Gold', accentColor: '#D97706', secondaryColor: '#000000', fontName: 'Times New Roman' },
  
  // Cute Themes
  { id: 'T_CUTE_KAWAII', category: 'Cute Themes', name: 'Kawaii Pink', accentColor: '#FBCFE8', secondaryColor: '#F9A8D4', bubbleColor: 'rgba(251, 207, 232, 0.8)' },
  { id: 'T_CUTE_TEDDY', category: 'Cute Themes', name: 'Teddy Bear', accentColor: '#D97706', secondaryColor: '#B45309', bubbleColor: 'rgba(217, 119, 6, 0.7)' },
  { id: 'T_CUTE_BUNNY', category: 'Cute Themes', name: 'Bunny Love', accentColor: '#A7F3D0', secondaryColor: '#6EE7B7' },
  { id: 'T_CUTE_COTTON', category: 'Cute Themes', name: 'Cotton Candy', accentColor: '#C084FC', secondaryColor: '#F472B6', bubbleColor: 'rgba(192, 132, 252, 0.7)' },
  
  // Nature Themes
  { id: 'T_NAT_FOREST', category: 'Nature Themes', name: 'Forest', accentColor: '#059669', secondaryColor: '#047857', animatedEffect: 'fireflies' },
  { id: 'T_NAT_WATER', category: 'Nature Themes', name: 'Waterfall', accentColor: '#0284C7', secondaryColor: '#0369A1' },
  { id: 'T_NAT_SUNRISE', category: 'Nature Themes', name: 'Mountain Sunrise', accentColor: '#EA580C', secondaryColor: '#C2410C' },
  { id: 'T_NAT_SUNSET', category: 'Nature Themes', name: 'Beach Sunset', accentColor: '#F97316', secondaryColor: '#EF4444' },
  { id: 'T_NAT_CHERRY', category: 'Nature Themes', name: 'Cherry Blossom', accentColor: '#FDA4AF', secondaryColor: '#FB7185', animatedEffect: 'floating_flower_petals' },
  { id: 'T_NAT_RAIN', category: 'Nature Themes', name: 'Rainy Day', accentColor: '#64748B', secondaryColor: '#475569', animatedEffect: 'snowfall' }, // fallback rain to snow for now
  
  // Aesthetic Themes
  { id: 'T_AES_MINIMAL', category: 'Aesthetic Themes', name: 'Minimal White', accentColor: '#F8FAFC', secondaryColor: '#E2E8F0', bubbleColor: 'rgba(255,255,255,0.2)' },
  { id: 'T_AES_GLASS', category: 'Aesthetic Themes', name: 'Glassmorphism', accentColor: '#94A3B8', secondaryColor: '#64748B' },
  { id: 'T_AES_FROST', category: 'Aesthetic Themes', name: 'Frosted Ice', accentColor: '#7DD3FC', secondaryColor: '#38BDF8' },
  { id: 'T_AES_LUX', category: 'Aesthetic Themes', name: 'Luxury Gold', accentColor: '#FCD34D', secondaryColor: '#F59E0B' },
  
  // Entertainment Themes
  { id: 'T_ENT_ANIME', category: 'Entertainment Themes', name: 'Anime Sakura', accentColor: '#F472B6', secondaryColor: '#E11D48', animatedEffect: 'floating_flower_petals' },
  { id: 'T_ENT_RETRO', category: 'Entertainment Themes', name: 'Retro 90s', accentColor: '#2DD4BF', secondaryColor: '#0D9488', fontName: 'Courier New' },
  { id: 'T_ENT_CYBER', category: 'Entertainment Themes', name: 'Cyberpunk', accentColor: '#FDE047', secondaryColor: '#000000', bubbleColor: 'rgba(253, 224, 71, 0.4)' },
  
  // Animated Themes (Showcase)
  { id: 'T_ANIM_HEARTS', category: 'Animated Themes', name: 'Endless Hearts', accentColor: '#E11D48', animatedEffect: 'falling_hearts' },
  { id: 'T_ANIM_BALLOONS', category: 'Animated Themes', name: 'Floating Balloons', accentColor: '#10B981', animatedEffect: 'floating_balloons' },
  { id: 'T_ANIM_SNOW', category: 'Animated Themes', name: 'Winter Snowfall', accentColor: '#38BDF8', animatedEffect: 'snowfall' },
  
  // Couple Exclusive Themes
  { id: 'T_COUP_PHOTO', category: 'Couple Exclusive Themes', name: 'Our Photos', accentColor: '#9333EA' },
  { id: 'T_COUP_FIRST', category: 'Couple Exclusive Themes', name: 'First Date', accentColor: '#D946EF' },
  { id: 'T_COUP_WEDDING', category: 'Couple Exclusive Themes', name: 'Wedding Countdown', accentColor: '#FFFFFF', secondaryColor: '#FBCFE8' }
];
