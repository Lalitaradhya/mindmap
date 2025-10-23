import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { X } from 'lucide-react';

const InstructionsDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Visual IAS</Typography>
          <IconButton autoFocus onClick={onClose}>
            <X size={24} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
            Welcome to Visual IAS - Your AI-Powered UPSC Study Companion!
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>About Visual IAS:</strong><br />
            An intelligent platform designed exclusively for UPSC aspirants, offering AI-generated mind maps, multiple-choice questions, and comprehensive study materials to enhance conceptual understanding and examination preparation.
            <br /><br />
            <strong>Progressive Web App:</strong> Visual IAS is a modern Progressive Web App (PWA) that automatically adjusts its interface and functionality to work seamlessly across any device - from smartphones and tablets to desktops and laptops. This eliminates the need for separate native Android or iOS applications, providing a consistent, high-quality experience everywhere.
            <br /><br />
            <strong>Our Goal:</strong> To make UPSC preparation accessible and cost-effective for all aspirants, democratizing quality education through innovative technology and removing financial barriers to competitive exam success.
          </Typography>

          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
            How to:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Enter a Topic:</strong> Input any UPSC-relevant topic (e.g., "Democracy", "Climate Change", "Constitutional Law") in the search field
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Select Preparation Level:</strong> Choose your examination stage - Preliminary, Mains, or Interview
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Generate Mind Maps:</strong> Click the send button or press Enter to create comprehensive, AI-powered mind maps
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Generate MCQs:</strong> Access the AI-powered MCQ generator through the navigation bar for practice questions
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Explore Content:</strong> Navigate through detailed definitions, related terminology, conceptual branches, syllabus mapping, and previous year questions
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Download Resources:</strong> Export your personalized mind maps as PDF documents for offline study and revision
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Manage Collections:</strong> Access and organize your saved generations using the archive feature for systematic revision
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1, fontSize: '1rem' }}>
            How to - Without Logging In:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Explore Saved Generations:</strong> Click the "Saved Generations" button (archive icon) in the search bar to access previously generated mind maps.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>View Generated Content:</strong> Browse through existing mind maps with their complete data, including definitions, related terms, branches, syllabus mapping, and previous year questions
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Access Mind Maps:</strong> Use the menu button (on mobile) or navigation bar (on desktop) to explore different mind map collections and study materials
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Device-Specific Navigation:</strong> On mobile devices, access mind maps through the hamburger menu; on desktop, use the navigation bar for seamless browsing
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Test Yourself with MCQs:</strong> Explore and practice with previously generated UPSC-style multiple-choice questions in the AI MCQ sections to assess your preparation and understanding
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
            UPSC Preparation Benefits:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Visual Learning Enhancement:</strong> Transform complex theoretical concepts into intuitive, easy-to-understand mind maps
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Comprehensive Study Material:</strong> Access consolidated definitions, related concepts, syllabus alignment, and previous year questions in a single platform
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Current Affairs Integration:</strong> Connect theoretical knowledge with contemporary developments through relevant current affairs linkages
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Structured Revision Framework:</strong> Organized content facilitates systematic revision and enhances answer writing proficiency
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Efficient Time Management:</strong> AI-generated content minimizes research time, enabling focused conceptual understanding
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>Multi-Stage Preparation:</strong> Customized content delivery for Preliminary, Mains, and Personality Test preparation phases
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 1 }}>
            Important:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ffcc02' }}>
            <strong>Testing Phase:</strong> Visual IAS is currently in its testing phase. Content generation features (AI insights, mind maps, MCQs, and study materials) are restricted to authorized administrators only.
            However, you can explore previously generated content to understand the platform's capabilities and features.
            <br /><br />
            For access requests, queries, or suggestions, please contact us at: <strong>visualiasonline@gmail.com</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1, border: '1px solid #4caf50' }}>
            <strong>Daily Content Updates:</strong> We are constantly adding new UPSC mindmaps and MCQs everyday.
          </Typography>

          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            <strong>Recommended Approach:</strong> Begin with broad conceptual topics and progressively explore sub-branches for comprehensive understanding. Consistent revision utilizing saved mind maps substantially improves information retention and analytical clarity.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;
