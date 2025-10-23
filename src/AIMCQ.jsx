import { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import { Box, Typography, Paper, RadioGroup, FormControlLabel, Radio, Container, TextField, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, Chip, Tooltip } from '@mui/material';
import { Archive, X, Trash2, Download, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import Footer from './Footer';

const AIMCQ = () => {
  const { user, authorized } = useAuth();
  const [topic, setTopic] = useState('');
  const [generatedTopic, setGeneratedTopic] = useState('');
  const [mcqs, setMcqs] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedMcqs, setSavedMcqs] = useState([]);
  const [showSavedMcqs, setShowSavedMcqs] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [topicExpanded, setTopicExpanded] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [loadingTopicExpanded, setLoadingTopicExpanded] = useState(false);
  const [score, setScore] = useState(0);

  const formatQuestionText = (text) => {
    return text
      .replace(/ ([A-Z]+)\./g, '\n$1.')  // Put newline before statement labels
      .replace(/:$/, ':\n');  // For questions/statements ending with :
  };

  // Calculate score based on selections
  const calculateScore = () => {
    let total = 0;
    selectedOptions.forEach((selected, index) => {
      if (selected) {
        if (selected === mcqs[index]?.answer) {
          total += 2;
        } else {
          total -= 0.75;
        }
      }
    });
    setScore(total);
  };

  // Load saved MCQs on component mount and reset selections
  useEffect(() => {
    loadSavedMcqs(true); // Auto-load the most recent MCQ generation
    setSelectedOptions([]); // Reset selections on mount
  }, []);

  // Timer for elapsed time during loading
  useEffect(() => {
    let interval;
    if (loading) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentElapsedTime(elapsed.toFixed(1));
      }, 100);
    } else {
      setCurrentElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Update score when selections or MCQs change
  useEffect(() => {
    calculateScore();
  }, [selectedOptions, mcqs]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setElapsedTime(null);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMcqs(data.mcqs);
        setSelectedOptions(new Array(data.mcqs.length).fill(''));
        setGeneratedTopic(topic.trim()); // Preserve the topic used for generation
        
        // Calculate elapsed time
        const endTime = Date.now();
        const elapsed = ((endTime - startTime) / 1000).toFixed(2);
        setElapsedTime(elapsed);
        
        // Auto-save the generated MCQs
        await autoSaveMcqs(data.mcqs, topic.trim(), elapsed);
      } else {
        console.error('Failed to generate MCQs');
      }
    } catch (error) {
      console.error('Error generating MCQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (questionIndex, event) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = event.target.value;
    setSelectedOptions(newSelectedOptions);
  };

  const resetTest = () => {
    setSelectedOptions(new Array(mcqs.length).fill(''));
  };

  const downloadMCQs = () => {
    if (!mcqs || mcqs.length === 0) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210); // Blue color
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Generated MCQs', doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Topic
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.setFont('helvetica', 'bold');
    doc.text(`Topic: ${generatedTopic || topic}`, 20, yPosition);
    yPosition += 12;

    // Generation info
    if (elapsedTime) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated in ${elapsedTime} seconds`, 20, yPosition);
      yPosition += 15;
    }

    mcqs.forEach((question, index) => {
      if (yPosition > pageHeight - 60) { // Leave space for question and options
        doc.addPage();
        yPosition = 20;
      }

      // Question number and text
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${index + 1}:`, 20, yPosition);
      yPosition += 10;

      // Question content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const formattedQuestion = formatQuestionText(question.question);
      const questionLines = doc.splitTextToSize(formattedQuestion.replace(/\\n/g, ' '), 170);
      doc.text(questionLines, 20, yPosition);
      yPosition += questionLines.length * 5 + 5;

      // Options
      question.options.forEach((option, optionIndex) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        const optionText = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
        const isCorrect = option === question.answer;

        if (isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(25, 118, 210); // Blue for correct answer
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
        }

        const optionLines = doc.splitTextToSize(optionText, 160);
        doc.text(optionLines, 30, yPosition);
        yPosition += optionLines.length * 5 + 3;

        // Reset formatting
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      });

      // Explanation if available
      if (question.explanation) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('Explanation:', 20, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        const explanationLines = doc.splitTextToSize(question.explanation, 160);
        doc.text(explanationLines, 30, yPosition);
        yPosition += explanationLines.length * 4 + 8;
      } else {
        yPosition += 5;
      }
    });

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated by Visual IAS - Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() / 2, pageHeight - 15, { align: 'center' });

      // Add subtle copyright protection watermark
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.25 })); // More visible opacity
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200); // Very light gray
      doc.setFont('helvetica', 'bold');

      // Rotate and position the watermark diagonally across the page
      const centerX = doc.internal.pageSize.getWidth() / 2;
      const centerY = doc.internal.pageSize.getHeight() / 2;

      // First watermark - center position
      doc.text('VISUAL IAS', centerX, centerY, {
        align: 'center',
        angle: 45 // Diagonal rotation
      });

      // Second watermark - offset position for better coverage
      doc.text('VISUAL IAS', centerX - 10, centerY + 120, {
        align: 'center',
        angle: 45 // Diagonal rotation
      });

      doc.restoreGraphicsState();
    }

    doc.save(`ai-mcqs-${generatedTopic || topic || 'generated'}.pdf`);
  };

  // Auto-save MCQs to backend
  const autoSaveMcqs = async (mcqs, topic, elapsedTime) => {
    try {
      const response = await fetch('/api/save-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'anonymous',
          topic: topic,
          preparation_stage: 'mcq-practice',
          focus_areas: ['MCQ Generation'],
          mindmap_data: { mcqs, topic },
          generation_time: parseFloat(elapsedTime || 0)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('MCQs auto-saved successfully:', result.id);
        // Reload saved MCQs to include the new one (don't auto-load)
        loadSavedMcqs(false);
      } else {
        console.error('Failed to auto-save MCQs');
      }
    } catch (error) {
      console.error('Error auto-saving MCQs:', error);
    }
  };

  // Load saved MCQs from backend
  const loadSavedMcqs = async (autoLoadLast = false) => {
    try {
      if (autoLoadLast) {
        setLoadingSaved(true);
      }
      
      const response = await fetch('/api/saved-generations?user_id=anonymous');
      const data = await response.json();
      // Filter to only show MCQ generations
      const mcqGenerations = data.generations.filter(gen => gen.preparation_stage === 'mcq-practice');
      setSavedMcqs(mcqGenerations || []);
      
      // Auto-load the most recent MCQ generation if requested and available
      if (autoLoadLast && mcqGenerations && mcqGenerations.length > 0) {
        // Sort by creation date (newest first) and load the most recent
        const sortedGenerations = mcqGenerations.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        const mostRecent = sortedGenerations[0];
        
        // Only auto-load if there are no MCQs currently displayed
        if (mcqs.length === 0) {
          loadSavedMcq(mostRecent);
        }
      }
    } catch (error) {
      console.error('Failed to load saved MCQs:', error);
    } finally {
      if (autoLoadLast) {
        setLoadingSaved(false);
      }
    }
  };

  // Delete a saved MCQ generation
  const deleteSavedMcq = async (generationId) => {
    if (!authorized) {
      alert('You must be logged in with an authorized account to delete saved MCQ generations.');
      return;
    }

    try {
      const response = await fetch(`/api/saved-generations/${generationId}?user_id=anonymous`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSavedMcqs(prev => prev.filter(gen => gen.id !== generationId));
      } else {
        throw new Error('Failed to delete MCQ generation');
      }
    } catch (error) {
      console.error('Failed to delete saved MCQ:', error);
    }
  };

  // Load a saved MCQ generation
  const loadSavedMcq = (generation) => {
    setMcqs(generation.mindmap_data.mcqs);
    setTopic(generation.topic);
    setGeneratedTopic(generation.topic);
    setSelectedOptions(new Array(generation.mindmap_data.mcqs.length).fill(''));
    setShowSavedMcqs(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>AI-MCQs</Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Enter a Topic</Typography>
          <TextField
            fullWidth
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            disabled={!user}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleGenerate}
              disabled={loading || !topic.trim() || !user}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate'}
            </Button>
            <Tooltip title="View Saved MCQs" arrow placement="top">
              <IconButton
                variant="outlined"
                onClick={(e) => {
                  e.currentTarget.blur(); // Remove focus from button
                  loadSavedMcqs(false); // Don't auto-load when manually opening dialog
                  setShowSavedMcqs(true);
                }}
              >
                <Archive size={20} />
              </IconButton>
            </Tooltip>
          </Box>
          {loading && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1" sx={{ color: 'primary.contrastText' }}>
                  Generating MCQs for "{loadingTopicExpanded ? topic : (topic.length > 150 ? topic.substring(0, 150) + '...' : topic)}"... Elapsed time: {currentElapsedTime}s
                </Typography>
                {topic.length > 150 && (
                  <Button 
                    size="small" 
                    onClick={() => setLoadingTopicExpanded(!loadingTopicExpanded)}
                    sx={{ color: 'primary.contrastText', minWidth: 'auto', p: 0.25, fontSize: '0.75rem' }}
                  >
                    {loadingTopicExpanded ? 'Less' : 'More'}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
        
        {loadingSaved && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ color: 'info.contrastText', textAlign: 'center' }}>
              Loading your last saved MCQs...
            </Typography>
          </Box>
        )}
        
        {mcqs.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: { xs: 'block', sm: 'flex' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                  Generated MCQs for: {topicExpanded ? generatedTopic : (generatedTopic.length > 150 ? generatedTopic.substring(0, 150) + '...' : generatedTopic)}
                </Typography>
                {generatedTopic.length > 150 && (
                  <Button size="small" onClick={() => setTopicExpanded(!topicExpanded)} sx={{ p: 0.25, fontSize: '0.75rem', mt: { xs: 1, sm: 0 } }}>
                    {topicExpanded ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </Box>
              {elapsedTime ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Generated in {elapsedTime} seconds
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                    ✓ Auto-saved
                  </Typography>
                </Box>
              ) : null}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={downloadMCQs}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, color: 'white' }}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<RotateCcw />}
                onClick={resetTest}
                sx={{ color: 'primary.main' }}
              >
                Reset Test
              </Button>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                Score: {score}/10
              </Typography>
              {score === 10 && (
                <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  Congratulations! You got full marks!
                </Typography>
              )}
            </Box>
            {mcqs.map((question, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Question {index + 1}
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {formatQuestionText(question.question).split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < formatQuestionText(question.question).split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </Typography>
                <RadioGroup
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
                {selectedOptions[index] && question.explanation && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Explanation: {question.explanation}
                  </Typography>
                )}
              </Paper>
            ))}
          </>
        )}

      </Container>

      <Footer />

      {/* Saved MCQs Dialog */}
      <Dialog
        open={showSavedMcqs}
        onClose={() => setShowSavedMcqs(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="saved-mcqs-dialog-title"
        aria-describedby="saved-mcqs-dialog-description"
      >
        <DialogTitle id="saved-mcqs-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>Saved MCQ Generations</Typography>
            <IconButton onClick={() => setShowSavedMcqs(false)}>
              <X size={24} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent id="saved-mcqs-dialog-description" role="region" aria-live="polite">
          {savedMcqs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No saved MCQ generations yet. Generate and save some MCQs to see them here!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {savedMcqs.map((generation) => (
                <Paper 
                  key={generation.id} 
                  elevation={1} 
                  sx={{ p: 2, mb: 2 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Load MCQs for ${generation.topic}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      loadSavedMcq(generation);
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'space-between' }, alignItems: { xs: 'center', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box 
                      sx={{ flex: 1, cursor: 'pointer', mb: { xs: 1, sm: 0 } }} 
                      onClick={() => loadSavedMcq(generation)}
                      role="button"
                      tabIndex={-1}
                      aria-label={`Click to load MCQs for ${generation.topic}`}
                    >
                      <Box sx={{ display: { xs: 'block', sm: 'flex' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { sm: 1 }, flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {expandedTopics[generation.id] ? generation.topic : (generation.topic.length > 150 ? generation.topic.substring(0, 150) + '...' : generation.topic)}
                        </Typography>
                        {generation.topic.length > 150 && (
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTopics(prev => ({ ...prev, [generation.id]: !prev[generation.id] }));
                            }}
                            sx={{ p: 0.25, fontSize: '0.75rem', mt: { xs: 1, sm: 0 } }}
                          >
                            {expandedTopics[generation.id] ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                        <Chip
                          label={`${generation.mindmap_data.mcqs.length} MCQs`}
                          size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: 'primary.main' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(generation.created_at).toLocaleDateString()}
                        </Typography>
                        {generation.generation_time && (
                          <Typography variant="body2" color="text.secondary">
                            {generation.generation_time}s
                          </Typography>
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedMcq(generation.id);
                          }}
                          disabled={!authorized}
                          sx={{ color: 'error.main', '&:hover': { backgroundColor: 'error.light' }, display: { xs: 'inline-flex', sm: 'none' } }}
                          aria-label={`Delete MCQs for ${generation.topic}`}
                          size="small"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedMcq(generation.id);
                      }}
                      disabled={!authorized}
                      sx={{ color: 'error.main', '&:hover': { backgroundColor: 'error.light' }, alignSelf: { xs: 'flex-end', sm: 'auto' }, display: { xs: 'none', sm: 'inline-flex' } }}
                      aria-label={`Delete MCQs for ${generation.topic}`}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AIMCQ;
