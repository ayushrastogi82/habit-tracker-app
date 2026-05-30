export const CategoryFilterBar = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  const allCategories = ['All', ...categories];

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-1.5">
        {allCategories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              activeCategory === category
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};
