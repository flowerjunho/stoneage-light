import { useState, useEffect } from 'react'

export type ElementType = 'earth' | 'water' | 'fire' | 'wind'

interface ElementFilterProps {
  onFilterChange: (filters: ElementType[]) => void
  initialFilters?: ElementType[]
}

const ElementFilter = ({ onFilterChange, initialFilters = [] }: ElementFilterProps) => {
  const [activeFilters, setActiveFilters] = useState<ElementType[]>(initialFilters)

  // 초기값이 변경될 때 상태 동기화
  useEffect(() => {
    setActiveFilters(initialFilters)
  }, [initialFilters])

  const elements = [
    { key: 'earth' as ElementType, label: '지', color: 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' },
    { key: 'water' as ElementType, label: '수', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30' },
    { key: 'fire' as ElementType, label: '화', color: 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' },
    { key: 'wind' as ElementType, label: '풍', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30' }
  ]

  const handleFilterClick = (element: ElementType) => {
    let newFilters: ElementType[]
    
    if (activeFilters.includes(element)) {
      // 이미 활성화된 필터면 제거
      newFilters = activeFilters.filter(f => f !== element)
    } else {
      // 새로운 필터 추가
      newFilters = [...activeFilters, element]
    }
    
    setActiveFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setActiveFilters([])
    onFilterChange([])
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-text-secondary text-sm font-medium">속성 필터:</span>
        
        {elements.map((element) => {
          const isActive = activeFilters.includes(element.key)
          return (
            <button
              key={element.key}
              onClick={() => handleFilterClick(element.key)}
              className={`
                px-4 py-2 rounded-lg border-2 font-semibold text-sm
                transition-all duration-200 transform hover:scale-105
                ${isActive 
                  ? element.color.replace('bg-', 'bg-').replace('/20', '/40').replace('border-', 'border-').replace('/50', '') 
                  : `${element.color} opacity-70`
                }
                active:scale-95
              `}
            >
              {element.label}
              {isActive && <span className="ml-1">✓</span>}
            </button>
          )
        })}
        
        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary 
                     border border-border-primary rounded-lg hover:bg-bg-secondary
                     transition-all duration-200"
          >
            초기화
          </button>
        )}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="mt-3 text-xs text-text-secondary">
          {activeFilters.length}개 속성이 선택됨: {activeFilters.map(f => elements.find(e => e.key === f)?.label).join(', ')}
        </div>
      )}
    </div>
  )
}

export default ElementFilter