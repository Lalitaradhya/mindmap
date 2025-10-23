import { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send,
  Lightbulb,
  School,
  TestTube,
  Globe,
  Computer,
  X,
  RefreshCw,
  Trash2,
  Archive,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import Footer from './Footer';
import { renderBranchCard } from './renderBranchCard';
import Prism from './prism/Prism';
import InstructionsDialog from './components/InstructionsDialog';

const Home = () => {
  const { user, authorized, loading } = useAuth();
  const [word, setWord] = useState('');
  const [complexityLevel, setComplexityLevel] = useState('prelims');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState(null);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);
  const [savedGenerations, setSavedGenerations] = useState([]);
  const [showSavedGenerations, setShowSavedGenerations] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedSubtext, setDisplayedSubtext] = useState('');
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);

  // Typing animation for the title
  useEffect(() => {
    const fullTitle = 'Visual IAS';
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullTitle.length) {
        setDisplayedTitle(fullTitle.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Start subtext typing after title is complete
        setTimeout(() => {
          const fullSubtext = 'AI enabled UPSC Guide';
          let j = 0;
          const subInterval = setInterval(() => {
            if (j < fullSubtext.length) {
              setDisplayedSubtext(fullSubtext.slice(0, j + 1));
              j++;
            } else {
              clearInterval(subInterval);
            }
          }, 100); // Faster for subtext
        }, 500); // Delay before starting subtext
      }
    }, 150); // 150ms per letter for title
    return () => clearInterval(interval);
  }, []);

  // Fetch suggested prompts from backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/upsc-suggested-topics');
        const data = await response.json();
        // Transform backend response to match frontend expectations
        const transformedSuggestions = (data.suggested_topics || []).map(item => ({
          category: item.category,
          prompts: item.topics
        }));
        setSuggestedPrompts(transformedSuggestions);
      } catch (error) {
        console.log('Using default suggestions');
        setSuggestedPrompts(Object.entries(defaultSuggestions).map(([category, prompts]) => ({
          category,
          prompts
        })));
      }
    };
    
    fetchSuggestions();
  }, []);

  // Load saved mind map data from localStorage on component mount
  useEffect(() => {
    const savedMindMapData = localStorage.getItem('mindMapData');
    const savedWord = localStorage.getItem('mindMapWord');
    const savedComplexity = localStorage.getItem('mindMapComplexity');
    const savedElapsedTime = localStorage.getItem('mindMapElapsedTime');
    
    if (savedMindMapData) {
      try {
        const parsedData = JSON.parse(savedMindMapData);
        setMindMapData(parsedData);
      } catch (error) {
        console.error('Error parsing saved mind map data:', error);
      }
    }
    
    if (savedWord) {
      setWord(savedWord);
    }
    
    if (savedComplexity) {
      setComplexityLevel(savedComplexity);
    }

    if (savedElapsedTime) {
      setElapsedTime(savedElapsedTime);
    }
  }, []);

  // Timer for elapsed time during loading
  useEffect(() => {
    let interval;
    if (isGenerating) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentElapsedTime(elapsed.toFixed(1));
      }, 100);
    } else {
      setCurrentElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // If still loading auth state, show nothing or a spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show login prompt for unauthorized users but allow navigation
  const isAuthorized = user && authorized;

  // Focus areas based on preparation stage
  const getFocusAreas = () => {
    switch (complexityLevel) {
      case 'prelims':
        return [
          "Current Affairs",
          "Static GK",
          "Geography",
          "History",
          "Polity",
          "Economy",
          "Environment & Ecology",
          "Science & Technology"
        ];
      case 'mains':
        return [
          "Constitutional Law",
          "International Relations",
          "Economic Development",
          "Public Administration",
          "Ethics & Integrity",
          "Governance",
          "Social Issues",
          "Internal Security"
        ];
      case 'interview':
        return [
          "Current Affairs",
          "Personal Background",
          "Optional Subject",
          "Ethics & Values",
          "Leadership Qualities",
          "Decision Making",
          "Crisis Management",
          "National Issues"
        ];
      default:
        return [
          "Current Affairs",
          "Static GK",
          "Constitutional Law",
          "International Relations",
          "Economic Development",
          "Environment & Ecology",
          "Science & Technology"
        ];
    }
  };

  const generateMindMap = async () => {
  if (!isAuthorized) {
    setError('You must be logged in with an authorized account to generate mind maps. Please log in first.');
    return;
  }

  if (!word.trim()) {
    setError('Please enter a word or concept');
    return;
  }

  if (isGenerating) {
    setError('A mind map is already being generated. Please wait for it to complete.');
    return;
  }

  const trimmedWord = word.trim();
  setWord(trimmedWord); // Use setWord instead of setCurrentGeneratingWord
  setIsGenerating(true);
  setError('');
  setElapsedTime(null);

  const startTime = Date.now();

  try {
    const response = await fetch('/api/upsc-mindmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: word.trim(),
        paper_type: 'GS',
        preparation_stage: complexityLevel,
        focus_areas: getFocusAreas(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform UPSC response to match frontend expectations
    const transformedData = {
      word: data.topic,
      meaning: data.definition,
      synonyms: data.keyConcepts,
      primaryBranches: data.primaryBranches,
      syllabusMapping: data.syllabusMapping,
      previousYearQuestions: data.previousYearQuestions,
      currentAffairsLinks: data.currentAffairsLinks,
    };

    setMindMapData(transformedData);

    const endTime = Date.now();
    const elapsed = ((endTime - startTime) / 1000).toFixed(2);
    setElapsedTime(elapsed);

    // Save to localStorage
    localStorage.setItem('mindMapData', JSON.stringify(transformedData));
    localStorage.setItem('mindMapWord', word.trim());
    localStorage.setItem('mindMapComplexity', complexityLevel);
    localStorage.setItem('mindMapElapsedTime', elapsed);

    // Save to backend after elapsed time is calculated
    try {
      await fetch('/api/save-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'anonymous', // For future user authentication
          topic: word.trim(),
          preparation_stage: complexityLevel,
          focus_areas: getFocusAreas(),
          mindmap_data: transformedData,
          generation_time: parseFloat(elapsed),
        }),
      });
    } catch (error) {
      console.error('Failed to save generation to backend:', error);
      // Don't show error to user as this is not critical functionality
    }
  } catch (error) {
    console.error('Error:', error);
    setError(`Failed to generate mind map: ${error.message}`);
  } finally {
    setIsGenerating(false);
    setWord(''); // Use setWord instead of setCurrentGeneratingWord
  }
};

  const handleSuggestionClick = (suggestion) => {
    setWord(suggestion);
    setShowSuggestions(false);
  };

  const downloadMindMap = () => {
    if (mindMapData) {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // Left and right margin
      const maxWidth = pageWidth - (margin * 2); // Available width for text
      let yPosition = 25;

      // Helper function to add text with word wrapping and return new Y position
      const addWrappedText = (text, x, y, maxWidth, fontSize = 12, lineHeight = 6) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * lineHeight) + 2;
      };

      // Helper function to check if we need a new page
      const checkNewPage = (currentY, minSpace = 30) => {
        if (currentY > pageHeight - minSpace) {
          pdf.addPage();
          return 25; // Reset to top margin
        }
        return currentY;
      };

      // Title
      pdf.setFontSize(18);
      pdf.setTextColor(25, 118, 210); // Blue color
      pdf.setFont('helvetica', 'bold');
      pdf.text('Visual IAS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Topic
      pdf.setFontSize(14);
      pdf.setTextColor(25, 118, 210); // Blue color
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Topic: ${mindMapData.word}`, margin, yPosition);
      yPosition += 12;

      // Definition Section
      yPosition = checkNewPage(yPosition);
      pdf.setFontSize(13);
      pdf.setTextColor(25, 118, 210);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Definition', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(mindMapData.meaning, margin, yPosition, maxWidth, 11, 5);
      yPosition += 8;

      // Related Terms Section
      yPosition = checkNewPage(yPosition);
      pdf.setFontSize(13);
      pdf.setTextColor(25, 118, 210);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Related Terms', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      if (mindMapData.synonyms && mindMapData.synonyms.length > 0) {
        const synonymsText = mindMapData.synonyms.join(', ');
        yPosition = addWrappedText(synonymsText, margin, yPosition, maxWidth, 11, 5);
      }
      yPosition += 8;

      // Branches Section
      if (mindMapData.primaryBranches && mindMapData.primaryBranches.length > 0) {
        yPosition = checkNewPage(yPosition);
        pdf.setFontSize(13);
        pdf.setTextColor(25, 118, 210);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Branches', margin, yPosition);
        yPosition += 8;

        mindMapData.primaryBranches.forEach((branch, index) => {
          yPosition = checkNewPage(yPosition, 40); // Need more space for branches

          // Branch title
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          const branchTitle = `${index + 1}. ${branch.title || 'Untitled Branch'}`;
          yPosition = addWrappedText(branchTitle, margin, yPosition, maxWidth, 12, 6);
          yPosition += 3;

          // Branch items
          const items = branch.items || branch.content || [];
          if (items && items.length > 0) {
            pdf.setFontSize(10);
            items.forEach((item, itemIndex) => {
              yPosition = checkNewPage(yPosition, 20);
              const itemText = typeof item === 'string' ? item : (item.text || item.content || item.toString());
              const bulletText = `   • ${itemText}`;
              yPosition = addWrappedText(bulletText, margin + 5, yPosition, maxWidth - 5, 10, 5);
              yPosition += 2;
            });
          } else {
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text('   (No items available)', margin + 5, yPosition);
            yPosition += 6;
          }
          yPosition += 4;
        });
      }

      // Syllabus Mapping Section
      if (mindMapData.syllabusMapping && Object.keys(mindMapData.syllabusMapping).length > 0) {
        yPosition = checkNewPage(yPosition);
        pdf.setFontSize(13);
        pdf.setTextColor(25, 118, 210);
        pdf.setFont('helvetica', 'bold');
        pdf.text('UPSC Syllabus Mapping', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        Object.entries(mindMapData.syllabusMapping).forEach(([key, value]) => {
          yPosition = checkNewPage(yPosition);
          const mappingText = `${key.toUpperCase()}: ${value}`;
          yPosition = addWrappedText(mappingText, margin, yPosition, maxWidth, 11, 5);
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Previous Year Questions Section
      if (mindMapData.previousYearQuestions && mindMapData.previousYearQuestions.length > 0) {
        yPosition = checkNewPage(yPosition);
        pdf.setFontSize(13);
        pdf.setTextColor(25, 118, 210);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Previous Year Questions', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        mindMapData.previousYearQuestions.forEach((question, index) => {
          yPosition = checkNewPage(yPosition, 25);
          const questionText = `${index + 1}. ${question}`;
          yPosition = addWrappedText(questionText, margin, yPosition, maxWidth, 10, 5);
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Current Affairs Links Section
      if (mindMapData.currentAffairsLinks && mindMapData.currentAffairsLinks.length > 0) {
        yPosition = checkNewPage(yPosition);
        pdf.setFontSize(13);
        pdf.setTextColor(25, 118, 210);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Current Affairs Connections', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        mindMapData.currentAffairsLinks.forEach((link, index) => {
          yPosition = checkNewPage(yPosition, 20);
          const linkText = `${index + 1}. ${link}`;
          yPosition = addWrappedText(linkText, margin, yPosition, maxWidth, 10, 5);
          yPosition += 3;
        });
      }

      // Footer on all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated by Visual IAS - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

        // Add subtle copyright protection watermark
        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.25 })); // More visible opacity
        pdf.setFontSize(60);
        pdf.setTextColor(200, 200, 200); // Very light gray
        pdf.setFont('helvetica', 'bold');

        // Rotate and position the watermark diagonally across the page
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        // First watermark - center position
        pdf.text('VISUAL IAS', centerX, centerY, {
          align: 'center',
          angle: 45 // Diagonal rotation
        });

        // Second watermark - offset position for better coverage
        pdf.text('VISUAL IAS', centerX - 10, centerY + 120, {
          align: 'center',
          angle: 45 // Diagonal rotation
        });

        pdf.restoreGraphicsState();
      }

      // Save the PDF
      pdf.save(`mindmap-${mindMapData.word}.pdf`);
    }
  };

  // Load saved generations from backend
  const loadSavedGenerations = async () => {
    try {
      const response = await fetch('/api/saved-generations?user_id=anonymous');
      const data = await response.json();
      // Filter to only show mind map generations (exclude MCQ generations)
      const mindMapGenerations = data.generations.filter(gen => gen.preparation_stage !== 'mcq-practice');
      setSavedGenerations(mindMapGenerations || []);
    } catch (error) {
      console.error('Failed to load saved generations:', error);
      setError('Failed to load saved generations');
    }
  };

  // Delete a saved generation
  const deleteSavedGeneration = async (generationId) => {
    if (!isAuthorized) {
      setError('You must be logged in with an authorized account to delete saved generations.');
      return;
    }

    try {
      const response = await fetch(`/api/saved-generations/${generationId}?user_id=anonymous`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local state
        setSavedGenerations(prev => prev.filter(gen => gen.id !== generationId));
      } else {
        throw new Error('Failed to delete generation');
      }
    } catch (error) {
      console.error('Failed to delete saved generation:', error);
      setError('Failed to delete saved generation');
    }
  };

  // Load a saved generation
  const loadSavedGeneration = (generation) => {
    setMindMapData(generation.mindmap_data);
    setWord(generation.topic);
    setComplexityLevel(generation.preparation_stage);
    setShowSavedGenerations(false);
    
    // Save to localStorage for persistence
    localStorage.setItem('mindMapData', JSON.stringify(generation.mindmap_data));
    localStorage.setItem('mindMapWord', generation.topic);
    localStorage.setItem('mindMapComplexity', generation.preparation_stage);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Full Screen Prism Background */}
      {!mindMapData && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, overflow: 'hidden' }}>
          <Prism
            animationType="rotate"
            timeScale={0.2}
            height={3.5}
            baseWidth={5.5}
            scale={3.5}
            hueShift={0}
            colorFrequency={1}
            noise={0.1}
            glow={1}
          />
        </Box>
      )}
      {/* Centered Title Overlay */}
      {!mindMapData && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 0, pointerEvents: 'none' }}>
          <Typography 
            variant="h1" 
            sx={{ 
              color: '#1976d2ff', 
              fontWeight: 'bold', 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '3.5rem' },  // Responsive font size: smaller on xs (mobile), larger on md+
              mb: 1 // Small margin bottom
            }}
          >
            {displayedTitle}
          </Typography>
                  <Typography 
            variant="h6" 
            sx={{ 
              color: '#1976d2ff', 
              fontWeight: 'normal', 
              fontSize: { xs: '0.8rem', sm: '1rem', md: '1.2rem' },  // Smaller responsive font size
              opacity: 0.8 // Slightly transparent
            }}
          >
            {displayedSubtext}
          </Typography>
        </Box>
      )}
      <Container maxWidth={{ xs: false, md: 'lg' }} sx={{ py: { xs: 1, md: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, px: { xs: 0, md: 2 } }}>
      {/* Header - removed since it's now in the hero */}
      

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Login Banner for Unauthorized Users */}
      {!isAuthorized && (
        <Alert severity="info" sx={{ mb: { xs: 2, md: 3 }, p: { xs: 2, md: 3 }, backgroundColor: '#e3f2fd', border: '1px solid #2196f3', fontSize: { xs: '0.75rem', md: '1rem' } }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔒 Sign in Required for Full Access
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            You can browse and explore existing mind maps, but generating new ones requires authorization.
            Please log in with an authorized Google account to access all features.
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#1976d2', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              fontSize: '0.8rem',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => setShowInstructionsDialog(true)}
          >
            Learn More.
          </Typography>
        </Alert>
      )}

      {/* Mind Map Results */}
      {mindMapData && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, color: '#1976d2' }}>
            <Box>
              <Typography variant="h4" component="h2">
                {mindMapData.word}
              </Typography>
           {isGenerating ? (
  <Typography variant="body2" sx={{ mt: 1, color: '#1976d2' }}>
    Generating Data and MindMap for "{word}"... Elapsed time: {currentElapsedTime}s
  </Typography>
) : elapsedTime ? (
  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
    Generated in {elapsedTime} seconds
  </Typography>
) : null}
            </Box>
            <Button
              variant="outlined"
              onClick={downloadMindMap}
              className="border-gray-400 text-gray-700 hover:bg-gray-50"
            >
              <Download size={20} />
            </Button>
          </Box>

          {/* Definition Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
              Definition
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {mindMapData.meaning}
            </Typography>
          </Paper>

          {/* Synonyms Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
              Related Terms
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {mindMapData.synonyms && mindMapData.synonyms.length > 0 ? (
                mindMapData.synonyms.map((synonym, index) => (
                  <Chip
                    key={index}
                    label={synonym}
                    variant="filled"
                    className="bg-blue-100 text-blue-800"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No related terms available
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Primary Branches Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
               Branches
            </Typography>
            <Grid container spacing={2}>
              {mindMapData.primaryBranches && mindMapData.primaryBranches.map((branch, index) => (
                <Grid item xs={12} sm={6} md={6} key={branch.id}>
                  {renderBranchCard(branch, index)}
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Syllabus Mapping Section */}
          {mindMapData.syllabusMapping && Object.keys(mindMapData.syllabusMapping).length > 0 && (
            <Paper elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                UPSC Syllabus Mapping
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(mindMapData.syllabusMapping).map(([key, value]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {key}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Previous Year Questions Section */}
          {mindMapData.previousYearQuestions && mindMapData.previousYearQuestions.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                Previous Year Questions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {mindMapData.previousYearQuestions.map((question, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {question}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

          {/* Current Affairs Links Section */}
          {mindMapData.currentAffairsLinks && mindMapData.currentAffairsLinks.length > 0 && (
            <Paper elevation={1} sx={{ p: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                Current Affairs Connections
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {mindMapData.currentAffairsLinks.map((link, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {link}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}
        </Paper>
      )}

      {/* Suggestions Dialog */}
      <Dialog
        open={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Suggested Topics
            </Typography>
            <IconButton autoFocus onClick={() => setShowSuggestions(false)}>
              <X size={24} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {suggestedPrompts.map(({ category, prompts }) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {category === 'Science' && <TestTube size={24} className="mr-2 text-green-600" />}
                {category === 'Social Studies' && <Globe size={24} className="mr-2 text-blue-600" />}
                {category === 'Philosophy' && <School size={24} className="mr-2 text-purple-600" />}
                {category === 'Technology' && <Computer size={24} className="mr-2 text-orange-600" />}
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{category}</Typography>
              </Box>
              <Grid container spacing={1}>
                {prompts.map((prompt) => (
                  <Grid item key={prompt}>
                    <Chip
                      label={prompt}
                      onClick={() => handleSuggestionClick(prompt)}
                      clickable
                      variant="outlined"
                      className="mb-2 mr-2 hover:bg-blue-50 border-blue-300 text-blue-700"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      {/* Saved Generations Dialog */}
      <Dialog
        open={showSavedGenerations}
        onClose={() => setShowSavedGenerations(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Saved Generations</Typography>
            <IconButton autoFocus onClick={() => setShowSavedGenerations(false)}>
              <X size={24} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {savedGenerations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No saved generations yet. Generate some mind maps to see them here!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {savedGenerations.map((generation) => (
                <Paper key={generation.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
                        {generation.topic}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={generation.preparation_stage}
                          size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(generation.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {generation.generation_time}s
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {generation.focus_areas.slice(0, 3).map((area, index) => (
                          <Chip
                            key={index}
                            label={area}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {generation.focus_areas.length > 3 && (
                          <Chip
                            label={`+${generation.focus_areas.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => loadSavedGeneration(generation)}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Load
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => deleteSavedGeneration(generation.id)}
                        disabled={!isAuthorized}
                        sx={{ color: '#d32f2f' }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Instructions Dialog */}
      <InstructionsDialog
        open={showInstructionsDialog}
        onClose={() => setShowInstructionsDialog(false)}
      />

      {/* Reset Button */}
      {mindMapData && (
        <Box
          sx={{
            position: 'fixed',  // Fixed position on all screen sizes
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            onClick={() => {
              setWord('');
              setMindMapData(null);
              setError('');
              // Clear localStorage
              localStorage.removeItem('mindMapData');
              localStorage.removeItem('mindMapWord');
              localStorage.removeItem('mindMapComplexity');
              localStorage.removeItem('mindMapElapsedTime');
              // Clear saved generations from state
              setSavedGenerations([]);
            }}
            className="bg-blue-600 hover:bg-blue-700 rounded-full p-4 shadow-lg"
            sx={{ minWidth: { xs: 48, md: 56 }, height: { xs: 48, md: 56 } }}
          >
            <RefreshCw size={24} />
          </Button>
        </Box>
      )}
      </Container>
      {/* Search Bar at Bottom */}
      <Container maxWidth={{ xs: false, md: 'lg' }} sx={{ py: { xs: 1, md: 4 }, px: { xs: 0, md: 2 } }}>
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 3 }, backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: { xs: 'none', md: 'blur(10px)' } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Search"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && isAuthorized && generateMindMap()}
                placeholder="e.g., Democracy"
                variant="outlined"
                disabled={isGenerating || !isAuthorized}
                id="search-input"
                name="word"
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel htmlFor="complexity-select">Objective</InputLabel>
                <Select
                  value={complexityLevel}
                  onChange={(e) => setComplexityLevel(e.target.value)}
                  label="Objective"
                  disabled={isGenerating}
                  inputProps={{ id: 'complexity-select' }}
                  name="complexityLevel"
                >
                  <MenuItem value="prelims">Prelims</MenuItem>
                  <MenuItem value="mains">Mains</MenuItem>
                  <MenuItem value="interview">Interview</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} sm={1} md={1}>
              <Tooltip title="Send" arrow placement="top">
                <span>
                  <Button
                    
                    variant="contained"
                    size="medium"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      generateMindMap();
                    }}
                    disabled={isGenerating || !word.trim() || !isAuthorized}
                    className="bg-blue-600 hover:bg-blue-700"
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                        backgroundColor: '#1d4ed8'
                      }
                    }}
                  >
                    <Send size={20} />
                 
                  </Button>
                </span>
              </Tooltip>
            </Grid>
            <Grid item xs={4} sm={1} md={1}>
              <Tooltip title="Suggested Topics" arrow placement="top">
                <span>
                  <Button
                    
                    variant="outlined"
                    size="medium"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      setShowSuggestions(true);
                    }}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                        backgroundColor: '#eff6ff',
                        borderColor: '#2563eb'
                      }
                    }}
                  >
                    <Lightbulb size={20} />
                 
                  </Button>
                </span>
              </Tooltip>
            </Grid>
            <Grid item xs={4} sm={1} md={1}>
              <Tooltip title="Saved Generations" arrow placement="top">
                <span>
                  <Button
                    
                    variant="outlined"
                    size="medium"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      loadSavedGenerations();
                      setShowSavedGenerations(true);
                    }}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                        backgroundColor: '#f0fdf4',
                        borderColor: '#16a34a'
                      }
                    }}
                  >
                    <Archive size={20} />
                 
                  </Button>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      {/* Loading Status */}
      {isGenerating && !mindMapData && (
  <Container maxWidth={{ xs: false, md: 'lg' }} sx={{ py: { xs: 1, md: 2 }, px: { xs: 0, md: 2 } }}>
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
        Generating Data and MindMap for "{word}"
      </Typography>
      <Typography variant="body1" sx={{ color: '#1976d2' }}>
        Elapsed time: {currentElapsedTime}s
      </Typography>
    </Paper>
  </Container>
)}
      <Footer />
    </Box>
  );
};

export default Home;

