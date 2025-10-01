import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import moment from 'moment';

export default function PriceForm() {
  const [prices, setPrices] = useState([
    {
      id: Date.now(),
      startDate: moment(),
      endDate: moment().add(1, 'month'),
      price: '',
    },
  ]);

  const addPrice = () => {
    setPrices([
      ...prices,
      {
        id: Date.now(),
        startDate: moment(),
        endDate: moment().add(1, 'month'),
        price: '',
      },
    ]);
  };

  const removePrice = (id) => {
    setPrices(prices.filter((price) => price.id !== id));
  };

  const updatePrice = (id, field, value) => {
    setPrices(
      prices.map((price) =>
        price.id === id ? { ...price, [field]: value } : price
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted prices:', prices);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Item Pricing
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {prices.map((priceItem) => (
              <Paper key={priceItem.id} sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="h6">Price Entry</Typography>
                    {prices.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => removePrice(priceItem.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={priceItem.startDate}
                    onChange={(newValue) =>
                      updatePrice(priceItem.id, 'startDate', newValue)
                    }
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <DateTimePicker
                    label="End Date & Time"
                    value={priceItem.endDate}
                    onChange={(newValue) =>
                      updatePrice(priceItem.id, 'endDate', newValue)
                    }
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <TextField
                    label="Price"
                    type="number"
                    value={priceItem.price}
                    onChange={(e) =>
                      updatePrice(priceItem.id, 'price', e.target.value)
                    }
                    fullWidth
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addPrice}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Price
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ alignSelf: 'flex-start' }}
            >
              Save Prices
            </Button>
          </Stack>
        </form>
      </Box>
    </LocalizationProvider>
  );
}
