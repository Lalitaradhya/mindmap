import { Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Home from './App';
import Mindmap from './Mindmap';
import MCQQuiz2025 from './mcq/MCQQuiz2025';
import MCQQuiz2024 from './mcq/MCQQuiz2024';
import MCQQuiz2023 from './mcq/MCQQuiz2023';
import MCQQuiz2022 from './mcq/MCQQuiz2022';
import AIMCQ from './AIMCQ';
import News from './news/News';
import SavedNews from './news/SavedNews';
import Navbar from './Navbar';


const App = () => {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mindmap" element={<Mindmap />} />
        <Route path="/prelims-2025" element={<MCQQuiz2025 />} />
        <Route path="/prelims-2024" element={<MCQQuiz2024 />} />
        <Route path="/prelims-2023" element={<MCQQuiz2023 />} />
        <Route path="/prelims-2022" element={<MCQQuiz2022 />} />
        <Route path="/ai-mcq" element={<AIMCQ />} />
        <Route path="/news" element={<News />} />
        <Route path="/saved-news" element={<SavedNews />} />
      </Routes>
    </>
  );
};

export { App };
