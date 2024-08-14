import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import DualCameraApp from './components/DualCamera'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <DualCameraApp/>
    </>
  )
}

export default App
