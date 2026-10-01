// Curated high-resolution circular food & beverage imagery for the POS terminal
export function getMenuItemImage(name: string, category: string, station: string, isAlcoholic: boolean): string {
  const lower = name.toLowerCase();

  // Paneer & Vegetarian Indian Dishes
  if (lower.includes('paneer') || lower.includes('makhanwala')) {
    return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('mushroom') || lower.includes('veg')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('dal') || lower.includes('curry')) {
    return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('tikka') || lower.includes('tandoori') || lower.includes('kebab')) {
    return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('biryani') || lower.includes('rice') || lower.includes('pulao')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('roti') || lower.includes('naan') || lower.includes('bread')) {
    return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('chicken') || lower.includes('mutton') || lower.includes('fish')) {
    return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&auto=format&fit=crop&q=80';
  }

  // Starters, Snacks & Platters
  if (lower.includes('crispy') || lower.includes('fries') || lower.includes('snack') || lower.includes('finger')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('soup')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&auto=format&fit=crop&q=80';
  }

  // Bar, Drinks & Spirits
  if (station === 'BAR' || isAlcoholic) {
    if (lower.includes('beer') || lower.includes('kingfisher') || lower.includes('tuborg')) {
      return 'https://images.unsplash.com/photo-1608270191599-5f2526e03884?w=300&auto=format&fit=crop&q=80';
    }
    if (lower.includes('whisky') || lower.includes('scotch') || lower.includes('rum')) {
      return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=300&auto=format&fit=crop&q=80';
    }
    if (lower.includes('cocktail') || lower.includes('mocktail') || lower.includes('mojito')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&auto=format&fit=crop&q=80';
  }

  // Soft drinks & Sodas
  if (lower.includes('coke') || lower.includes('soda') || lower.includes('juice') || lower.includes('lime')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80';
  }

  // Generic fallback appetizing meal
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';
}