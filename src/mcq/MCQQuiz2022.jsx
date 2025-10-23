import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Paper, RadioGroup, FormControlLabel, Radio, Container, Button } from '@mui/material';
import { RotateCcw } from 'lucide-react';
import data from '../gs-1-prelims/gs-1-prelims-22/data.json';
import Footer from '../Footer';

const MCQQuiz2022 = () => {
  const [selectedOptions, setSelectedOptions] = useState(Array(data.length).fill(''));
  const [score, setScore] = useState(0);

  const formatQuestionText = (text) => {
    return text
      .replace(/ ([A-Z]+)\./g, '\n$1.')  // Put newline before statement labels
      .replace(/:$/, ':\n');  // For questions/statements ending with :
  };

  const categoryCounts = useMemo(() => {
    return data.reduce((acc, q) => {
      acc[q.Category] = (acc[q.Category] || 0) + 1;
      return acc;
    }, {});
  }, []);

  // Calculate score based on selections
  const calculateScore = () => {
    let total = 0;
    selectedOptions.forEach((selected, index) => {
      if (selected) {
        if (selected === data[index].answer) {
          total += 2;
        } else {
          total -= 0.75;
        }
      }
    });
    setScore(total);
  };

  // Update score when selections change
  useEffect(() => {
    calculateScore();
  }, [selectedOptions]);

  const handleOptionChange = (questionIndex, event) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = event.target.value;
    setSelectedOptions(newSelectedOptions);
  };

  const resetTest = () => {
    setSelectedOptions(new Array(data.length).fill(''));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>Civil Services (Preliminary) Examination, 2022</Typography>
         <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>General Studies Paper - I</Typography>
        {/* <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Question Distribution</Typography>
        {Object.entries(categoryCounts).map(([category, count]) => (
          <Typography key={category} variant="body2" sx={{ ml: 2, fontWeight: 'bold' }}>
           - {category} ({count} questions)
          </Typography>
        ))} */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RotateCcw />}
            onClick={resetTest}
            sx={{ color: 'primary.main' }}
          >
            Reset Test
          </Button>
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            Score: {score}/200
          </Typography>
        </Box>
        {data.map((question, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>Question {index + 1}</Typography>
            <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {formatQuestionText(question.question).split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < formatQuestionText(question.question).split('\n').length - 1 && <br />}
                </span>
              ))}
            </Typography>
            <RadioGroup
              name={`question-${index}`}
              value={selectedOptions[index]}
              onChange={(event) => handleOptionChange(index, event)}
              disabled={!!selectedOptions[index]}
            >
              {question.options.map((option, optionIndex) => (
                <FormControlLabel
                  key={optionIndex}
                  value={option}
                  control={<Radio disabled={!!selectedOptions[index]} />}
                  label={option}
                  sx={{
                    bgcolor: selectedOptions[index] === option ? (option === question.answer ? 'success.light' : 'error.light') : 'transparent',
                    width: '100%',
                    m: 0.5,
                    borderRadius: 1,
                  }}
                />
              ))}
            </RadioGroup>
            {selectedOptions[index] && (
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                Correct Answer: {question.answer}
              </Typography>
            )}
          </Paper>
        ))}
      </Container>
      <Footer />
    </Box>
  );
};

export default MCQQuiz2022;
