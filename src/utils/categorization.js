import { CATEGORY_KEYWORDS } from '../data/categories.js';

export const detectCategory = (habitName) => {
  if (!habitName || habitName.trim() === "") return "Personal";

  const lowerName = habitName.toLowerCase();

  // Check each category's keywords
  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        // Convert id to proper name: "health" → "Health"
        return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
      }
    }
  }

  return "Personal"; // Default fallback
};
