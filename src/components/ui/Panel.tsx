interface PanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, icon, children, className = '' }: PanelProps) {
  return (
    <div className={`bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 transition-colors duration-300 ${className}`}>
      <h2 className="text-2xl font-semibold mb-6 text-blue-200 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
