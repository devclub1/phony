import Dashboard from "../dashboard/Dashboard"

import { BrowserRouter, Route, Routes } from "react-router"
import Footer from "../footer/Footer"
import ControlBoard from "../control-board/ControlBoard"

const Container = () => {
  return (
    <>
      <div className="flex-grow p-8">
        <BrowserRouter>
          <Routes>
            <Route key="dashboard" path="/" element={<Dashboard />} />
            <Route key="room" path="/room/:id" element={<ControlBoard />} />
          </Routes>
        </BrowserRouter>
      </div>
      <Footer />
    </>
  )
}

export default Container
