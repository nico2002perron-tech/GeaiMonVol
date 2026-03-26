'use client';

import React from 'react';
import type { FilterTab, SortMode, DealItem } from '@/lib/types/deals';
import { FILTER_TABS, SORT_OPTIONS } from '@/lib/types/deals';

interface DealsFilterBarProps {
  activeFilter: FilterTab;
  sortMode: SortMode;
  searchQuery: string;
  maxBudget: number;
  isSticky: boolean;
  allDeals: DealItem[];
  filteredCount: number;
  favCount: number;
  onFilterChange: (filter: FilterTab) => void;
  onSortChange: (sort: SortMode) => void;
  onSearchChange: (query: string) => void;
  onBudgetChange: (budget: number) => void;
  filtersRef: React.RefObject<HTMLDivElement | null>;
}

export default function DealsFilterBar({
  activeFilter,
  sortMode,
  searchQuery,
  maxBudget,
  isSticky,
  allDeals,
  filteredCount,
  favCount,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onBudgetChange,
  filtersRef,
}: DealsFilterBarProps) {
  const hasActiveFilters = searchQuery || activeFilter !== 'tous' || maxBudget > 0;

  return (
    <div
      ref={filtersRef}
      className={`deals-filter${isSticky ? ' deals-filter--sticky' : ''}`}
    >
      <div className="deals-filter__row">
        {/* Search */}
        <div className="deals-filter__search">
          <svg className="deals-filter__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Chercher une destination..."
            aria-label="Chercher une destination"
            className="deals-filter__search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Effacer la recherche"
              className="deals-filter__search-clear"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="deals-filter__pills">
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            const count = tab.id === 'tous' ? allDeals.length
              : tab.id === 'favoris' ? favCount
              : tab.id === 'top' ? allDeals.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel)).length
              : allDeals.filter(d => d.category === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`deals-filter__pill${isActive ? ' deals-filter__pill--active' : ''}`}
              >
                <span className="deals-filter__pill-icon">{tab.icon}</span>
                {tab.label}
                <span className="deals-filter__pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          aria-label="Trier les deals"
          className="deals-filter__sort"
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="deals-filter__summary">
          <span>{filteredCount} resultat{filteredCount !== 1 ? 's' : ''}</span>
          {searchQuery && (
            <span className="deals-filter__tag">
              &ldquo;{searchQuery}&rdquo;
              <button onClick={() => onSearchChange('')} className="deals-filter__tag-clear">&times;</button>
            </span>
          )}
          {activeFilter !== 'tous' && (
            <span className="deals-filter__tag">
              {FILTER_TABS.find(t => t.id === activeFilter)?.icon} {FILTER_TABS.find(t => t.id === activeFilter)?.label}
              <button onClick={() => onFilterChange('tous')} className="deals-filter__tag-clear">&times;</button>
            </span>
          )}
          {maxBudget > 0 && (
            <span className="deals-filter__tag">
              Max {maxBudget} $
              <button onClick={() => onBudgetChange(0)} className="deals-filter__tag-clear">&times;</button>
            </span>
          )}
          <button
            onClick={() => { onSearchChange(''); onFilterChange('tous'); onBudgetChange(0); }}
            className="deals-filter__reset"
          >
            Reinitialiser
          </button>
        </div>
      )}
    </div>
  );
}
