import React from 'react';
import { 
    Box, 
    Button, 
    TextField, 
    MenuItem, 
    Typography, 
    Paper 
} from '@mui/material';

const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home_appliances', label: 'Home Appliances' },
    { value: 'beauty', label: 'Beauty' },
];

const DealCategoryTable = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Paper elevation={0} sx={{ width: '100%', maxWidth: '700px', p: 3 }}>
                <Typography 
                    variant="h4" 
                    align="center" 
                    sx={{ mb: 4, fontWeight: 500 }}
                >
                    Create Deal
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Discount Input */}
                    <TextField
                        fullWidth
                        label="discount"
                        type="number"
                        defaultValue={0}
                        variant="outlined"
                    />

                    {/* Category Dropdown */}
                    <TextField
                        select
                        fullWidth
                        label="Category"
                        defaultValue=""
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#26a69a', // Teal border color from your image
                                },
                            },
                        }}
                    >
                        {categories.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Create Deal Button */}
                    <Button 
                        fullWidth 
                        variant="contained" 
                        size="large"
                        sx={{ 
                            backgroundColor: '#00897b', // Dark teal matching the image
                            '&:hover': {
                                backgroundColor: '#00695c',
                            },
                            py: 1.5,
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                        }}
                    >
                        CREATE DEAL
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default DealCategoryTable;
