import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Product } from 'shared/types/product.types';
import { SellerMovementRow, SellerRecommendationMeta } from './ProductsTable.types';
import { formatDateTime, prettify } from './ProductsTable.helpers';

type Props = {
  movementProduct: Product | null;
  movementRows: SellerMovementRow[];
  movementLoading: boolean;
  movementError: string;
  recommendation: SellerRecommendationMeta | null;
  onClose: () => void;
};

const MovementHistoryDialog = ({
  movementProduct,
  movementRows,
  movementLoading,
  movementError,
  recommendation,
  onClose,
}: Props) => (
  <Dialog open={Boolean(movementProduct)} onClose={onClose} fullWidth maxWidth="lg">
    <DialogTitle>Stock Movement History</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography variant="body2" color="text.secondary">
              {movementProduct?.title} | Product #{movementProduct?.id}
            </Typography>
            {recommendation && (
              <Typography variant="caption" color="text.secondary">
                {recommendation.detail}
              </Typography>
            )}
          </div>
          {recommendation && (
            <Chip
              size="small"
              color={recommendation.tone}
              label={recommendation.headline}
            />
          )}
        </div>
        {movementError && <Alert severity="error">{movementError}</Alert>}
        <TableContainer
          component={Paper}
          sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #eef2f7' }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Movement</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Flow</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actors</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movementLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : movementRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No stock history found yet.
                  </TableCell>
                </TableRow>
              ) : (
                movementRows.map((movement) => (
                  <TableRow key={movement.id} hover>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>{prettify(movement.action)}</TableCell>
                    <TableCell>{prettify(movement.movementType)}</TableCell>
                    <TableCell>
                      {movement.from || '-'} to {movement.to || '-'}
                    </TableCell>
                    <TableCell>{movement.quantity ?? 0}</TableCell>
                    <TableCell>
                      {movement.addedBy || '-'} / {movement.updatedBy || '-'}
                    </TableCell>
                    <TableCell>{movement.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default MovementHistoryDialog;
