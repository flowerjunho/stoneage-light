import { useState, useEffect } from 'react'
import { getFavorites, clearAllFavorites } from '../utils/favorites'

interface FavoriteFilterProps {
  onFilterChange: (showFavoritesOnly: boolean) => void
  initialValue?: boolean
}

const FavoriteFilter = ({ onFilterChange, initialValue = false }: FavoriteFilterProps) => {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(initialValue)
  const [favoriteCount, setFavoriteCount] = useState(0)

  // 즐겨찾기 개수 업데이트
  useEffect(() => {
    const updateFavoriteCount = () => {
      const favorites = getFavorites()
      setFavoriteCount(favorites.length)
    }

    updateFavoriteCount()

    // 주기적으로 즐겨찾기 개수 확인 (다른 탭에서 변경될 수 있음)
    const interval = setInterval(updateFavoriteCount, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // 초기값 변경 시 상태 동기화
  useEffect(() => {
    setShowFavoritesOnly(initialValue)
  }, [initialValue])

  const handleToggleFilter = () => {
    const newValue = !showFavoritesOnly
    setShowFavoritesOnly(newValue)
    onFilterChange(newValue)
  }

  const handleClearAllFavorites = () => {
    if (favoriteCount === 0) return
    
    if (window.confirm('모든 즐겨찾기를 삭제하시겠습니까?')) {
      clearAllFavorites()
      setFavoriteCount(0)
      
      // 즐겨찾기 필터가 활성화되어 있다면 비활성화
      if (showFavoritesOnly) {
        setShowFavoritesOnly(false)
        onFilterChange(false)
      }
    }
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-text-secondary text-sm font-medium">즐겨찾기:</span>
        <div className="flex gap-2">
          <button
            onClick={handleToggleFilter}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium
                     transition-all duration-200 ${
                       showFavoritesOnly
                         ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                         : 'text-text-secondary hover:text-text-primary border border-border-primary hover:bg-bg-secondary'
                     }`}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              className={`${showFavoritesOnly ? 'fill-yellow-400' : 'fill-none'}`}
            >
              <path 
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinejoin="round"
              />
            </svg>
            즐겨찾기만 보기 ({favoriteCount})
          </button>
          
          {favoriteCount > 0 && (
            <button
              onClick={handleClearAllFavorites}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 
                       border border-red-500/30 rounded-lg hover:bg-red-500/10
                       transition-all duration-200"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {showFavoritesOnly && favoriteCount === 0 && (
        <div className="text-center py-3 text-text-secondary bg-bg-tertiary rounded-lg">
          <p className="text-sm">즐겨찾기에 추가된 펫이 없습니다</p>
          <p className="text-xs mt-1">펫 카드의 별 아이콘을 클릭하여 즐겨찾기에 추가하세요</p>
        </div>
      )}

      {showFavoritesOnly && favoriteCount > 0 && (
        <div className="text-xs text-text-secondary bg-bg-tertiary rounded-lg p-3">
          <strong>즐겨찾기 필터 활성:</strong> {favoriteCount}개의 즐겨찾기 펫만 표시됩니다
        </div>
      )}
    </div>
  )
}

export default FavoriteFilter