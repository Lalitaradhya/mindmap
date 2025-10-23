import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Chip
} from '@mui/material';

export const renderBranchCard = (branch, index) => (
    <Card key={branch.id} sx={{ mb: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ fontSize: 24, mr: 2 }}>{branch.icon}</Box>
          <Typography variant="h6" sx={{ color: branch.color, fontWeight: 'bold' }}>
            {branch.title}
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {branch.items.map((item, itemIndex) => (
            <Grid item xs={12} key={itemIndex}>
              <Chip
                label={item}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: branch.color,
                  color: branch.color,
                  backgroundColor: `${branch.color}10`,
                  mb: 1.5,
                  mr: 1.5,
                  px: 1,
                  py: 0.5,
                  maxWidth: 'none',
                  whiteSpace: 'normal',
                  height: 'auto',
                  '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
