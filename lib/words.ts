export interface Category {
  key: string;
  label: string;
  emoji: string;
  pairs: [string, string][];
}

export const CATEGORIES: Category[] = [
  {
    key: "everyday-objects",
    label: "Everyday Objects",
    emoji: "🪑",
    pairs: [
      ["Spoon", "Fork"],
      ["Chair", "Stool"],
      ["Backpack", "Suitcase"],
      ["Umbrella", "Raincoat"],
      ["Candle", "Flashlight"],
      ["Pillow", "Blanket"],
      ["Mirror", "Window"],
      ["Broom", "Mop"],
      ["Kettle", "Toaster"],
      ["Wallet", "Purse"],
      ["Scissors", "Knife"],
      ["Ladder", "Stairs"],
      ["Clock", "Watch"],
      ["Key", "Padlock"],
      ["Sunglasses", "Glasses"],
      ["Notebook", "Diary"],
      ["Bucket", "Basket"],
      ["Hammer", "Wrench"],
      ["Toothbrush", "Hairbrush"],
      ["Charger", "Cable"],
    ],
  },
  {
    key: "food",
    label: "Food",
    emoji: "🍕",
    pairs: [
      ["Pizza", "Burger"],
      ["Coffee", "Tea"],
      ["Pancake", "Waffle"],
      ["Sushi", "Sandwich"],
      ["Ice Cream", "Yogurt"],
      ["Popcorn", "Chips"],
      ["Noodles", "Spaghetti"],
      ["Cake", "Pie"],
      ["Donut", "Bagel"],
      ["Soup", "Stew"],
      ["Taco", "Burrito"],
      ["Cheese", "Butter"],
      ["Apple", "Pear"],
      ["Orange", "Lemon"],
      ["Chocolate", "Caramel"],
      ["Milkshake", "Smoothie"],
      ["Fried Rice", "Biryani"],
      ["Momo", "Dumpling"],
      ["Samosa", "Spring Roll"],
      ["Pasta", "Ramen"],
    ],
  },
  {
    key: "famous-persons",
    label: "Famous Persons",
    emoji: "🌟",
    pairs: [
      ["Albert Einstein", "Isaac Newton"],
      ["Leonardo da Vinci", "Michelangelo"],
      ["Mahatma Gandhi", "Nelson Mandela"],
      ["William Shakespeare", "Charles Dickens"],
      ["Cristiano Ronaldo", "Lionel Messi"],
      ["Michael Jackson", "Elvis Presley"],
      ["Steve Jobs", "Bill Gates"],
      ["Barack Obama", "Abraham Lincoln"],
      ["Marilyn Monroe", "Audrey Hepburn"],
      ["Walt Disney", "Charlie Chaplin"],
      ["Serena Williams", "Venus Williams"],
      ["Elon Musk", "Jeff Bezos"],
      ["Pablo Picasso", "Vincent van Gogh"],
      ["Mother Teresa", "Princess Diana"],
      ["Muhammad Ali", "Mike Tyson"],
      ["Amitabh Bachchan", "Shah Rukh Khan"],
      ["Virat Kohli", "Sachin Tendulkar"],
      ["Taylor Swift", "Ariana Grande"],
      ["Bruce Lee", "Jackie Chan"],
      ["Freddie Mercury", "John Lennon"],
    ],
  },
];

export function getCategory(key: string): Category | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function pickWordPair(
  categoryKey: string,
  usedPairs: string[],
): { word: string; imposterWord: string; pairKey: string } | null {
  const category = getCategory(categoryKey);
  if (!category) return null;

  const available = category.pairs
    .map((pair, i) => ({ pair, pairKey: `${categoryKey}:${i}` }))
    .filter(({ pairKey }) => !usedPairs.includes(pairKey));

  const pool = available.length > 0
    ? available
    : category.pairs.map((pair, i) => ({ pair, pairKey: `${categoryKey}:${i}` }));

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const flip = Math.random() < 0.5;
  const word = flip ? chosen.pair[0] : chosen.pair[1];
  const imposterWord = flip ? chosen.pair[1] : chosen.pair[0];

  return { word, imposterWord, pairKey: chosen.pairKey };
}
