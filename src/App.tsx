import { useState, useEffect } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PetGrid from './components/PetGrid'
import ThemeToggle from './components/ThemeToggle'
import type { Pet } from './types'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [pets, setPets] = useState<Pet[]>([])

  // 데이터 로딩을 비동기로 처리
  useEffect(() => {
    const loadPetsData = async () => {
      try {
        // 동적 import로 JSON 데이터 로드 (시뮬레이션)
        const module = await import('./data/pets.json')
        
        // 실제 로딩 느낌을 위한 최소 지연시간
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setPets(module.default)
      } catch (error) {
        console.error('Failed to load pets data:', error)
      }
    }

    loadPetsData()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <ThemeToggle />
      <Header />
      <main className="pb-8">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />
        <PetGrid 
          pets={pets} 
          searchTerm={searchTerm} 
        />
      </main>
    </div>
  )
}

export default App
