import React from 'react';

const PetCardSkeleton: React.FC = () => {
  return (
    <div className="bg-bg-secondary rounded-xl p-6 transition-all duration-200 h-full flex flex-col border-2 border-border animate-pulse iphone16:p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-border iphone16:flex-col iphone16:items-start iphone16:gap-4">
        <div className="flex-1">
          {/* Pet name skeleton */}
          <div className="h-8 bg-bg-tertiary rounded mb-2 w-32 iphone16:h-6"></div>
          {/* Grade badge skeleton */}
          <div className="h-6 bg-bg-tertiary rounded w-20"></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Element icons skeleton */}
          <div className="h-7 w-12 bg-bg-tertiary rounded"></div>
          <div className="h-7 w-12 bg-bg-tertiary rounded"></div>
          <div className="h-7 w-12 bg-bg-tertiary rounded"></div>
        </div>
      </div>

      {/* Basic Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <div className="h-4 bg-bg-primary rounded w-8"></div>
            <div className="h-4 bg-bg-primary rounded w-6"></div>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <div className="h-4 bg-bg-primary rounded w-8"></div>
            <div className="h-4 bg-bg-primary rounded w-6"></div>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <div className="h-4 bg-bg-primary rounded w-8"></div>
            <div className="h-4 bg-bg-primary rounded w-6"></div>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <div className="h-4 bg-bg-primary rounded w-8"></div>
            <div className="h-4 bg-bg-primary rounded w-6"></div>
          </div>
        </div>
      </div>

      {/* Growth Section */}
      <div className="mb-6">
        <div className="h-6 bg-bg-tertiary rounded mb-4 w-16 iphone16:h-5"></div>
        <div className="grid grid-cols-2 gap-2 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="col-span-2 flex justify-between items-center p-2 px-3 bg-blue-500/10 rounded border border-blue-500/30 iphone16:col-span-1">
            <div className="h-3 bg-bg-tertiary rounded w-12"></div>
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
          </div>
        </div>
      </div>

      {/* Combat Section */}
      <div className="mb-6">
        <div className="h-6 bg-bg-tertiary rounded mb-4 w-20 iphone16:h-5"></div>
        <div className="grid grid-cols-2 gap-2 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-10"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <div className="h-3 bg-bg-tertiary rounded w-12"></div>
            <div className="h-3 bg-bg-tertiary rounded w-8"></div>
          </div>
          <div className="col-span-2 flex justify-between items-center p-2 px-3 bg-green-500/10 rounded border border-green-500/30 iphone16:col-span-1">
            <div className="h-3 bg-bg-tertiary rounded w-16"></div>
            <div className="h-3 bg-bg-tertiary rounded w-12"></div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-4 border-t border-border mt-auto">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 bg-bg-tertiary rounded w-8"></div>
          <div className="h-4 bg-bg-tertiary rounded w-10"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-bg-tertiary rounded w-10"></div>
          <div className="h-4 bg-bg-tertiary rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default PetCardSkeleton;
