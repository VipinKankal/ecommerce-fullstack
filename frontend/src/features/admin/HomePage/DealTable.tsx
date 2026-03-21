import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // Import Edit Icon

const DealTable = () => {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: '1px solid #eee', borderRadius: '12px' }}
    >
      <Table>
        <TableHead sx={{ bgcolor: '#f9fafb' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>No</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Discount</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[1, 2, 3].map((row) => (
            <TableRow key={row} hover>
              <TableCell>{row}</TableCell>
              <TableCell>
                <Avatar
                  variant="rounded"
                  src={`https://picsum.photos/200?random=${row}`}
                  sx={{ width: 45, height: 45 }}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 500 }}>Summer Flash Sale</TableCell>
              <TableCell>
                <Box
                  component="span"
                  sx={{ color: 'success.main', fontWeight: 'bold' }}
                >
                  40% OFF
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
                >
                  {/* Edit Button */}
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{
                      bgcolor: '#f0f7ff',
                      '&:hover': { bgcolor: '#e0effe' },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    color="error"
                    sx={{
                      bgcolor: '#fff5f5',
                      '&:hover': { bgcolor: '#ffe0e0' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DealTable;
