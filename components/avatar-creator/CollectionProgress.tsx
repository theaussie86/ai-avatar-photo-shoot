"use client";

import { useCollectionProgress } from './hooks/useCollectionProgress';

interface CollectionProgressProps {
  collectionId: string;
}

export function CollectionProgress({ collectionId }: CollectionProgressProps) {
  const { data: stats } = useCollectionProgress(collectionId);

  // Don't show if no stats or all completed
  if (!stats || stats.completed === stats.total) {
    return null;
  }

  const inProgress = stats.total - stats.completed - stats.failed;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          Generating: {stats.completed} of {stats.total} images complete
        </span>
        <div className="flex gap-3 text-xs text-gray-600">
          {stats.byStage.queued > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              {stats.byStage.queued} queued
            </span>
          )}
          {stats.byStage.processing > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {stats.byStage.processing} processing
            </span>
          )}
          {stats.byStage.generating > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              {stats.byStage.generating} generating
            </span>
          )}
          {stats.failed > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              {stats.failed} failed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="flex h-full">
          {/* Completed */}
          {stats.completed > 0 && (
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          )}
          {/* In progress (generating) */}
          {inProgress > 0 && (
            <div
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${(inProgress / stats.total) * 100}%` }}
            />
          )}
          {/* Failed */}
          {stats.failed > 0 && (
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(stats.failed / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
