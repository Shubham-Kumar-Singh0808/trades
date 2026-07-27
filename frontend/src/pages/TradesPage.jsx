import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const getModeLabel = (mode) => {
  if (mode === 'AIR') return 'Air';
  if (mode === 'SEA') return 'Sea';
  // Legacy aliases
  if (mode === 'ONLINE' || mode === 'DIRECT') return 'Air';
  if (mode === 'HYBRID' || mode === 'HOPPING' || mode === 'OFFLINE') return 'Sea';
  return mode;
};

export default function TradesPage({ session }) {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [fullDescription, setFullDescription] = useState('');
  const [form, setForm] = useState({
    tradeId: '',
    mode: 'AIR',
    description: '',
    notificationScope: 'ALL_ACTIVE',
    vendorIds: [],
    jobSheetFile: null,
    trackingListFile: null,
  });
  const roles = session?.roles || [];
  const canCreateTrade = roles.includes('ADMIN') || roles.includes('EXECUTIVE');
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [stats, setStats] = useState(null);
  const [reportMode, setReportMode] = useState('SEA');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const loadStats = async () => {
    try {
      const res = await api.get('/api/trades/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const loadReport = async () => {
    if (!startDate || !endDate) {
      setReportError("Please select both start and end dates.");
      return;
    }
    setReportError('');
    setReportLoading(true);
    try {
      const startIso = new Date(startDate + "T00:00:00").toISOString();
      const endIso = new Date(endDate + "T23:59:59").toISOString();
      const res = await api.get('/api/trades/report', {
        params: {
          mode: reportMode,
          startDate: startIso,
          endDate: endIso
        }
      });
      setReportData(res.data);
    } catch (err) {
      setReportError(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReportExcel = () => {
    if (!reportData || reportData.length === 0) return;

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = "";
    csvContent += `Trade Report - ${reportMode} (${startDate} to ${endDate})\n\n`;

    const headers = [
      "Trade ID", "Mode", "Created At", "Closed At", "Status", "Weight", "Final Rate", "Winner", "Company", "Total Amount (INR)", "Description"
    ];
    csvContent += headers.join(",") + "\n";

    reportData.forEach(item => {
      const row = [
        item.tradeId,
        item.mode,
        item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : "",
        item.closedAt ? new Date(item.closedAt).toLocaleDateString('en-GB') : "",
        item.status,
        escapeCSV(item.weight),
        item.finalL1Rate || "",
        escapeCSV(item.winnerVendorName || ""),
        escapeCSV(item.winnerCompanyName || ""),
        item.totalAmount || "",
        escapeCSV(item.description)
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Trade_Report_${reportMode}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadTrades = async (targetPage = page, filters = {}) => {
    setError('');
    try {
      const params = { page: targetPage - 1, size: 10, sort: 'createdAt,desc' };
      if (filters.query !== undefined) {
        if (filters.query.trim()) params.query = filters.query.trim();
      } else if (query.trim()) {
        params.query = query.trim();
      }
      if (filters.mode !== undefined) {
        if (filters.mode !== 'ALL') params.mode = filters.mode;
      } else if (modeFilter !== 'ALL') {
        params.mode = modeFilter;
      }
      if (filters.status !== undefined) {
        if (filters.status !== 'ALL') params.status = filters.status;
      } else if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get('/api/trades', { params });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load trades');
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get('/api/vendors', { params: { page: 0, size: 100, sort: 'name,asc' } });
      setVendors(res.data.content || []);
    } catch {
      // ignore vendor list errors for non-admin/vendor scope usage
    }
  };

  useEffect(() => {
    loadTrades(1);
    if (canCreateTrade) {
      loadVendors();
      loadStats();
    }
  }, [canCreateTrade]);

  const applyFilters = async () => {
    setPage(1);
    await loadTrades(1);
  };

  const resetFilters = async () => {
    setQuery('');
    setModeFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
    await loadTrades(1, { query: '', mode: 'ALL', status: 'ALL' });
  };

  const createTrade = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.jobSheetFile || !form.trackingListFile) {
      setError('Both Job Sheet PDF and Packing List PDF are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tradeId', form.tradeId);
      formData.append('mode', form.mode);
      formData.append('description', form.description);
      formData.append('notificationScope', form.notificationScope);
      if (form.notificationScope === 'SELECTED') {
        form.vendorIds.forEach((id) => formData.append('vendorIds', id));
      }
      formData.append('jobSheetFile', form.jobSheetFile);
      formData.append('trackingListFile', form.trackingListFile);

      await api.post('/api/trades', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ tradeId: '', mode: 'AIR', description: '', notificationScope: 'ALL_ACTIVE', vendorIds: [], jobSheetFile: null, trackingListFile: null });
      setCreateModalOpen(false);
      loadTrades(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create trade');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Trades</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      {canCreateTrade && stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 1 }}>
          <Card sx={{ backgroundColor: 'rgba(58, 138, 58, 0.04)', border: '1px solid rgba(58, 138, 58, 0.12)' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Total Trades</Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mt: 1 }}>{stats.totalTrades}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ backgroundColor: 'rgba(21, 101, 192, 0.04)', border: '1px solid rgba(21, 101, 192, 0.12)' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Air Trades</Typography>
              <Typography variant="h4" sx={{ color: '#1565c0', fontWeight: 700, mt: 1 }}>{stats.airTrades}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ backgroundColor: 'rgba(2, 136, 209, 0.04)', border: '1px solid rgba(2, 136, 209, 0.12)' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Sea Trades</Typography>
              <Typography variant="h4" sx={{ color: '#0288d1', fontWeight: 700, mt: 1 }}>{stats.seaTrades}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {canCreateTrade && (
        <Card sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#3a8a3a', fontWeight: 600, mb: 2 }}>Trade Report Generator</Typography>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 150 }} fullWidth>
                <InputLabel>Report Mode</InputLabel>
                <Select value={reportMode} label="Report Mode" onChange={(e) => setReportMode(e.target.value)}>
                  <MenuItem value="AIR">Air</MenuItem>
                  <MenuItem value="SEA">Sea</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
              />
              
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
              />
              
              <Button
                variant="contained"
                onClick={loadReport}
                disabled={reportLoading}
                sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, minWidth: 150, height: 56 }}
                fullWidth
              >
                Generate Report
              </Button>
            </Stack>

            {reportError && <Alert severity="error" sx={{ mb: 2 }}>{reportError}</Alert>}

            {reportData && reportData.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Report Results ({reportData.length} records)</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={downloadReportExcel}
                    sx={{ color: '#2e7d32', borderColor: '#2e7d32', '&:hover': { borderColor: '#1b5e20', backgroundColor: 'rgba(46, 125, 50, 0.04)' } }}
                  >
                    Download Report (Excel)
                  </Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trade ID</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Final Rate</TableCell>
                      <TableCell>Winner Vendor</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Total Amount (INR)</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><strong>{item.tradeId}</strong></TableCell>
                        <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.weight || '—'}</TableCell>
                        <TableCell>
                          {item.finalL1Rate != null 
                            ? (reportMode === 'SEA' ? `$${item.finalL1Rate}` : `Rs. ${item.finalL1Rate}`) 
                            : '—'}
                        </TableCell>
                        <TableCell>{item.winnerVendorName || '—'}</TableCell>
                        <TableCell>{item.winnerCompanyName || '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>
                          {item.totalAmount != null ? `₹${Number(item.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Button component={Link} to={`/trades/${item.id}`} size="small" sx={{ color: '#3a8a3a', fontWeight: 600 }}>Open</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : startDate && endDate && !reportLoading ? (
              <Typography color="text.secondary" align="center" sx={{ my: 3 }}>No report records found for the selected filters.</Typography>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" flexWrap="wrap" alignItems="center" sx={{ mb: 2, width: '100%' }}>
            <Typography variant="h6">Trade List</Typography>
            {canCreateTrade && (
              <Button variant="contained" onClick={() => setCreateModalOpen(true)} sx={{ ml: 'auto', backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Create Trade</Button>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Search trades"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyFilters();
                }
              }}
              fullWidth
              helperText="Search by trade ID, description, or creator."
            />
            <FormControl fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select value={modeFilter} label="Mode" onChange={(e) => setModeFilter(e.target.value)}>
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="AIR">Air</MenuItem>
                <MenuItem value="SEA">Sea</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="ROUND_CLOSED">Round Closed</MenuItem>
                <MenuItem value="FINALIZED">Finalized</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
              <Button variant="contained" onClick={applyFilters} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>
                Apply
              </Button>
              <Button variant="outlined" onClick={resetFilters}>
                Reset
              </Button>
            </Stack>
          </Stack>

          {isSm ? (
            <Stack spacing={1}>
              {data?.content?.map((t) => {
                const maxLen = 80;
                const isLong = t.description && (t.description.length > maxLen || t.description.includes('\n'));
                return (
                  <Card key={t.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">{t.tradeId}</Typography>
                          <Typography variant="caption" color="text.secondary">{getModeLabel(t.mode)}</Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'pre-line',
                            wordBreak: 'break-word',
                            mb: isLong ? 0.5 : 0
                          }}
                        >
                          {t.description}
                        </Typography>
                        {isLong && (
                          <Button
                            size="small"
                            onClick={() => {
                              setFullDescription(t.description);
                              setDescriptionModalOpen(true);
                            }}
                            sx={{
                              p: 0,
                              minWidth: 0,
                              alignSelf: 'flex-start',
                              color: '#3a8a3a',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Show More
                          </Button>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Round {t.currentRound} {t.cancelled ? '• Cancelled' : t.tradeClosed ? '• Finalized' : t.biddingOpen ? '• Open' : '• Closed'}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">{t.createdBy}</Typography>
                          <Button component={Link} to={`/trades/${t.id}`} size="small" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.1)' } }}>Open</Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Trade ID</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Round</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.content?.map((t) => {
                  const maxLen = 80;
                  const isLong = t.description && (t.description.length > maxLen || t.description.includes('\n'));
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{t.tradeId}</TableCell>
                      <TableCell>{getModeLabel(t.mode)}</TableCell>
                      <TableCell>{t.currentRound}</TableCell>
                      <TableCell>{t.cancelled ? 'Cancelled' : t.tradeClosed ? 'Finalized' : t.biddingOpen ? 'Open' : 'Closed'}</TableCell>
                      <TableCell sx={{ maxWidth: 400, wordBreak: 'break-word' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'pre-line',
                            mb: isLong ? 0.5 : 0
                          }}
                        >
                          {t.description}
                        </Typography>
                        {isLong && (
                          <Button
                            size="small"
                            onClick={() => {
                              setFullDescription(t.description);
                              setDescriptionModalOpen(true);
                            }}
                            sx={{
                              p: 0,
                              minWidth: 0,
                              color: '#3a8a3a',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Show More
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{t.createdBy}</TableCell>
                      <TableCell>
                        <Button component={Link} to={`/trades/${t.id}`} size="small" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.1)' } }}>Open</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!!data && (
            <Pagination
              sx={{ mt: 2 }}
              count={Math.max(data.totalPages || 1, 1)}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                loadTrades(value);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createModalOpen && canCreateTrade} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Trade</DialogTitle>
        <DialogContent>
          <Stack component="form" spacing={2} sx={{ mt: 1 }} onSubmit={createTrade}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Trade ID" value={form.tradeId} onChange={(e) => setForm((p) => ({ ...p, tradeId: e.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={form.mode} label="Mode" onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}>
                  <MenuItem value="AIR">Air</MenuItem>
                  <MenuItem value="SEA">Sea</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Notification Scope</InputLabel>
                <Select
                  value={form.notificationScope}
                  label="Notification Scope"
                  onChange={(e) => setForm((p) => ({ ...p, notificationScope: e.target.value, vendorIds: [] }))}
                >
                  <MenuItem value="ALL_ACTIVE">ALL_ACTIVE</MenuItem>
                  <MenuItem value="ALL">ALL</MenuItem>
                  <MenuItem value="SELECTED">SELECTED</MenuItem>
                </Select>
              </FormControl>
              {form.notificationScope === 'SELECTED' && (
                <FormControl fullWidth>
                  <InputLabel>Selected Vendors</InputLabel>
                  <Select
                    multiple
                    value={form.vendorIds}
                    label="Selected Vendors"
                    onChange={(e) => setForm((p) => ({ ...p, vendorIds: e.target.value }))}
                  >
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.id}>{v.name} ({v.companyName})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
            <Box>
              <Button component="label" variant="outlined" sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)', borderColor: '#3a8a3a' } }}>
                Upload Job Sheet PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setForm((p) => ({ ...p, jobSheetFile: e.target.files?.[0] || null }))}
                />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {form.jobSheetFile ? form.jobSheetFile.name : 'No file selected'}
              </Typography>
            </Box>
            <Box>
              <Button component="label" variant="outlined" sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)', borderColor: '#3a8a3a' } }}>
                Upload Packing List PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setForm((p) => ({ ...p, trackingListFile: e.target.files?.[0] || null }))}
                />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {form.trackingListFile ? form.trackingListFile.name : 'No file selected'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={createTrade} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>Create Trade</Button>
        </DialogActions>
      </Dialog>

      {/* Description Modal */}
      <Dialog
        open={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Full Description</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              color: 'text.primary',
              lineHeight: 1.6
            }}
          >
            {fullDescription}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDescriptionModalOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: '#3a8a3a',
              '&:hover': { backgroundColor: '#2d6b2d' },
              borderRadius: '20px',
              px: 3
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
