export const CategoryFilterBar = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  const allCategories = ['All', ...categories];

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto px-4 py-3">
        <div className="flex gap-2">
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
