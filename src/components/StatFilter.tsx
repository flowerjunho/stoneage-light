import { useState, useEffect } from 'react'
import type { Pet } from '../types'

export interface StatFilterItem {
  stat: keyof Pet
  value: number
  enabled: boolean
}

interface StatFilterProps {
  onFilterChange: (filters: StatFilterItem[]) => void
  initialFilters?: StatFilterItem[]
}

const StatFilter = ({ onFilterChange, initialFilters = [] }: StatFilterProps) => {
  const [filters, setFilters] = useState<StatFilterItem[]>(initialFilters)

  // 초기값이 변경될 때 상태 동기화
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const statOptions = [
    { key: 'attack', label: '공격' },
    { key: 'defense', label: '방어' },
    { key: 'agility', label: '순발' },
    { key: 'vitality', label: '체력' },
    { key: 'attackGrowth', label: '공성장' },
    { key: 'defenseGrowth', label: '방성장' },
    { key: 'agilityGrowth', label: '순성장' },
    { key: 'vitalityGrowth', label: '체성장' },
    { key: 'totalGrowth', label: '총성장' }
  ]

  const addFilter = () => {
    const newFilter: StatFilterItem = {
      stat: 'attack',
      value: 0,
      enabled: true
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const updateFilter = (index: number, updates: Partial<StatFilterItem>) => {
    const newFilters = filters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    )
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    setFilters([])
    onFilterChange([])
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-text-secondary text-sm font-medium">스탯 필터:</span>
        <div className="flex gap-2">
          <button
            onClick={addFilter}
            className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg 
                     hover:bg-accent/90 transition-all duration-200 font-medium"
          >
            + 필터 추가
          </button>
          {filters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary 
                       border border-border-primary rounded-lg hover:bg-bg-secondary
                       transition-all duration-200"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="space-y-3">
          {filters.map((filter, index) => {
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-3 p-3 bg-bg-secondary rounded-lg border border-border-primary"
              >
                {/* 스탯 선택 */}
                <div className="flex items-center gap-2">
                  <select
                    value={filter.stat}
                    onChange={(e) => updateFilter(index, { stat: e.target.value as keyof Pet })}
                    className="px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg
                             text-text-primary text-sm focus:outline-none focus:ring-2 
                             focus:ring-accent focus:border-transparent"
                  >
                    {statOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 조건 */}
                <span className="text-text-secondary text-sm">≥</span>

                {/* 값 입력 */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-20 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg
                             text-text-primary text-sm text-center focus:outline-none focus:ring-2 
                             focus:ring-accent focus:border-transparent"
                  />
                </div>

                {/* 활성/비활성 토글 */}
                <button
                  onClick={() => updateFilter(index, { enabled: !filter.enabled })}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    filter.enabled
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                  }`}
                >
                  {filter.enabled ? 'ON' : 'OFF'}
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removeFilter(index)}
                  className="w-8 h-8 flex items-center justify-center text-lg font-bold text-red-400 
                           hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200
                           hover:scale-110 active:scale-95"
                >
                  ×
                </button>
              </div>
            )
          })}

          {/* 활성 필터 요약 */}
          {filters.filter(f => f.enabled).length > 0 && (
            <div className="text-xs text-text-secondary bg-bg-tertiary rounded-lg p-3">
              <strong>활성 필터:</strong>{' '}
              {filters
                .filter(f => f.enabled)
                .map(f => {
                  const option = statOptions.find(opt => opt.key === f.stat)
                  return `${option?.label} ≥ ${f.value}`
                })
                .join(', ')}
            </div>
          )}
        </div>
      )}

      {filters.length === 0 && (
        <div className="text-center py-6 text-text-secondary">
          <p className="text-sm">스탯 필터를 추가하여 조건에 맞는 펫을 찾아보세요</p>
        </div>
      )}
    </div>
  )
}

export default StatFilter