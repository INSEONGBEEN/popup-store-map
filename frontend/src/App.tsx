import { useState } from 'react'
import { PopupStoreDetails } from './components/PopupStoreDetails'
import { usePopupStores } from './features/popupstore/usePopupStores'
import { PopupStoreMap } from './map/PopupStoreMap'
import type { PopupStore } from './types/popupStore'
import './App.css'

function App() {
  const { popupStores, isLoading, errorMessage } = usePopupStores()
  const [selectedStore, setSelectedStore] = useState<PopupStore | null>(null)

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">POPUP STORE MAP</p>
          <h1>성수의 팝업을 한눈에</h1>
          <p className="subtitle">성수역·서울숲역·뚝섬역 주변의 개발용 팝업스토어 지도입니다.</p>
        </div>
        <div className="store-count" aria-label={`팝업스토어 ${popupStores.length}개`}>
          <strong>{popupStores.length}</strong>
          <span>곳 표시 중</span>
        </div>
      </header>

      <section className="map-card">
        <PopupStoreMap
          popupStores={popupStores}
          selectedId={selectedStore?.id ?? null}
          onSelect={setSelectedStore}
        />

        {isLoading && <div className="state-card">팝업스토어를 불러오는 중입니다…</div>}
        {errorMessage && <div className="state-card error">{errorMessage}</div>}
        {!isLoading && !errorMessage && popupStores.length === 0 && (
          <div className="state-card">표시할 팝업스토어가 없습니다.</div>
        )}
        {selectedStore && (
          <PopupStoreDetails popupStore={selectedStore} onClose={() => setSelectedStore(null)} />
        )}
      </section>

      <footer>
        지도 데이터 © OpenStreetMap contributors · 현재 데이터는 개발용 샘플일 수 있습니다.
      </footer>
    </main>
  )
}

export default App
